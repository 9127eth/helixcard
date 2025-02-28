'use client';

import React from 'react';
import Layout from '../components/Layout';
import { 
  CreditCard, 
  QrCode, 
  RefreshCw, 
  Cpu, 
  Share2, 
  Smartphone, 
  Database, 
  Users,
  CheckCircle,
  Zap,
  Layers
} from 'lucide-react';
import { FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

const HowItWorksPage: React.FC = () => {
  return (
    <Layout title="How It Works - HelixCard" showSidebar={true} transparentHeader={true} showHeader={false}>
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#F5FDFD] to-white dark:from-gray-900 dark:to-gray-800 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 dark:text-white">
              How <span className="text-[#7CCEDA] dark:text-[#7CCEDA]">Helix</span> Works
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Discover how Helix transforms your networking experience with digital business cards and powerful contact management.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="space-y-16">
              {/* Feature 1 */}
              <div className="relative">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 flex justify-center mb-6 md:mb-0">
                    <div className="w-20 h-20 bg-[#7CCEDA] rounded-full flex items-center justify-center">
                      <CreditCard className="text-white text-2xl" />
                    </div>
                  </div>
                  <div className="md:w-3/4">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Create Your Business Cards</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                      Design beautiful, personalized digital business cards that truly represent you and your brand. Add your contact information, social media links, and customize colors and layouts.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start">
                        <CheckCircle className="text-[#7CCEDA] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Create multiple cards for different roles or contexts</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="text-[#7CCEDA] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Choose from multiple card designs</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="text-[#7CCEDA] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Add social media links and contact details</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="text-[#7CCEDA] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Mobile-friendly design that looks great on any device</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature 2 */}
              <div className="relative">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 flex justify-center mb-6 md:mb-0">
                    <div className="w-20 h-20 bg-[#B8EB41] rounded-full flex items-center justify-center">
                      <Share2 className="text-white text-2xl" />
                    </div>
                  </div>
                  <div className="md:w-3/4">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Easily Share Your Cards</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                      Share your digital business card with anyone, anywhere, in seconds. No more running out of physical cards or forgetting them at home.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start">
                        <QrCode className="text-[#B8EB41] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Unique QR code for each card that can be scanned with any smartphone</p>
                      </div>
                      <div className="flex items-start">
                        <Share2 className="text-[#B8EB41] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Share via text, email, or social media with a simple link</p>
                      </div>
                      <div className="flex items-start">
                        <Smartphone className="text-[#B8EB41] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Add to an NFC card for tap-to-share functionality</p>
                      </div>
                      <div className="flex items-start">
                        <Zap className="text-[#B8EB41] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Instant sharing without the need for an app download</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature 3 */}
              <div className="relative">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 flex justify-center mb-6 md:mb-0">
                    <div className="w-20 h-20 bg-[#FC9A99] rounded-full flex items-center justify-center">
                      <Cpu className="text-white text-2xl" />
                    </div>
                  </div>
                  <div className="md:w-3/4">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Upload Contacts with our AI Powered Scanner</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                      Scan business cards with our advanced AI technology to instantly create digital contacts. Organize and manage your professional network with ease.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start">
                        <Cpu className="text-[#FC9A99] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Smart scanning extracts contact details with high accuracy</p>
                      </div>
                      <div className="flex items-start">
                        <Users className="text-[#FC9A99] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Organize contacts with tags and categories</p>
                      </div>
                      <div className="flex items-start">
                        <Layers className="text-[#FC9A99] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Keep all your professional connections in one place</p>
                      </div>
                      <div className="flex items-start">
                        <RefreshCw className="text-[#FC9A99] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Automatically update contact information when it changes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature 4 */}
              <div className="relative">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 flex justify-center mb-6 md:mb-0">
                    <div className="w-20 h-20 bg-[#7CCEDA] rounded-full flex items-center justify-center">
                      <Database className="text-white text-2xl" />
                    </div>
                  </div>
                  <div className="md:w-3/4">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Export to Your Favorite CRM</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                      Seamlessly export your contacts to your favorite CRM system or as a CSV file. Keep your business tools in sync with your networking efforts.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start">
                        <Database className="text-[#7CCEDA] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Export to popular CRMs with just a few clicks</p>
                      </div>
                      <div className="flex items-start">
                        <RefreshCw className="text-[#7CCEDA] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Keep your contact information current across all your business tools</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="text-[#7CCEDA] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Export as CSV for maximum compatibility</p>
                      </div>
                      <div className="flex items-start">
                        <Zap className="text-[#7CCEDA] mr-3 flex-shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">Streamline your workflow and save time</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-[#F5FDFD] dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-white">
            <span className="text-[#7CCEDA] dark:text-[#7CCEDA]">Network Smarter</span> with Helix
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Manage your business cards or explore your contacts to make the most of Helix's powerful features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="px-8 py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg flex items-center justify-center transition-colors duration-300"
            >
              Manage My Business Cards
              <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/contacts"
              className="px-8 py-3 bg-[#FC9A99] hover:bg-[#e88a89] text-gray-800 font-medium rounded-lg flex items-center justify-center transition-colors duration-300"
            >
              Go to Contacts
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorksPage;
