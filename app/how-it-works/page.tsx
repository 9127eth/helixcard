'use client';

import React from 'react';
import Layout from '../components/Layout';
import { CreditCardIcon, QrCodeIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { Cpu } from 'react-feather';

const HowItWorksPage: React.FC = () => {
  return (
    <Layout title="How It Works - HelixCard" showSidebar={true}>
      <div className="flex">
        <div className="w-[70%] pl-8 pr-12">
          <h1 className="text-4xl font-bold mb-12">How it Works</h1>
          
          <div className="space-y-16">
            <section className="flex items-start gap-6">
              <div className="w-16 h-16 flex-shrink-0 bg-[var(--primary)] rounded-full flex items-center justify-center">
                <CreditCardIcon className="w-8 h-8 text-[var(--primary-text)]" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Create Your Card</h2>
                <p>Sign up and easily design your digital business card with our intuitive interface. Add your contact information, social media links, and additional content to customize your business card.</p>
              </div>
            </section>

            <section className="flex items-start gap-6">
              <div className="w-16 h-16 flex-shrink-0 bg-[var(--foreground)] rounded-full flex items-center justify-center">
                <QrCodeIcon className="w-8 h-8 text-[var(--background)]" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Share Your Card</h2>
                <p>Each of your business cards will get a unique QR code. Have the person you are connecting with scan it with their camera to go directly to your card. You can also share your unique link via text,email, or add it to an NFC card.</p>
              </div>
            </section>

            <section className="flex items-start gap-6">
              <div className="w-16 h-16 flex-shrink-0 bg-[#E1DBC6] rounded-full flex items-center justify-center">
                <ArrowPathIcon className="w-8 h-8 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Update Anytime</h2>
                <p>Keep your information current by updating your card whenever you need. Changes are reflected instantly for all your contacts.</p>
              </div>
            </section>

            <section className="flex items-start gap-6">
              <div className="w-16 h-16 flex-shrink-0 bg-[#8B9FBF] rounded-full flex items-center justify-center">
                <Cpu size={24} className="text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">AI-Powered Contact Management</h2>
                <p>Scan business cards using our advanced AI technology to instantly create digital contacts. Organize and manage your professional network with ease, and keep track of all your connections in one place.</p>
              </div>
            </section>
          </div>
        </div>
        <div className="w-[30%] bg-background"></div>
      </div>
    </Layout>
  );
};

export default HowItWorksPage;
