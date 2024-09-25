'use client';

import React from 'react';
import Layout from '../components/Layout';

const HowItWorksPage: React.FC = () => {
  return (
    <Layout title="How It Works - HelixCard" showSidebar={true}>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">How HelixCard Works</h1>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Create Your Card</h2>
          <p className="mb-4">Sign up and easily design your digital business card with our intuitive interface. Add your contact information, social media links, and customize the look to match your brand.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Share Your Card</h2>
          <p className="mb-4">Get a unique URL or QR code for your digital card. Share it via email, text, or print it on your physical business cards for easy access.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Update Anytime</h2>
          <p className="mb-4">Keep your information current by updating your card whenever you need. Changes are reflected instantly for all your contacts.</p>
        </section>
      </div>
    </Layout>
  );
};

export default HowItWorksPage;
