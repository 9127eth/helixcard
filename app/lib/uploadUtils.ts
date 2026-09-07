import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './firebase';

function imageExtension(file: File): string {
  switch (file.type) {
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
    default:
      return 'jpg';
  }
}

export async function uploadCv(userId: string, file: File): Promise<string> {
  if (!storage) {
    throw new Error('Firebase storage is not initialized');
  }
  // Immutable object names prevent two cards with the same local filename from
  // sharing (and later deleting) one Storage object.
  const cvRef = ref(storage, `docs/${userId}/${uuidv4()}.pdf`);
  await uploadBytes(cvRef, file, { contentType: 'application/pdf' });
  return getDownloadURL(cvRef);
}

export async function uploadImage(userId: string, file: File): Promise<string> {
  if (!storage) {
    throw new Error('Firebase storage is not initialized');
  }
  const imageRef = ref(storage, `images/${userId}/${uuidv4()}.${imageExtension(file)}`);
  await uploadBytes(imageRef, file, { contentType: file.type || 'image/jpeg' });
  return getDownloadURL(imageRef);
}

export async function deleteImage(userId: string, imageUrl: string): Promise<void> {
  if (!storage) {
    throw new Error('Firebase storage is not initialized');
  }
  const imageRef = ref(storage, imageUrl);
  await deleteObject(imageRef);
}
