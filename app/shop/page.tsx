'use client';

import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa';

const ShopPage: React.FC = () => {
  // Apply styling to sidebar when component mounts
  useEffect(() => {
    // Function to update sidebar background based on current theme
    const updateSidebarBackground = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const gradient = isDarkMode
        ? 'linear-gradient(to bottom, #1e1e24, #2d3748)'
        : 'linear-gradient(to bottom, #F5FDFD, #ffffff)';

      // Apply gradient background to the sidebar
      const sidebarElements = document.querySelectorAll('.bg-sidebar-bg');
      sidebarElements.forEach((el) => {
        (el as HTMLElement).style.background = gradient;
      });
    };

    // Initial update
    updateSidebarBackground();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          updateSidebarBackground();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Clean up when component unmounts
    return () => {
      observer.disconnect();
      const sidebarElements = document.querySelectorAll('.bg-sidebar-bg');
      sidebarElements.forEach((el) => {
        (el as HTMLElement).style.background = '';
      });
    };
  }, []);

  return (
    <Layout title="Shop - HelixCard" showSidebar={true} transparentHeader={true} showHeader={false}>
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5FDFD] to-white dark:from-gray-900 dark:to-gray-800 z-0"></div>
        <div className="relative z-10">
          {/* Hero Section */}
          <div className="container mx-auto px-4 pt-6 py-12 md:py-24">
            <div className="flex flex-col lg:flex-row items-center">
              {/* Left Column - Hero Content */}
              <div className="w-full lg:w-1/2 mb-12 lg:mb-0 pr-0 lg:pr-12">
                <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 dark:text-white">
                    Shop NFC products to <span className="text-[#7CCEDA] dark:text-[#7CCEDA]">tap & share</span> your digital card
                  </h1>
                  <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">
                    Enhance your networking with our physical NFC cards. Just tap the card to any smartphone to instantly share your Helix digital business card - no app needed for the receiver.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <a 
                      href="https://shop.rxradio.fm/collections/all/products/tap-to-share-nfc-cards-powered-by-helix-2-pack"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg flex items-center justify-center transition-colors duration-300"
                    >
                      Buy Physical NFC Cards
                      <FaArrowRight className="ml-2" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column - Hero Image */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <Image
                  src="/NFCcardhero.png"
                  alt="Helix NFC Card"
                  width={450}
                  height={300}
                  priority
                  className="rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Steps Section */}
          <div className="bg-white dark:bg-gray-800 py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
                How to Link Your Physical NFC Card
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Step 1 */}
                <div className="bg-[#F5FDFD] dark:bg-gray-700 p-8 rounded-xl">
                  <div className="bg-[#7CCEDA] dark:bg-gray-600 w-12 h-12 mb-6 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Create your digital card</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Sign up for a free Helix account and create your digital business card
                  </p>
                </div>
                
                {/* Step 2 */}
                <div className="bg-[#F5FDFD] dark:bg-gray-700 p-8 rounded-xl">
                  <div className="bg-[#7CCEDA] dark:bg-gray-600 w-12 h-12 mb-6 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Download the Helix Card app</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    In the app, from the dashboard of your cards, find the 3-dot menu button in the top right corner of your card and tap it. Android users see below for instructions.
                  </p>
                </div>
                
                {/* Step 3 */}
                <div className="bg-[#F5FDFD] dark:bg-gray-700 p-8 rounded-xl">
                  <div className="bg-[#7CCEDA] dark:bg-gray-600 w-12 h-12 mb-6 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Select "Add to NFC"</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    From the menu, select the "Add to NFC" option
                  </p>
                </div>
                
                {/* Step 4 */}
                <div className="bg-[#F5FDFD] dark:bg-gray-700 p-8 rounded-xl">
                  <div className="bg-[#7CCEDA] dark:bg-gray-600 w-12 h-12 mb-6 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    4
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Tap your physical card</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    When prompted, tap the back of your physical NFC card to link it
                  </p>
                </div>
              </div>
              
              <div className="mt-12 text-center">
                <a 
                  href="https://shop.rxradio.fm/collections/all/products/tap-to-share-nfc-cards-powered-by-helix-2-pack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg inline-flex items-center justify-center transition-colors duration-300"
                >
                  Get Your Physical NFC Card
                  <FaArrowRight className="ml-2" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Android Instructions */}
          <div className="bg-[#F5FDFD] dark:bg-gray-900 py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
                Android Users
              </h2>
              <p className="text-lg text-center text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                For Android users, the setup process is slightly different:
              </p>
              <div className="bg-white dark:bg-gray-700 p-8 rounded-xl max-w-2xl mx-auto shadow-md">
                <ol className="list-decimal pl-6 space-y-4">
                  <li className="text-gray-700 dark:text-gray-300">Navigate to your card in the Helix app</li>
                  <li className="text-gray-700 dark:text-gray-300">Tap the Share button</li>
                  <li className="text-gray-700 dark:text-gray-300">Copy your card's unique link</li>
                  <li className="text-gray-700 dark:text-gray-300">Use an NFC writing app to write this link to your physical NFC card</li>
                </ol>
                <p className="mt-6 text-gray-600 dark:text-gray-400 italic">
                  For detailed instructions, please watch this <a href="https://www.youtube.com/watch?v=YMjTMAXGoRg" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline">tutorial video</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShopPage;
