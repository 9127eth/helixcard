import { db, storage } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  increment,
  updateDoc,
  deleteDoc,
  deleteField,
  arrayUnion,
  arrayRemove,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Contact, Tag } from '@/app/types';
import { FREE_USER_CONTACT_LIMIT } from './constants';
import { auth } from './firebase';
import { refreshUsageAfterDelete, syncUsage } from './usageClient';

// A Firestore batch holds at most 500 writes; stay comfortably below that.
const MAX_BATCH_WRITES = 400;

// Mirrors storage.rules for contacts/{uid}/: images only, under 10 MiB.
export const MAX_CONTACT_IMAGE_BYTES = 10 * 1024 * 1024;

function chunked<T>(items: T[]): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += MAX_BATCH_WRITES) {
    chunks.push(items.slice(start, start + MAX_BATCH_WRITES));
  }
  return chunks;
}

function contactImageExtension(file: File): string {
  const subtype = file.type.split('/')[1]?.toLowerCase();
  if (subtype === 'jpeg') return 'jpg';
  return ['png', 'gif', 'webp', 'jpg'].includes(subtype) ? subtype : 'jpg';
}

async function deleteStorageObjectBestEffort(imageUrl: string, context: string) {
  if (!storage || !imageUrl) return;

  try {
    await deleteObject(ref(storage, imageUrl));
  } catch (error) {
    // Leaving an orphan for a later cleanup is preferable to failing (or
    // masking the real error of) the save/delete that triggered this.
    console.error(`Unable to clean up ${context}:`, error);
  }
}

/**
 * Dedupe tag ids and drop any that no longer exist. A contact can still hold
 * the id of a tag deleted elsewhere; refusing the whole save for that made the
 * contact impossible to edit.
 */
async function existingTagIds(userId: string, tagIds: string[]): Promise<string[]> {
  const uniqueIds = [...new Set(tagIds.filter(id => typeof id === 'string' && id))];
  if (!db || uniqueIds.length === 0) return uniqueIds;

  const snapshot = await getDocs(collection(db, 'users', userId, 'tags'));
  const knownIds = new Set(snapshot.docs.map(tag => tag.id));
  return uniqueIds.filter(id => knownIds.has(id));
}

function splitName(name: string) {
  const nameParts = name.split(' ');
  return { firstName: nameParts[0], lastName: nameParts.slice(1).join(' ') };
}

/**
 * Milliseconds since the epoch for any shape a contact date arrives in:
 * Firestore Timestamps (web and iOS writes), ISO strings (a few legacy web rows
 * and freshly created contacts), Dates, numbers or a plain `{ seconds }`.
 * Anything else counts as 0.
 */
export function toMillis(value: unknown): number {
  let millis = NaN;
  if (typeof value === 'number') {
    millis = value;
  } else if (typeof value === 'string') {
    millis = Date.parse(value);
  } else if (value instanceof Date) {
    millis = value.getTime();
  } else if (value && typeof value === 'object') {
    const timestamp = value as { toMillis?: () => number; seconds?: unknown; nanoseconds?: unknown };
    if (typeof timestamp.toMillis === 'function') {
      millis = timestamp.toMillis();
    } else if (typeof timestamp.seconds === 'number') {
      const nanoseconds = typeof timestamp.nanoseconds === 'number' ? timestamp.nanoseconds : 0;
      millis = timestamp.seconds * 1000 + nanoseconds / 1e6;
    }
  }
  return Number.isFinite(millis) ? millis : 0;
}

/**
 * E.164 only when that loses nothing. A number that does not parse as valid
 * (often a non-US number typed without its country code) or that carries an
 * extension is kept as typed rather than rewritten as a US number.
 */
export function normalizeContactPhone(phone: string): string {
  const typed = phone.trim();
  const parsed = parsePhoneNumberFromString(typed, 'US');
  return parsed?.isValid() && !parsed.ext ? parsed.format('E.164') : typed;
}

/** National format for North American numbers, international otherwise. */
export function formatContactPhone(phone: string): string {
  const parsed = parsePhoneNumberFromString(phone, 'US');
  if (!parsed?.isValid()) return phone;
  return parsed.countryCallingCode === '1' ? parsed.formatNational() : parsed.formatInternational();
}

