'use client';

import React, { useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { ChevronUpIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const SupportPage: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  const toggleFAQ = (index: number) => {
    setOpenIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  return (
    <Layout title="Support - HelixCard" showSidebar={true}>
      <div className="p-6">
        <h1 className="text-4xl font-bold mb-6">Support</h1>
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {[
                {
                  question: "How do I create a new business card?",
                  answer: "To create a new business card, go to the dashboard and click on 'Create New Card'. Follow the prompts to customize your card."
                },
                {
                  question: "How do I share my card?",
                  answer: "You can share your card by clicking on the 'Share' button on your card's page. You can share via email, social media, or by generating a QR code. You can also add your card to a physical NFC card. You'll need to download the HelixCard app to do this."
                },
                {
                  question: "What is an NFC card and how does it work?",
                  answer: "An NFC (Near Field Communication) card contains a small chip that wirelessly shares your digital business card when tapped with a smartphone. For iPhone users, simply hold the card near the top of your phone. For Android users, ensure NFC is enabled in settings and tap the card against the back of your phone. When tapped, your phone will instantly receive a notification to view the digital business card - no app download required. This makes sharing your contact information as simple as a quick tap."
                },
                {
                  question: "What is the difference between free and pro accounts?",
                  answer: "Free accounts include one digital business card with basic features like profile image upload and NFC sharing. Pro accounts ($2.99/month or $12.99/year) unlock premium features including: up to 10 business cards, CV/resume upload capability, and future updates and capabilities. Pro users can manage multiple professional identities while free users can maintain one active card. All cards, free or pro, include core features like NFC sharing and QR code generation."
                }
              ].map((faq, index) => (
                <div key={index} className="cursor-pointer">
                  <div 
                    onClick={() => toggleFAQ(index)} 
                    className="flex items-center text-gray-800 hover:text-gray-600"
                  >
                    {openIndices.includes(index) ? (
                      <ChevronDownIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    )}
                    <span className="font-semibold">{faq.question}</span>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out pl-7 ${
                      openIndices.includes(index) ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>If you need additional help, please do not hesitate to reach out:</p>
            <div className="mt-2 space-y-2">
              <li>Email: <a href="mailto:support@helixcard.app" className="text-blue-600 hover:underline">support@helixcard.app</a></li>
              <li>Text: +1 (786) 273-7007</li>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SupportPage;
