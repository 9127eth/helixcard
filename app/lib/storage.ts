import { ref, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export async function deleteImage(imageUrl: string) {
  if (!storage) throw new Error('Firebase storage is not initialized')
  
  try {
    const decodedUrl = decodeURIComponent(imageUrl)
    const pathStartIndex = decodedUrl.indexOf('/o/') + 3
    const pathEndIndex = decodedUrl.indexOf('?')
    const storagePath = pathEndIndex >= 0 
      ? decodedUrl.substring(pathStartIndex, pathEndIndex)
      : decodedUrl.substring(pathStartIndex)

    if (!storagePath.startsWith('contacts/')) {
      throw new Error('Invalid storage path for contact image')
    }

    const imageRef = ref(storage, storagePath)
    await deleteObject(imageRef)
  } catch (error) {
    console.error('Error deleting image:', error)
    if (error instanceof Error && error.message.includes('object-not-found')) {
      return
    }
    throw error
  }
}
