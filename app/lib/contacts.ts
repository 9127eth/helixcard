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
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Contact, Tag } from '@/app/types';
import { FREE_USER_CONTACT_LIMIT } from './constants';
import { auth } from './firebase';
import { refreshUsageAfterDelete, syncUsage } from './usageClient';

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
    // The Firestore write has already succeeded. Leaving an orphan for a later
    // cleanup is preferable to reporting that the user's save/delete failed.
    console.error(`Unable to clean up ${context}:`, error);
  }
}

async function assertValidTagIds(userId: string, tagIds: string[]) {
  if (!db || tagIds.length === 0) return;

  const uniqueIds = [...new Set(tagIds)];
  if (uniqueIds.length !== tagIds.length || uniqueIds.some(id => !id)) {
    throw new Error('One or more selected tags are invalid');
  }

  const snapshot = await getDocs(collection(db, 'users', userId, 'tags'));
  const validIds = new Set(snapshot.docs.map(tag => tag.id));
  if (uniqueIds.some(id => !validIds.has(id))) {
    throw new Error('One or more selected tags no longer exist');
  }
}

// Create a new contact
export async function createContact(userId: string, contactData: Partial<Contact>) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const contactsRef = collection(db, 'users', userId, 'contacts');
  
  // Ensure name is always present
  if (!contactData.name) {
    throw new Error('Name is required');
  }

  await assertValidTagIds(userId, contactData.tags || []);

  // Parse name into components
  const nameParts = contactData.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  const newContact = {
    ...contactData,
    firstName,
    lastName,
    name: contactData.name, // Ensure name is explicitly set
    dateAdded: serverTimestamp(),
    dateModified: serverTimestamp(),
    contactSource: contactData.contactSource || 'manual',
    tags: contactData.tags || []
  };

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

  // The rule requires the +1 on the owner document to be part of the same batch
  // as the contact itself, so a create always pays for its quota.
  const docRef = doc(contactsRef);
  const batch = writeBatch(db);
  batch.set(docRef, newContact);
  batch.update(doc(db, 'users', userId), { contactCount: increment(1) });
  await batch.commit();

  // Create a properly typed contact object for return
  const createdContact: Contact = {
    id: docRef.id,
    name: contactData.name,
    firstName,
    lastName,
    phone: contactData.phone || '',
    email: contactData.email || '',
    position: contactData.position || '',
    company: contactData.company || '',
    address: contactData.address || '',
    note: contactData.note || '',
    tags: contactData.tags || [],
    dateAdded: new Date().toISOString(), // Convert timestamp to string for the return value
    dateModified: new Date().toISOString(),
    contactSource: contactData.contactSource || 'manual',
    imageUrl: contactData.imageUrl
  };

  return createdContact;
}

// Update an existing contact
export async function updateContact(
  userId: string, 
  contactId: string, 
  updates: Partial<Contact>
) {
  if (!db) throw new Error('Firestore is not initialized');

  if (updates.tags) {
    await assertValidTagIds(userId, updates.tags);
  }
  
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  
  if (updates.name) {
    const nameParts = updates.name.split(' ');
    updates.firstName = nameParts[0];
    updates.lastName = nameParts.slice(1).join(' ');
  }

  // Use serverTimestamp for consistent formatting with dateAdded
  const updatesWithTimestamp = {
    ...updates,
    dateModified: serverTimestamp()
  };

  await updateDoc(contactRef, updatesWithTimestamp);
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

// Upload contact image
export async function uploadContactImage(
  userId: string, 
  contactId: string, 
  file: File
): Promise<string> {
  if (!storage) throw new Error('Firebase storage is not initialized');
  
  const imageId = uuidv4();
  const imagePath = `contacts/${userId}/${imageId}.${contactImageExtension(file)}`;
  const imageRef = ref(storage, imagePath);
  
  await uploadBytes(imageRef, file, {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      compression: '0.8'
    }
  });
  
  const imageUrl = await getDownloadURL(imageRef);
  
  // Update contact with new image URL
  if (!db) throw new Error('Firestore is not initialized');
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
  
  const docRef = await addDoc(tagsRef, newTag);
  return { id: docRef.id, ...newTag };
}

// Batch Operations
export async function batchDeleteContacts(userId: string, contactIds: string[]) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const batch = writeBatch(db);
  const imageUrls: string[] = [];
  
  for (const contactId of contactIds) {
    const contactRef = doc(db, 'users', userId, 'contacts', contactId);
    const contact = await getDoc(contactRef);
    const imageUrl = contact.exists() ? contact.data().imageUrl : undefined;
    if (imageUrl) imageUrls.push(imageUrl);
    batch.delete(contactRef);
  }
  
  await batch.commit();

  await Promise.all(
    imageUrls.map(imageUrl => deleteStorageObjectBestEffort(imageUrl, 'bulk-deleted contact image'))
  );

  refreshUsageAfterDelete();
}

export async function batchUpdateContactTags(
  userId: string, 
  contactIds: string[], 
  tagIds: string[]
) {
  if (!db) throw new Error('Firestore is not initialized');

  await assertValidTagIds(userId, tagIds);
  
  const batch = writeBatch(db);
  
  for (const contactId of contactIds) {
    const contactRef = doc(db, 'users', userId, 'contacts', contactId);
    batch.update(contactRef, { 
      tags: tagIds,
      dateModified: serverTimestamp()
    });
  }
  
  await batch.commit();
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
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data() as Omit<Tag, 'id'>
    })) as Tag[];
  } catch (error) {
    console.error('Error getting tags:', error);
    throw error;
  }
}

export async function deleteTag(userId: string, tagId: string) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const tagRef = doc(db, `users/${userId}/tags/${tagId}`);
  
  // Delete the tag
  await deleteDoc(tagRef);
  
  // Get all contacts that have this tag
  const contactsRef = collection(db, `users/${userId}/contacts`);
  const contactsWithTag = await getDocs(
    query(contactsRef, where('tags', 'array-contains', tagId))
  );
  
  // Remove the tag from all contacts that have it
  const batch = writeBatch(db);
  contactsWithTag.forEach(doc => {
    const contact = doc.data();
    const updatedTags = contact.tags.filter((t: string) => t !== tagId);
    batch.update(doc.ref, { tags: updatedTags });
  });
  
  await batch.commit();
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