/** Why storage.rules would refuse this contact image, or null if it is fine. */
export function contactImageError(file: Pick<File, 'type' | 'size'>): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.';
  if (file.size >= MAX_CONTACT_IMAGE_BYTES) return 'Please choose an image under 10 MB.';
  return null;
}

// Create a new contact
export async function createContact(
  userId: string,
  contactData: Partial<Contact>,
  imageFile?: File | null
) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const contactsRef = collection(db, 'users', userId, 'contacts');
  
  // Ensure name is always present
  const name = contactData.name?.trim();
  if (!name) {
    throw new Error('Name is required');
  }

  const tags = await existingTagIds(userId, contactData.tags || []);

  // Parse name into components
  const { firstName, lastName } = splitName(name);

  // The server owns the entitlement decision and seeds the counter that the
  // Firestore rule checks this create against.
  const usage = await syncUsage();
  if (usage && !usage.canCreateContact) {
    throw new Error(
      usage.isPro
        ? `You have reached the ${usage.contactLimit} contact limit for your plan.`
        : 'Upgrade to Helix Pro to save more contacts.'
    );
  }

  // Upload first so the contact is written once, image included. Creating it
  // first spent a contact slot before an upload that could still fail, and
  // retrying then saved a duplicate.
  const imageUrl = imageFile
    ? await uploadContactImageFile(userId, imageFile)
    : contactData.imageUrl;

  const newContact = {
    ...contactData,
    firstName,
    lastName,
    name, // Ensure name is explicitly set
    dateAdded: serverTimestamp(),
    dateModified: serverTimestamp(),
    contactSource: contactData.contactSource || 'manual',
    tags
  };
  // Firestore rejects undefined values, so the field is only written with a URL.
  if (imageUrl) {
    newContact.imageUrl = imageUrl;
  } else {
    delete newContact.imageUrl;
  }

  // The rule requires the +1 on the owner document to be part of the same batch
  // as the contact itself, so a create always pays for its quota.
  const docRef = doc(contactsRef);
  const batch = writeBatch(db);
  batch.set(docRef, newContact);
  batch.update(doc(db, 'users', userId), { contactCount: increment(1) });
  try {
    await batch.commit();
  } catch (error) {
    if (imageFile && imageUrl) {
      await deleteStorageObjectBestEffort(imageUrl, 'image of a contact that failed to save');
    }
    throw error;
  }

  // Create a properly typed contact object for return
  const createdContact: Contact = {
    id: docRef.id,
    name,
    firstName,
    lastName,
    phone: contactData.phone || '',
    email: contactData.email || '',
    position: contactData.position || '',
    company: contactData.company || '',
    address: contactData.address || '',
    note: contactData.note || '',
    tags,
    dateAdded: new Date().toISOString(), // Convert timestamp to string for the return value
    dateModified: new Date().toISOString(),
    contactSource: contactData.contactSource || 'manual',
    imageUrl: imageUrl || undefined
  };

  return createdContact;
}

/**
 * Update an existing contact. Returns the fields as saved (trimmed name and its
 * parts, known tags only, `imageUrl` undefined when the image was removed).
 */
export async function updateContact(
  userId: string, 
  contactId: string, 
  updates: Partial<Contact>
): Promise<Partial<Contact>> {
  if (!db) throw new Error('Firestore is not initialized');

  const saved: Partial<Contact> = { ...updates };

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (!name) {
      throw new Error('Name is required');
    }
    Object.assign(saved, { name, ...splitName(name) });
  }

  if (updates.tags) {
    saved.tags = await existingTagIds(userId, updates.tags);
  }
  
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  
  // Use serverTimestamp for consistent formatting with dateAdded
  const updatesWithTimestamp: DocumentData = {
    ...saved,
    dateModified: serverTimestamp()
  };

  // iOS shows an image slot for any imageUrl value, so a removed image has to
  // be a missing field rather than an empty string.
  if ('imageUrl' in saved && !saved.imageUrl) {
    updatesWithTimestamp.imageUrl = deleteField();
    saved.imageUrl = undefined;
  }

  await updateDoc(contactRef, updatesWithTimestamp);
  return saved;
}

