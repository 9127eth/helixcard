import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { deleteUser } from 'firebase/auth';
import { doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useRouter } from 'next/navigation';

const DeleteAccountButton: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      if (!db) throw new Error('Firestore instance is null');
      // Delete user document and associated business cards
      const userRef = doc(db, 'users', user.uid);
      const businessCardsRef = collection(userRef, 'businessCards');
      const businessCardsSnapshot = await getDocs(businessCardsRef);

      const batch = writeBatch(db);
      businessCardsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      batch.delete(userRef);
      await batch.commit();
      if (!storage) throw new Error('Firebase Storage instance is null');

      // Delete user's files from Firebase Storage
      const userStorageRef = ref(storage, `images/${user.uid}`);
      const userStorageList = await listAll(userStorageRef);
      await Promise.all(userStorageList.items.map((item) => deleteObject(item)));

      const userDocsRef = ref(storage, `docs/${user.uid}`);
      const userDocsList = await listAll(userDocsRef);
      await Promise.all(userDocsList.items.map((item) => deleteObject(item)));

      // Delete user authentication
      await deleteUser(user);

      alert('Your account has been successfully deleted.');
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error instanceof Error && error.message.includes('auth/requires-recent-login')) {
        alert('For security reasons, to proceed with deleting your account, you need to log out, then log back in and proceed to deleting your account.');
      } else {
        alert('An error occurred while deleting your account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDeleteAccount}
      disabled={isDeleting}
      className="text-red-500 hover:text-red-700 transition-colors"
    >
      {isDeleting ? 'Deleting...' : 'Delete Account'}
    </button>
  );
};

export default DeleteAccountButton;
