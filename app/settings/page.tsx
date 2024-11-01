'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import DeleteAccountButton from '../components/DeleteAccountButton';

const SettingsPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check the initial theme when the component mounts
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Toggle the 'dark' class on the html element
    document.documentElement.classList.toggle('dark', newDarkMode);
    
    // Save the preference to localStorage
    localStorage.setItem('darkMode', newDarkMode ? 'true' : 'false');
  };

  return (
    <Layout title="Settings - HelixCard" showSidebar={true}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Account Settings</h2>
            <ul className="space-y-2">
              <li><Link href="#" className="text-blue-600 hover:underline">Change Email Address</Link></li>
              <li><Link href="#" className="text-blue-600 hover:underline">Update Password</Link></li>
              <li><Link href="#" className="text-blue-600 hover:underline">Manage Subscription</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Preferences</h2>
            <ul className="space-y-2">
              <li><Link href="#" className="text-blue-600 hover:underline">Notification Settings</Link></li>
              <li><Link href="#" className="text-blue-600 hover:underline">Language Preferences</Link></li>
              <li><Link href="#" className="text-blue-600 hover:underline">Theme Options</Link></li>
              <li>
                <div className="flex items-center">
                  <span className="mr-2">Dark Mode</span>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none ${
                      isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform transition ease-in-out duration-200 ${
                        isDarkMode ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white'
                      } rounded-full`}
                    />
                  </button>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2 text-black-600">Danger Zone</h2>
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