// Delete a contact
export async function deleteContact(userId: string, contactId: string) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  
  // Capture the object URL, remove the database record first, then clean up
  // Storage. Deleting Storage first could leave a live contact with a broken URL
  // if the Firestore delete failed.
  const contact = await getDoc(contactRef);
  const imageUrl = contact.exists() ? contact.data().imageUrl : undefined;
  await deleteDoc(contactRef);

  if (imageUrl) {
    await deleteStorageObjectBestEffort(imageUrl, 'deleted contact image');
  }

  // Clients can never lower their own counter; the server recount does it.
  refreshUsageAfterDelete();
}

// Get all contacts for a user
export async function getContacts(userId: string) {
  try {
    if (!db) {
      console.error('Firestore is not initialized when getting contacts');
      return [];
    }
    
    console.log('Getting contacts for user: [redacted]');
    const contactsRef = collection(db, 'users', userId, 'contacts');
    const q = query(contactsRef, orderBy('dateModified', 'desc'));
    
    const snapshot = await getDocs(q);
    const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
    console.log(`Successfully fetched ${contacts.length} contacts for user [redacted]`);
    
    return contacts;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}

/** Upload a contact image without touching Firestore; returns its download URL. */
export async function uploadContactImageFile(userId: string, file: File): Promise<string> {
  if (!storage) throw new Error('Firebase storage is not initialized');

  const problem = contactImageError(file);
  if (problem) throw new Error(problem);
  
  const imageId = uuidv4();
  const imagePath = `contacts/${userId}/${imageId}.${contactImageExtension(file)}`;
  const imageRef = ref(storage, imagePath);
  
  await uploadBytes(imageRef, file, {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      compression: '0.8'
    }
  });
  
  return await getDownloadURL(imageRef);
}

// Upload contact image and attach it to an existing contact
export async function uploadContactImage(
  userId: string,
  contactId: string,
  file: File
): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized');

  const imageUrl = await uploadContactImageFile(userId, file);
  
  // Update contact with new image URL
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  try {
    await updateDoc(contactRef, { imageUrl });
  } catch (error) {
    // Do not retain an upload that no contact points at.
    await deleteStorageObjectBestEffort(imageUrl, 'failed contact image upload');
    throw error;
  }
  
  return imageUrl;
}

// Tag Operations
export async function createTag(userId: string, tagData: Partial<Tag>) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const tagsRef = collection(db, `users/${userId}/tags`);
  
  // Check for duplicate tag names
  const existingTag = await getDocs(
    query(tagsRef, where('name', '==', tagData.name))
  );
  
  if (!existingTag.empty) {
    throw new Error('Tag with this name already exists');
  }
  
  const newTag = {
    ...tagData,
    username: userId,
    color: tagData.color || '#808080' // Default gray color
  };
  
  const docRef = await addDoc(tagsRef, {
    ...newTag,
    // iOS decodes a tag only when it has `userId` and a `createdAt` timestamp.
    // Without them the tag is invisible there, and iOS creates a duplicate.
    userId,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...newTag };
}

// Batch Operations

/**
 * Delete contacts the caller already holds in memory; their `imageUrl`s say
 * which Storage objects to clean up, so no per-contact read is needed.
 */
export async function batchDeleteContacts(
  userId: string,
  contacts: Array<Pick<Contact, 'id' | 'imageUrl'>>
) {
  if (!db) throw new Error('Firestore is not initialized');
  const firestore = db;
  
  try {
    for (const chunk of chunked(contacts)) {
      const batch = writeBatch(firestore);
      chunk.forEach(contact => {
        batch.delete(doc(firestore, 'users', userId, 'contacts', contact.id));
      });
      await batch.commit();
  
      // Only objects whose records are gone are safe to remove.
      await Promise.all(
        chunk
          .filter(contact => contact.imageUrl)
          .map(contact => deleteStorageObjectBestEffort(contact.imageUrl!, 'bulk-deleted contact image'))
      );
    }
  } finally {
    // Even a partly applied delete frees quota.
    refreshUsageAfterDelete();
  }
}

/**
 * Add tags to, or remove them from, every listed contact without touching the
 * contacts' other tags (iOS adds the same way). Both writes are idempotent, so
 * a partly applied run is safe to repeat.
 */
