import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadCv(userId: string, file: File): Promise<string> {
  if (!storage) {
    throw new Error('Firebase storage is not initialized');
  }
  const cvRef = ref(storage, `docs/${userId}/${file.name}`);
  await uploadBytes(cvRef, file);
  return getDownloadURL(cvRef);
}

export async function uploadImage(userId: string, file: File): Promise<string> {
  if (!storage) {
    throw new Error('Firebase storage is not initialized');
  }
  const imageRef = ref(storage, `images/${userId}/${file.name}`);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
}

export async function deleteImage(userId: string, imageUrl: string): Promise<void> {
  if (!storage) {
    throw new Error('Firebase storage is not initialized');
  }
  const imageRef = ref(storage, imageUrl);
  await deleteObject(imageRef);
}
