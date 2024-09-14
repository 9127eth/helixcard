import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { saveBusinessCard } from '../lib/firebaseOperations';

interface BusinessCardFormProps {
  onSuccess: (cardId: string, cardUrl: string) => void;
}

export const BusinessCardForm: React.FC<BusinessCardFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a business card');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { cardId, cardUrl } = await saveBusinessCard(user, formData);
      onSuccess(cardId, cardUrl);
    } catch (error) {
      console.error('Error saving business card:', error);
      setError('Failed to save business card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <button
        type="submit"
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Business Card'}
      </button>
    </form>
  );
};
