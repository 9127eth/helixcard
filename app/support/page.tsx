'use client';

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { HelpCircle, Mail, MessageCircle } from 'react-feather';

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
      <div className="p-6 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Support</h1>
        <p className="text-gray-600 mb-8">Get help with your Helix Business Cards</p>

        <div className="space-y-6">
          {/* FAQ Section */}
          <div className="bg-white dark:bg-[#2c2d31] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Quick answers to common questions
            </p>

            <div className="space-y-3">
              {[
                {
                  question: "What is a digital business card?",
                  answer: "A digital business card is a modern alternative to traditional paper business cards. It's a digital representation of your contact information and professional profile that can be easily shared via a link, QR code, or NFC technology."
                },
                {
                  question: "How does a digital business card work?",
                  answer: "Your digital business card lives online and can be accessed through a unique URL or by scanning a QR code. When someone accesses your card, they'll see your contact information, social media links, and any other content you've chosen to share. They can save your information directly to their phone contacts or connect with you through your social media profiles."
                },
                {
                  question: "Why should I use a digital business card instead of a traditional one?",
                  answer: "Digital business cards offer several advantages: they're eco-friendly, always up-to-date, never run out, can be shared instantly, include interactive elements like direct links to your social profiles, and can be updated anytime. Plus, you can track when people view your card and include much more information than a traditional paper card. Most importantly, by providing a rich, interactive experience with your professional profile, social links, and additional content, digital business cards help create more meaningful and memorable connections with your network."
                },
                {
                  question: "What information can I include on my digital business card?",
                  answer: "You can include your name, title, company, contact information (phone, email), social media links, profile photo, about me section, pronouns, custom message, and even upload documents like your CV (available in Pro version)."
                },
                {
                  question: "Do you have a mobile app?",
                  answer: "Yes! We have mobile apps available for both iOS and Android. You can download the Helix Card app from the App Store for iOS devices or from Google Play Store for Android devices. Both apps offer the full range of features including NFC card management, card creation, and contact scanning."
                },
                {
                  question: "Will my digital business card work on all devices?",
                  answer: "Yes, your digital business card is fully responsive and works on all modern devices and browsers, including smartphones, tablets, and computers."
                },
                {
                  question: "Can I have multiple digital cards under one account?",
                  answer: "Free users can create one business card. Pro users can create up to 10 different cards, perfect for managing different jobs, roles, and side hustles."
                },
                {
                  question: "How do I share my card?",
                  answer: "You can share your card by clicking on the 'Share' button on your card's page. You can share via email, social media, or by generating a QR code. You can also add your card to a physical NFC card. You'll need to download the HelixCard app to do this."
                },
                {
                  question: "What is an NFC card and how does it work?",
                  answer: "An NFC (Near Field Communication) card contains a small chip that wirelessly shares your digital business card when tapped with a smartphone. For iPhone users, simply hold the card near the top of your phone. For Android users, ensure NFC is enabled in settings and tap the card against the back of your phone. When tapped, your phone will instantly receive a notification to view the digital business card - no app download required."
                },
                {
                  question: "Will my digital business card automatically update if I make changes?",
                  answer: "Yes! Any changes you make to your digital business card are updated instantly, and all shared links will automatically display the most current information."
                },
                {
                  question: "What should I do if my card isn't displaying correctly?",
                  answer: "First, try refreshing your browser or clearing your cache. If the issue persists, please contact our support team via email or text, and we'll help resolve the problem."
                },
                {
                  question: "What is the difference between free and pro accounts?",
                  answer: "Free accounts include one digital business card with basic features like profile image upload and NFC sharing. Pro accounts ($2.99/month or $12.99/year) unlock premium features including: up to 10 business cards, AI-powered business card scanning, CV/resume upload capability, and future updates and capabilities."
                },
                {
                  question: "Can I cancel my subscription anytime?",
                  answer: "Yes, you can cancel your Pro subscription at any time. Your Pro features will remain active until the end of your current billing period."
                },
                {
                  question: "What is your refund policy?",
                  answer: "We do not offer refunds on subscription payments. You can cancel your subscription at any time to prevent future charges."
                },
                {
                  question: "Can I add my digital business card to Apple Wallet?",
                  answer: "Yes! You can add your digital business card to Apple Wallet for quick and easy access. This feature allows you to share your contact information even without an internet connection."
                },
                {
                  question: "How do I add my card to Apple Wallet?",
                  answer: "To add your card to Apple Wallet, open your digital business card in the Helix app, tap on the 3 dots menu button, and select 'Add to Apple Wallet'. Follow the on-screen instructions to complete the process. Your card will then be available in your Apple Wallet for quick access."
                },
                {
                  question: "What are the benefits of adding my card to Apple Wallet?",
                  answer: "Adding your digital business card to Apple Wallet provides several benefits: offline access to share your card without internet, quick access with just a few taps, and the ability to share your contact information even when your phone is in low battery mode."
                },
                {
                  question: "Will my Apple Wallet card update automatically?",
                  answer: "When you make changes to your digital business card, you'll need to update your Apple Wallet card. Simply follow the same process to add it to Apple Wallet again, and the new version will replace the old one."
                },
                {
                  question: "How do I add my digital business card to an NFC device?",
                  answer: "To add your digital business card to an NFC device, open the Helix mobile app and select your card. Then tap on 'Write to NFC' option and follow the instructions to hold your NFC device near your phone. Once the writing process is complete, your card information will be stored on the NFC device and can be shared with a simple tap."
                },
                {
                  question: "How does the AI-powered business card scanning feature work?",
                  answer: "Our Pro subscription includes an AI-powered business card scanning tool that allows you to quickly capture and save contacts from physical business cards. Simply open the Helix app, navigate to contacts, hit create new, and our AI will automatically extract the contact information. You can review and edit the extracted information before saving it to your contacts. This feature saves you time and eliminates manual data entry."
                }
              ].map((faq, index) => (
                <div 
                  key={index} 
                  className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-3 last:pb-0"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center text-left gap-2"
                  >
                    {openIndices.includes(index) ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                    <span className="font-bold text-gray-900 dark:text-gray-100">{faq.question}</span>
                  </button>
                  <div
                    className={`mt-2 text-gray-600 dark:text-gray-400 transition-all duration-200 ease-in-out pl-7 ${
                      openIndices.includes(index) ? 'block' : 'hidden'
                    }`}
                  >
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white dark:bg-[#2c2d31] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Contact Us</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Get in touch with our support team
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                  <a href="mailto:support@helixcard.app" className="text-blue-600 hover:underline">
                    support@helixcard.app
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Text</p>
                  <p className="text-gray-600 dark:text-gray-400">+1 (786) 273-7007</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SupportPage;