export async function batchUpdateContactTags(
  userId: string, 
  contactIds: string[], 
  tagIds: string[],
  action: 'add' | 'remove'
) {
  if (!db) throw new Error('Firestore is not initialized');
  const firestore = db;

  // Removing the id of a tag that no longer exists is still useful cleanup.
  const ids = action === 'add'
    ? await existingTagIds(userId, tagIds)
    : [...new Set(tagIds.filter(Boolean))];
  if (ids.length === 0) return;
  
  const tagsChange = action === 'add' ? arrayUnion(...ids) : arrayRemove(...ids);
  for (const chunk of chunked([...new Set(contactIds)])) {
    const batch = writeBatch(firestore);
    chunk.forEach(contactId => {
      batch.update(doc(firestore, 'users', userId, 'contacts', contactId), {
        tags: tagsChange,
        dateModified: serverTimestamp()
      });
    });
    await batch.commit();
  }
}

// Search contacts
export async function searchContacts(
  userId: string, 
  searchTerm: string,
  tagFilter?: string[]
) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const contactsRef = collection(db, 'users', userId, 'contacts');
  let q = query(contactsRef);
  
  if (tagFilter && tagFilter.length > 0) {
    q = query(q, where('tags', 'array-contains-any', tagFilter));
  }
  
  const snapshot = await getDocs(q);
  const contacts = snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  } as Contact));
  
  // Client-side filtering for more flexible search
  return contacts.filter(contact => {
    const searchString = `${contact.firstName} ${contact.lastName} ${contact.company || ''}`
      .toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });
}

// Get tags for a user
export const getTags = async (userId: string): Promise<Tag[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  try {
    const tagsRef = collection(db, `users/${userId}/tags`);
    const snapshot = await getDocs(tagsRef);
    
    // Tags from older web builds lack the fields iOS needs to decode them.
    // Best effort: a failed backfill is simply retried on the next load.
    snapshot.docs.forEach(tagDoc => {
      const data = tagDoc.data();
      const missing: DocumentData = {};
      if (typeof data.userId !== 'string') missing.userId = userId;
      if (!data.createdAt) missing.createdAt = serverTimestamp();
      if (Object.keys(missing).length > 0) {
        updateDoc(tagDoc.ref, missing).catch(error => {
          console.error('Unable to backfill tag fields:', error);
        });
      }
    });

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data() as Omit<Tag, 'id'>
    })) as Tag[];
  } catch (error) {
    console.error('Error getting tags:', error);
    throw error;
  }
}

/**
 * Delete a tag after removing it from every contact. The tag document goes
 * last: if the cleanup fails the tag is still listed, so deleting it again
 * retries the cleanup instead of leaving contacts with an id nothing can remove.
 */
export async function deleteTag(userId: string, tagId: string) {
  if (!db) throw new Error('Firestore is not initialized');
  const firestore = db;
  
  // Get all contacts that have this tag
  const contactsRef = collection(firestore, `users/${userId}/contacts`);
  const contactsWithTag = await getDocs(
    query(contactsRef, where('tags', 'array-contains', tagId))
  );
  
  for (const chunk of chunked(contactsWithTag.docs)) {
    const batch = writeBatch(firestore);
    chunk.forEach(contact => {
      batch.update(contact.ref, { tags: arrayRemove(tagId) });
    });
    await batch.commit();
  }
  
  await deleteDoc(doc(firestore, `users/${userId}/tags/${tagId}`));
}
export async function updateTag(userId: string, tagId: string, updates: Partial<Tag>) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const tagRef = doc(db, 'users', userId, 'tags', tagId);
  await updateDoc(tagRef, updates);
}

/**
 * Ask the server whether another contact may be saved.
 *
 * Counting in the browser was advisory only — anyone could skip it. The answer
 * now comes from `/api/usage`, which also writes the counter that Firestore
 * rules check the create against.
 */
export async function canCreateContact(userId: string) {
  if (auth?.currentUser?.uid !== userId) return false;

  const usage = await syncUsage();
  if (usage) return usage.canCreateContact;

  // Transient failure: fall back to the local count for the UI only.
  if (!db) throw new Error('Firestore is not initialized');

  const userDoc = await getDoc(doc(db, 'users', userId));
  const isPro = userDoc.data()?.isPro || false;

  const contactsRef = collection(db, 'users', userId, 'contacts');
  const contactsSnapshot = await getDocs(contactsRef);
  const contactCount = contactsSnapshot.size;

  return isPro || contactCount < FREE_USER_CONTACT_LIMIT;
}
