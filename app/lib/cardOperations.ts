import { User } from 'firebase/auth';
import { deleteBusinessCard } from './firebaseOperations';
import { BusinessCard } from '@/app/types'; // Add this line

export const handleCardDelete = async (user: User | null, card: BusinessCard): Promise<boolean> => {
  if (!user) {
    alert('You must be logged in to delete a card.');
    return false;
  }

  let confirmDelete: boolean;

  if (card.isPrimary) {
    const confirm = window.confirm(
      'Deleting your primary card will deactivate your primary URL. Are you sure you want to proceed?'
    );
    if (!confirm) return false;

    confirmDelete = window.confirm(
      'You are about to delete your primary business card. The primary URL will be reserved as a placeholder until you create a new primary card. Do you wish to continue?'
    );
  } else {
    confirmDelete = window.confirm('Are you sure you want to delete this business card?');
  }

  if (!confirmDelete) return false;

  try {
    await deleteBusinessCard(user, card.cardSlug);
    alert('Business card deleted successfully.');
    return true;
  } catch (error: unknown) {
    console.error('Error deleting business card:', error);
    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};
