import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface BusinessCardFormProps {
  onSuccess: () => void;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await setDoc(doc(db, 'businessCards', user.uid), {
        ...formData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving business card:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Create Business Card
      </button>
    </form>
  );
};
