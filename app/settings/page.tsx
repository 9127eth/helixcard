'use client';

import React from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

const SettingsPage: React.FC = () => {
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
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Danger Zone</h2>
            <ul className="space-y-2">
              <li><Link href="#" className="text-blue-600 hover:underline">Delete Account</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
