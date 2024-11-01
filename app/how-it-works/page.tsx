'use client';

import React from 'react';
import Layout from '../components/Layout';

const HowItWorksPage: React.FC = () => {
  return (
    <Layout title="How It Works - HelixCard" showSidebar={true}>
      <div className="flex">
        <div className="w-[70%] pl-8 pr-12">
          <h1 className="text-4xl font-bold mb-6">How it Works</h1>
          <section className="mb-8">
            <h2 className="text-3xl font-semibold mb-4">1. Create Your Card</h2>
            <p className="mb-4">Sign up and easily design your digital business card with our intuitive interface. Add your contact information, social media links, and any other content to customize your card.</p>
          </section>
          <section className="mb-8">
            <h2 className="text-3xl font-semibold mb-4">2. Share Your Card</h2>
            <p className="mb-4">Each of your business cards will get a unique link and QR code. Have the person you are connecting with scan it with their camera to go directly to your card. You can also share your unique link via text, email, or even add it to an NFC device.</p>
          </section>
          <section className="mb-8">
            <h2 className="text-3xl font-semibold mb-4">3. Update Anytime</h2>
            <p className="mb-4">Keep your information current by updating your card whenever you need. Changes are reflected instantly for all your contacts.</p>
          </section>
        </div>
        <div className="w-[30%] bg-background"></div>
      </div>
    </Layout>
  );
};

export default HowItWorksPage;
