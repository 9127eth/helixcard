import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
export async function uploadCv(userId: string, file: File): Promise<string> {
  if (!storage) {
    throw new Error('Firebase storage is not initialized');
  }
  const cvRef = ref(storage, `docs/${userId}/${file.name}`);
  await uploadBytes(cvRef, file);
  return getDownloadURL(cvRef);
}
