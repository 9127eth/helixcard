'use client';

import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import Image from 'next/image';
import { FaArrowRight, FaMagic, FaArrowCircleRight } from 'react-icons/fa';
import { CreditCard, Users } from 'react-feather';

export default function LipscombPage() {
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
          </div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 pb-8 md:pb-16">
          {/* Hero Content - Full width on mobile, center aligned on all screens */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-gray-800 dark:text-white">
              Support <span className="text-[#2e1949] dark:text-[#2e1949]">Lipscomb APhA</span> with Your <span className="text-[#f2ab08] dark:text-[#f2ab08]">Digital Business Card</span>
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-10">
              Join your local American Pharmacists Association (APhA) fundraiser by creating your personalized digital business card. For every lifetime Helix Pro purchase using code LIPSCOMB25, a contribution will be made to support Lipscomb University&apos;s local APhA chapter.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-center">
              <a 
                href="/#auth"
                className="px-6 py-3 bg-[#2e1949] hover:bg-[#231335] text-white font-medium rounded-lg flex items-center justify-center transition-colors duration-300"
              >
                Get Started
                <FaArrowRight className="ml-2" />
              </a>
            </div>
            <div className="mb-8">
              <a
                href="https://www.helixcard.app/c/9odg5w/1ob"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-[#2e1949] hover:text-[#231335] font-medium mb-8 justify-center"
              >
                <FaArrowCircleRight className="mr-2" />
                See Sample Business Card
              </a>
            </div>
          </div>

          {/* 2x2 Grid on Desktop, Single Column on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Phone Image & Special Offer (First on mobile, desktop) */}
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
                <div className="mr-2 p-1.5 bg-[#2e1949]/10 rounded-full">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12L13 4V8C13 8 4 9 4 20C4 20 8 16 13 16V20L21 12Z" stroke="#2e1949" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Special Offer:</span> Get 10% off Lifetime Helix Pro with code <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-[#2e1949] font-bold inline-block mt-1">LIPSCOMB25</span>
                </span>
              </div>
            </div>

            {/* How to Redeem (Second on mobile and desktop) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-8 order-2 md:order-2 h-full">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                  <span className="mr-2 text-[#f2ab08]">🎁</span>
                  Redeem Your Helix Pro Discount
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="bg-[#2e1949]/10 p-4 rounded-lg border border-[#2e1949]/30 mb-6">
                      <div className="flex flex-col sm:flex-row items-start">
                        <div className="bg-[#2e1949] text-white h-8 px-3 rounded-lg flex items-center justify-center mr-3 mb-3 sm:mb-0 font-bold text-sm">
                          EXCLUSIVE
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base">
                          As a Lipscomb APhA fundraiser supporter, you get 10% off Lifetime Helix Pro with code: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-[#2e1949] font-bold inline-block mt-1">LIPSCOMB25</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#2e1949] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
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
                    <div className="bg-[#2e1949] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white mb-1">Visit Get Helix Pro page</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                        Click the &quot;Get Helix Pro&quot; tab in the menu or go directly to <a href="https://www.helixcard.app/get-helix-pro" target="_blank" rel="noopener noreferrer" className="text-[#2e1949] underline">www.helixcard.app/get-helix-pro</a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#2e1949] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
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
                    <div className="bg-[#2e1949] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white mb-1">Enter the code</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                        Find the &quot;Coupon Code&quot; field and enter <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[#2e1949] font-bold">LIPSCOMB25</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <div className="bg-[#F5FDFD] dark:bg-gray-700 p-4 rounded-lg border border-[#2e1949]/30">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-bold">Important:</span> You must visit <a href="https://www.helixcard.app/get-helix-pro" target="_blank" rel="noopener noreferrer" className="text-[#2e1949] underline">www.helixcard.app/get-helix-pro</a> to redeem the code, not the app. Use the same login method you used to create your account. Remember to select the Lifetime plan to receive your 10% discount.
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
                You will receive a physical NFC card with your purchase and it will be used to connect to a digital business card.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-[#2e1949] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
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
                  <div className="bg-[#2e1949] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
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
                  <div className="bg-[#2e1949] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
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
                  <div className="bg-[#331E52] text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
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
                <span className="mr-2 text-[#f2ab08]">📱</span>
                How NFC Cards Work
              </h2>
                
              <div className="space-y-5">
                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                  NFC (Near Field Communication) cards allow you to share your digital business card with a simple tap - no app required for the recipient.
                </p>

                <div className="bg-[#F5FDFD] dark:bg-gray-700 p-4 rounded-lg border border-[#2e1949]/30">
                  <h3 className="font-medium text-gray-800 dark:text-white mb-2">For different devices:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="bg-[#2e1949] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        <span className="font-semibold">iPhone users:</span> Tap the <span className="font-medium">top</span> of your phone to the NFC card
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-[#2e1949] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
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
                      <div className="bg-[#2e1949] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-medium">
                        1
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Their phone detects the NFC signal and displays a notification
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-[#2e1949] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-medium">
                        2
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        They tap the notification to open your digital business card in their browser
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-[#2e1949] text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-medium">
                        3
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        They can save your contact info, view your details, and interact with your links
                      </p>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Helix - Features Section */}
        <div className="py-12 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center text-gray-800 dark:text-white">Why Choose Helix for Your Digital Business Card</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-10 max-w-3xl mx-auto">
              Helix gives you a powerful, professional way to share your contact information and support Lipscomb University&apos;s APhA chapter at the same time.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-[#F5FDFD] dark:bg-gray-700 p-6 rounded-xl text-center">
                <div className="bg-[#f2ab08] dark:bg-[#f2ab08] w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <FaMagic className="text-white dark:text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Easy Setup</h3>
                <p className="text-gray-600 dark:text-gray-300">Create your digital card in minutes with our intuitive builder—no technical skills needed.</p>
              </div>
              
              <div className="bg-[#F5FDFD] dark:bg-gray-700 p-6 rounded-xl text-center">
                <div className="bg-[#2e1949] dark:bg-[#2e1949] w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <CreditCard className="text-white dark:text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">NFC Technology</h3>
                <p className="text-gray-600 dark:text-gray-300">Share your card with a simple tap using our NFC technology—no app needed for recipients.</p>
              </div>
              
              <div className="bg-[#F5FDFD] dark:bg-gray-700 p-6 rounded-xl text-center">
                <div className="bg-[#f2ab08] dark:bg-[#f2ab08] w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <Users className="text-white dark:text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Support Lipscomb APhA</h3>
                <p className="text-gray-600 dark:text-gray-300">For every card created with our special code, we&apos;ll make a contribution to Lipscomb University&apos;s local APhA chapter.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-[#F5FDFD] dark:bg-gray-900 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center text-gray-800 dark:text-white">What our users are saying</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Testimonial 1 */}
              <div className="bg-white dark:bg-gray-700 p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-600 dark:text-green-300 font-bold">MJ</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Michael Johnson</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Director</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">&quot;Helix has completely changed the way I network. The digital card is so professional, and people are always impressed when I share it.&quot;</p>
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
                    <span className="text-blue-600 dark:text-blue-300 font-bold">SP</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Sarah Parker</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Business Owner</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">&quot;I love that I can support Lipscomb&apos;s APhA chapter while also getting a useful networking tool. The NFC feature is amazing - no more fumbling with paper cards!&quot;</p>
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
                    <span className="text-purple-600 dark:text-purple-300 font-bold">RW</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Robert Wilson</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Lipscomb Alumnus</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">&quot;As an alumnus, I&apos;m proud to use a product that gives back to my alma mater. The digital card is so much more dynamic than traditional business cards.&quot;</p>
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
        <div className="bg-[#2e1949] dark:bg-[#2e1949] py-12 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Support Lipscomb APhA?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Create your digital business card today and help contribute to Lipscomb University&apos;s American Pharmacists Association chapter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/#auth"
                className="px-6 py-3 bg-white text-[#2e1949] hover:bg-gray-100 font-medium rounded-lg flex items-center justify-center transition-colors duration-300 sm:w-auto"
              >
                Get Started
                <FaArrowRight className="ml-2" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="py-8 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400 text-sm">
            <p className="mb-4">
              &copy; {new Date().getFullYear()} Helix Digital Business Card. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </Layout>
  );
} 