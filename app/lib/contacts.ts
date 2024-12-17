import { db, storage } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
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

// Create a new contact
export async function createContact(userId: string, contactData: Partial<Contact>) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const contactsRef = collection(db, `users/${userId}/contacts`);
  
  // Ensure name is always present
  if (!contactData.name) {
    throw new Error('Name is required');
  }

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
    contactSource: 'manual' as const,
    tags: contactData.tags || []
  };

  const docRef = await addDoc(contactsRef, newContact);
  
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
    contactSource: 'manual',
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
  
  const contactRef = doc(db, `users/${userId}/contacts/${contactId}`);
  
  if (updates.name) {
    const nameParts = updates.name.split(' ');
    updates.firstName = nameParts[0];
    updates.lastName = nameParts.slice(1).join(' ');
  }

  updates.dateModified = new Date().toISOString();
  await updateDoc(contactRef, updates);
}

// Delete a contact
export async function deleteContact(userId: string, contactId: string) {
  if (!db || !storage) throw new Error('Firebase services are not initialized');
  
  const contactRef = doc(db, `users/${userId}/contacts/${contactId}`);
  
  // Delete associated image if it exists
  const contact = await getDoc(contactRef);
  if (contact.exists() && contact.data().imageUrl) {
    const imageRef = ref(storage, contact.data().imageUrl);
    await deleteObject(imageRef);
  }
  
  await deleteDoc(contactRef);
}

// Get all contacts for a user
export async function getContacts(userId: string) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const contactsRef = collection(db, `users/${userId}/contacts`);
  const q = query(contactsRef, orderBy('dateModified', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}

// Upload contact image
export async function uploadContactImage(
  userId: string, 
  contactId: string, 
  file: File
): Promise<string> {
  if (!storage) throw new Error('Firebase storage is not initialized');
  
  const imageId = uuidv4();
  const imagePath = `contacts/${userId}/${imageId}.jpg`;
  const imageRef = ref(storage, imagePath);
  
  await uploadBytes(imageRef, file, {
    contentType: 'image/jpeg',
    customMetadata: {
      compression: '0.8'
    }
  });
  
  const imageUrl = await getDownloadURL(imageRef);
  
  // Update contact with new image URL
  if (!db) throw new Error('Firestore is not initialized');
  const contactRef = doc(db, `users/${userId}/contacts/${contactId}`);
  await updateDoc(contactRef, { imageUrl });
  
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
  
  for (const contactId of contactIds) {
    const contactRef = doc(db, `users/${userId}/contacts/${contactId}`);
    batch.delete(contactRef);
  }
  
  await batch.commit();
}

export async function batchUpdateContactTags(
  userId: string, 
  contactIds: string[], 
  tagIds: string[]
) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const batch = writeBatch(db);
  
  for (const contactId of contactIds) {
    const contactRef = doc(db, `users/${userId}/contacts/${contactId}`);
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
  
  const contactsRef = collection(db, `users/${userId}/contacts`);
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
 