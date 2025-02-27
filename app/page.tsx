'use client';

import React from 'react';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import { AuthModal } from './components/AuthModal';
import DashboardPage from './dashboard/page';
import LoadingSpinner from './components/LoadingSpinner';
import Image from 'next/image';
import { FaArrowRight, FaApple, FaMagic, FaUserTie, FaFileAlt, FaCamera, FaWallet, FaLayerGroup, FaPalette, FaLink, FaFileExport, 
  FaLinkedin, FaInstagram, FaGlobe, FaPhoneAlt, FaEnvelope, FaIdCard, FaFacebook, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Users, CreditCard, Smartphone } from 'react-feather';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <DashboardPage />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-[#F5FDFD] to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Left Column - Hero Content */}
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0 pr-0 lg:pr-12">
              <div className="mb-8">
                <Image
                  src="/logo.png"
                  alt="Helix Logo"
                  width={150}
                  height={150}
                  priority
                  className="mb-6"
                />
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 dark:text-white">
                  A business card that creates <span className="text-[#7CCEDA] dark:text-[#7CCEDA]">memorable connections</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">
                  Elevate your networking with Helix - the digital business card that makes sharing your information seamless, professional, and memorable.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <a 
                    href="#auth"
                    className="px-8 py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg flex items-center justify-center transition-colors duration-300"
                  >
                    Get Started Free
                    <FaArrowRight className="ml-2" />
                  </a>
                  <a
                    href="https://apps.apple.com/us/app/helix-digital-business-card/id6736955244"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 bg-black hover:bg-gray-900 text-white font-medium rounded-lg flex items-center justify-center transition-colors duration-300"
                  >
                    <FaApple className="mr-2" />
                    Download iOS App
                  </a>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  No credit card required. Start for free today.
                </p>
              </div>
            </div>

            {/* Right Column - Auth Modal */}
            <div id="auth" className="w-full lg:w-1/2 flex justify-center">
              <div className="w-full max-w-md">
                <AuthModal />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-gray-800 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">Why Choose Helix?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#F5FDFD] dark:bg-gray-700 p-8 rounded-xl text-center">
                <div className="bg-[#B8EB41] dark:bg-gray-600 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <CreditCard className="text-gray-800 dark:text-[#7CCEDA] text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Digital First</h3>
                <p className="text-gray-600 dark:text-gray-300">Share your contact information instantly with a tap or scan - no more running out of cards.</p>
              </div>
              
              <div className="bg-[#F5FDFD] dark:bg-gray-700 p-8 rounded-xl text-center">
                <div className="bg-[#7CCEDA] dark:bg-gray-600 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <FaMagic className="text-gray-800 dark:text-[#7CCEDA] text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">AI-Powered Scanning</h3>
                <p className="text-gray-600 dark:text-gray-300">Quickly scan business cards with our advanced AI technology to instantly create digital contacts.</p>
              </div>
              
              <div className="bg-[#F5FDFD] dark:bg-gray-700 p-8 rounded-xl text-center">
                <div className="bg-[#FC9A99] dark:bg-gray-600 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <Users className="text-gray-800 dark:text-[#7CCEDA] text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Build Connections</h3>
                <p className="text-gray-600 dark:text-gray-300">Manage your network effectively with our built-in contact management system.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Features Section */}
        <div className="bg-[#F5FDFD] dark:bg-gray-900 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-white">Powerful Features for Modern Networking</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Discover all the ways Helix can transform your professional connections and streamline your networking experience.
              </p>
            </div>
            
            {/* Feature Group 1: Card Management */}
            <div className="mb-20">
              <div className="flex flex-col md:flex-row items-center mb-12">
                <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-12">
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Personalized Digital Cards</h3>
                  <div className="h-1 w-20 bg-[#7CCEDA] mb-6"></div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    Create your perfect digital identity with Helix&apos;s powerful customization tools. Design cards that truly represent you and your brand.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-[#7CCEDA] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <FaLayerGroup className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Multiple Cards</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Create and manage multiple business cards for different roles, companies, or contexts.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-[#B8EB41] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <FaPalette className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Design Options</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Choose from multiple templates and colors to create a card that truly represents you.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  {/* Card Customization Visual */}
                  <div className="flex justify-center items-center h-full">
                    <Image
                      src="/helix phone.png"
                      alt="Helix Card on Phone"
                      width={640}
                      height={1000}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Group 2: Content & Integrations */}
            <div className="mb-20">
              <div className="flex flex-col md:flex-row-reverse items-center mb-12">
                <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pl-12">
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Rich Content & Integrations</h3>
                  <div className="h-1 w-20 bg-[#FC9A99] mb-6"></div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    Share more than just contact details. Helix lets you connect all your professional content and platforms in one place.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-[#FC9A99] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <FaLink className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Social Media Integration</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Connect all your social profiles and websites with a single tap.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-[#7CCEDA] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <FaFileAlt className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Resume Attachments</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Attach your CV or resume directly to your digital card for instant access.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  {/* Social Media Icons Grid */}
                  <div className="p-6 h-full">
                    <div className="relative mx-auto" style={{ maxWidth: '320px' }}>
                      <div className="grid grid-cols-3 gap-6">
                        {/* LinkedIn */}
                        <div className="flex flex-col items-center">
                          <div className="bg-[#0077B5] w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <FaLinkedin className="text-white" size={32} />
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</span>
                        </div>
                        
                        {/* Twitter */}
                        <div className="flex flex-col items-center">
                          <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <FaXTwitter className="text-white" size={28} />
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">X</span>
                        </div>
                        
                        {/* Instagram */}
                        <div className="flex flex-col items-center">
                          <div className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <FaInstagram className="text-white" size={32} />
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Instagram</span>
                        </div>
                        
                        {/* Facebook */}
                        <div className="flex flex-col items-center">
                          <div className="bg-[#4267B2] w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <FaFacebook className="text-white" size={32} />
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</span>
                        </div>
                        
                        {/* YouTube */}
                        <div className="flex flex-col items-center">
                          <div className="bg-[#FF0000] w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <FaYoutube className="text-white" size={32} />
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">YouTube</span>
                        </div>
                        
                        {/* Website */}
                        <div className="flex flex-col items-center">
                          <div className="bg-[#7CCEDA] w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <FaGlobe className="text-white" size={32} />
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Website</span>
                        </div>
                        
                        {/* Resume */}
                        <div className="flex flex-col items-center">
                          <div className="bg-[#FC9A99] w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <FaFileAlt className="text-white" size={32} />
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Resume</span>
                        </div>
                        
                        {/* Email */}
                        <div className="flex flex-col items-center">
                          <div className="bg-[#B8EB41] w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <FaEnvelope className="text-white" size={32} />
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                        </div>
                        
                        {/* Phone */}
                        <div className="flex flex-col items-center">
                          <div className="bg-gradient-to-br from-[#7CCEDA] to-[#5BA3B0] w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <FaPhoneAlt className="text-white" size={32} />
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Phone</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Group 3: AI & Smart Features */}
            <div className="mb-20">
              <div className="flex flex-col md:flex-row items-center mb-12">
                <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-12">
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">AI-Powered Networking</h3>
                  <div className="h-1 w-20 bg-[#B8EB41] mb-6"></div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    Leverage cutting-edge AI technology to streamline your networking process and capture leads effortlessly.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-[#B8EB41] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <FaCamera className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-1">AI Card Scanning</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Scan physical business cards with your camera to create digital contacts instantly.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-[#FC9A99] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <FaFileExport className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-1">CRM Integration</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Export your collected leads to popular CRM systems with just a few clicks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  {/* AI Scanning Visual - Simplified */}
                  <div className="p-6 h-full">
                    <div className="relative mx-auto" style={{ maxWidth: '320px' }}>
                      {/* Camera Frame */}
                      <div className="bg-gradient-to-br from-[#B8EB41] to-[#96C22D] rounded-2xl p-8 shadow-lg">
                        {/* Card Outline with Scanning Effect */}
                        <div className="relative bg-black bg-opacity-80 rounded-lg aspect-[4/3] overflow-hidden">
                          {/* Scanning Animation */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#B8EB41] to-transparent opacity-30 animate-scan"></div>
                          
                          {/* Card Placeholder */}
                          <div className="absolute inset-8 border-2 border-dashed border-[#B8EB41] rounded-md flex items-center justify-center">
                            <div className="text-white text-center">
                              <FaIdCard className="mx-auto mb-2 opacity-50" size={32} />
                              <p className="text-sm opacity-70">Position business card here</p>
                            </div>
                          </div>
                          
                          {/* Corner Markers */}
                          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#B8EB41]"></div>
                          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#B8EB41]"></div>
                          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#B8EB41]"></div>
                          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#B8EB41]"></div>
                        </div>
                        
                        {/* Camera Button */}
                        <div className="flex justify-center mt-6">
                          <div className="bg-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg">
                            <FaCamera className="text-[#B8EB41]" size={24} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Features in Grid */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-center mb-12 text-gray-800 dark:text-white">And Much More...</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
                  <div className="bg-[#7CCEDA] dark:bg-gray-700 w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <FaWallet className="text-white text-2xl" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Apple Wallet Integration</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Add your Helix card to Apple Wallet for quick access even without an internet connection.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
                  <div className="bg-[#B8EB41] dark:bg-gray-700 w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <FaUserTie className="text-white text-2xl" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Lead Capture</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Capture leads with ease and import them into your favorite CRM.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
                  <div className="bg-[#FC9A99] dark:bg-gray-700 w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <Smartphone className="text-white text-2xl" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">NFC Capabilities</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Add your digital card to physical NFC devices for instant sharing with a simple tap.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#7CCEDA] dark:bg-gray-700 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Ready to transform your networking?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-700 dark:text-gray-200">Join thousands of professionals who have already upgraded their business card experience with Helix.</p>
            <a 
              href="#auth"
              className="px-8 py-3 bg-white text-gray-800 hover:bg-gray-100 font-medium rounded-lg inline-flex items-center justify-center transition-colors duration-300"
            >
              Create Your Card Now
              <FaArrowRight className="ml-2" />
            </a>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="bg-white dark:bg-gray-900 py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Helix Business Card. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
