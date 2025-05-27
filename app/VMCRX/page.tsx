'use client';

import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import Image from 'next/image';
import { FaArrowRight, FaMagic, FaArrowCircleRight } from 'react-icons/fa';
import { CreditCard, Users } from 'react-feather';

export default function VMCRXPage() {
  // Add effect for smooth scrolling on mobile
  useEffect(() => {
    // Add viewport height fix for mobile browsers
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVh();
    window.addEventListener('resize', setVh);
    
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      window.removeEventListener('resize', setVh);
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <Layout showSidebar={false} showHeader={false}>
      <div className="min-h-[calc(100*var(--vh))] bg-gradient-to-b from-[#F5FDFD] to-white dark:from-gray-900 dark:to-gray-800">
        {/* Central Logo Section */}
        <div className="container mx-auto px-4 pt-6 mb-8">
          <div className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Helix Logo"
              width={150}
              height={150}
              priority
              className="h-auto"
            />
            <span className="mx-3 text-2xl text-gray-400">×</span>
            <Image 
              src="/logo-vmcrx.png" 
              alt="VMC Buying Group Logo" 
              width={120}
              height={48}
              priority
              className="h-auto w-auto object-contain ml-1 max-w-[120px]"
            />
          </div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 pb-8 md:pb-16">
          {/* Hero Content - Full width on mobile, center aligned on all screens */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-gray-800 dark:text-white">
              The Official <span className="text-[#C41E3A] dark:text-[#C41E3A]">Digital Business Card</span> for VMC Buying Group
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-10">
              Grow your pharmacy business with professional networking made simple. Connect with industry partners, suppliers, and fellow pharmacy owners effortlessly with your digital business card that makes sharing your information seamless and memorable.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-center">
              <a 
                href="/#auth"
                className="px-6 py-3 bg-[#C41E3A] hover:bg-[#A01729] text-white font-medium rounded-lg flex items-center justify-center transition-colors duration-300"
              >
                Get Started
                <FaArrowRight className="ml-2" />
              </a>
            </div>
            <div className="mb-8">
              <a
                href="https://helixcard.app/c/9odg5w/1ob"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-[#C41E3A] hover:text-[#A01729] font-medium mb-8 justify-center"
              >
                <FaArrowCircleRight className="mr-2" />
                See Sample Business Card
              </a>
            </div>
          </div>

          {/* 2x2 Grid on Desktop, Single Column on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Top Left - Phone Image & Special Offer (First on mobile) */}
            <div className="flex flex-col items-center order-1 md:order-1">
              <div className="relative max-w-full overflow-hidden">
                <Image
                  src="/helix-phone.png"
                  alt="Helix Digital Card on Phone"
                  width={1318}
                  height={1757}
                  priority
                  className="rounded-xl mx-auto object-cover w-full max-w-[90%] sm:max-w-[600px] md:max-w-full"
                />
              </div>
              
              <div className="flex items-center justify-center mt-6 w-full max-w-md">
                <div className="mr-2 p-1.5 bg-[#C41E3A]/10 rounded-full">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12L13 4V8C13 8 4 9 4 20C4 20 8 16 13 16V20L21 12Z" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Special Offer:</span> Get Lifetime Helix Pro FREE with code <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-[#C41E3A] font-bold inline-block mt-1">VMCRX</span>
                </span>
              </div>
            </div>

            {/* Redemption Instructions (Second on mobile and desktop) */}
            <div className="order-2 md:order-2 h-full">
              {/* Redemption Instructions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-8 h-full">
                <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                  <span className="mr-2 text-[#C41E3A]">🎁</span>
                  Claim Your Free Lifetime Helix Pro
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="bg-[#C41E3A]/10 p-4 rounded-lg border border-[#C41E3A]/30 mb-6">
                      <div className="flex flex-col sm:flex-row items-start">
                        <div className="bg-[#C41E3A] text-white h-8 px-3 rounded-lg flex items-center justify-center mr-3 mb-3 sm:mb-0 font-bold text-sm">
                          EXCLUSIVE
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base">
                          As a VMC Buying Group member, you get Lifetime Helix Pro FREE with code: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-[#C41E3A] font-bold inline-block mt-1">VMCRX</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#C41E3A] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white mb-1">Create your account first</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                        Sign up for a free Helix account (you don&apos;t need to create a card yet)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#C41E3A] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white mb-1">Visit Get Helix Pro page</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                        Click the &quot;Get Helix Pro&quot; tab in the menu or go directly to <a href="https://helixcard.app/get-helix-pro" target="_blank" rel="noopener noreferrer" className="text-[#C41E3A] underline">helixcard.app/get-helix-pro</a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#C41E3A] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white mb-1">Select Lifetime plan</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                        Make sure to select the <span className="font-medium">Lifetime</span> plan option (the discount only applies to the Lifetime plan)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#C41E3A] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white mb-1">Enter the code</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                        Find the &quot;Coupon Code&quot; field and enter <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[#C41E3A] font-bold">VMCRX</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <div className="bg-[#F5FDFD] dark:bg-gray-700 p-4 rounded-lg border border-[#C41E3A]/30">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-bold">Important:</span> You must visit <a href="https://helixcard.app/get-helix-pro" target="_blank" rel="noopener noreferrer" className="text-[#C41E3A] underline">helixcard.app/get-helix-pro</a> to redeem the code, not the app. Use the same login method you used to create your account. Remember to select the Lifetime plan to receive your free subscription.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NFC Setup Instructions (Third on mobile and desktop) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 order-3 md:order-3 h-full">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">How to Setup Your NFC Card</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mb-6">
                VMC Buying Group members will receive a physical NFC card to help you network and grow your pharmacy business connections.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-[#C41E3A] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white mb-1">Create your digital card</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                      Sign up for a free Helix account and create your digital business card
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#C41E3A] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white mb-1">Download the Helix Card app</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                      In the app, from the dashboard of your cards, find the 3-dot menu button in the top right corner of your card and tap it.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#C41E3A] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white mb-1">Select &quot;Add to NFC&quot;</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                      From the menu, select the &quot;Add to NFC&quot; option
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#C41E3A] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white mb-1">Tap your physical card</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                      When prompted, tap the back of your physical NFC card to link it
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How NFC Cards Work (Fourth on mobile and desktop) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-8 order-4 md:order-4 h-full">
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                <span className="mr-2 text-[#C41E3A]">📱</span>
                How NFC Cards Work
              </h2>
                
              <div className="space-y-5">
                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                  NFC (Near Field Communication) cards allow you to share your digital business card with a simple tap - no app required for the recipient.
                </p>

                <div className="bg-[#F5FDFD] dark:bg-gray-700 p-4 rounded-lg border border-[#C41E3A]/30">
                  <h3 className="font-medium text-gray-800 dark:text-white mb-2">For different devices:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="bg-[#C41E3A] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        <span className="font-semibold">iPhone users:</span> Tap the <span className="font-medium">top</span> of your phone to the NFC card
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-[#C41E3A] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        <span className="font-semibold">Android users:</span> Tap the <span className="font-medium">back/center</span> of your phone to the NFC card
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-800 dark:text-white">What happens when someone taps your card:</h3>
                  <ol className="space-y-3">
                    <li className="flex items-start">
                      <div className="bg-[#C41E3A] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-medium">
                        1
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Their phone detects the NFC signal and displays a notification
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-[#C41E3A] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-medium">
                        2
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        They tap the notification to open your digital business card in their browser
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-[#C41E3A] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-medium">
                        3
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        They can save your contact info directly to their phone with one tap
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="pt-2">
                  <div className="bg-[#C41E3A]/10 p-4 rounded-lg border border-[#C41E3A]/30">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-bold">Pro Tip:</span> Your NFC card is rewritable - you can reprogram it to link to different digital business cards if you create multiple cards for different purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Helix - Features Section */}
        <div className="bg-white dark:bg-gray-800 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-gray-800 dark:text-white">Why Choose Helix?</h2>
            
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-[#F5FDFD] dark:bg-gray-700 p-6 rounded-xl text-center">
                <div className="bg-[#B8EB41] dark:bg-gray-600 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <CreditCard className="text-gray-800 dark:text-[#7CCEDA] text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Digital First</h3>
                <p className="text-gray-600 dark:text-gray-300">Share your contact information instantly with a tap or scan - no more running out of cards.</p>
              </div>
              
              <div className="bg-[#F5FDFD] dark:bg-gray-700 p-6 rounded-xl text-center">
                <div className="bg-[#C41E3A] dark:bg-[#C41E3A] w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <FaMagic className="text-white dark:text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">AI-Powered Scanning</h3>
                <p className="text-gray-600 dark:text-gray-300">Quickly scan business cards with our advanced AI technology to instantly create digital contacts.</p>
              </div>
              
              <div className="bg-[#F5FDFD] dark:bg-gray-700 p-6 rounded-xl text-center">
                <div className="bg-[#C41E3A] dark:bg-[#C41E3A] w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <Users className="text-white dark:text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Build Connections</h3>
                <p className="text-gray-600 dark:text-gray-300">Manage your network effectively with our built-in contact management system.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-[#F5FDFD] dark:bg-gray-900 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center text-gray-800 dark:text-white">What our users are saying</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Testimonial 1 */}
              <div className="bg-white dark:bg-gray-700 p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-600 dark:text-green-300 font-bold">RJ</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Robert Johnson</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pharmacy Student</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">&quot;The CV upload feature helped me stand out at ASHP Midyear. Love this app!&quot;</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-white dark:bg-gray-700 p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 dark:text-blue-300 font-bold">BG</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Brian Gomez</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sales Director</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">&quot;The AI card scanning feature has saved our team hours of manual data entry. Worth every penny!&quot;</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="bg-white dark:bg-gray-700 p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-4">
                    <span className="text-purple-600 dark:text-purple-300 font-bold">AF</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Alice Foster</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Freelance Designer</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">&quot;I love being able to manage multiple business cards for different clients. The lifetime plan was a no-brainer!&quot;</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#C41E3A] dark:bg-[#C41E3A] py-10 mt-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Ready to grow your pharmacy business?</h2>
            <p className="text-base md:text-lg mb-6 max-w-2xl mx-auto text-white/90">Join fellow pharmacy owners who are already expanding their professional network and growing their business with Helix.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <a 
                href="/#auth"
                className="px-6 py-3 bg-white hover:bg-gray-100 text-[#C41E3A] font-medium rounded-lg inline-flex items-center justify-center transition-colors duration-300"
              >
                Get Started
                <FaArrowRight className="ml-2" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-gray-900 py-6">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                © {new Date().getFullYear()} Helix Business Card. The official digital business card of VMC Buying Group.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 