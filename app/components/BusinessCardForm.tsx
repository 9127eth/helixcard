import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { saveBusinessCard } from '../lib/firebaseOperations';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BusinessCardFormProps {
  onSuccess: (cardSlug: string, cardUrl: string) => void;
}

export const BusinessCardForm: React.FC<BusinessCardFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    jobTitle: '',
    company: '',
    phoneNumber: '',
    email: '',
    aboutMe: '',
    specialty: '',
    linkedIn: '',
    twitter: '',
    customMessage: '',
    customSlug: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStatus = async () => {
      // Add null check for Firestore instance
if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  
        if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsPro(userDoc.data().isPro || false);
        }
      }
    };
    fetchUserStatus();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) {
      setError('You are currently offline. Please check your internet connection and try again.');
      return;
    }
    if (!user || !user.uid) {
      setError('You must be logged in with a valid account to create a business card');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { cardSlug: savedCardSlug, cardUrl } = await saveBusinessCard(user, formData);
      onSuccess(savedCardSlug, cardUrl);
    } catch (error) {
      setError('An error occurred while creating the business card');
      console.error('Error creating business card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div>Please log in to create a business card.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Full Name"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="text"
        name="jobTitle"
        value={formData.jobTitle}
        onChange={handleChange}
        placeholder="Job Title"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="text"
        name="company"
        value={formData.company}
        onChange={handleChange}
        placeholder="Company"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="tel"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleChange}
        placeholder="Phone Number"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        required
      />
      <textarea
        name="aboutMe"
        value={formData.aboutMe}
        onChange={handleChange}
        placeholder="About Me"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        rows={3}
      />
      <input
        type="text"
        name="specialty"
        value={formData.specialty}
        onChange={handleChange}
        placeholder="Specialty"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="url"
        name="linkedIn"
        value={formData.linkedIn}
        onChange={handleChange}
        placeholder="LinkedIn URL"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="text"
        name="twitter"
        value={formData.twitter}
        onChange={handleChange}
        placeholder="Twitter Handle"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <textarea
        name="customMessage"
        value={formData.customMessage}
        onChange={handleChange}
        placeholder="Custom Message"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        rows={2}
      />
      {isPro && (
        <input
          type="text"
          name="customSlug"
          value={formData.customSlug}
          onChange={handleChange}
          placeholder="Custom Slug (Pro users only)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      )}
      <button
        type="submit"
        className="w-full py-2 px-4 bg-dark-pink text-white rounded-md hover:bg-red disabled:bg-light-pink"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Business Card'}
      </button>
    </form>
  );
};
