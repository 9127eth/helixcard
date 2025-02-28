'use client';

import React, { useEffect } from 'react';
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

  // Add smooth scrolling behavior to the page
  useEffect(() => {
    // Add smooth scrolling to the HTML element
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Handle anchor clicks with offset
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      
      if (anchor) {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            const headerOffset = 80; // Adjust based on your header height
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            
            // Update URL without causing a jump
            history.pushState(null, '', targetId);
          }
        }
      }
    };
    
    document.addEventListener('click', handleAnchorClick);
    
    // Clean up when component unmounts
    return () => {
      document.documentElement.style.scrollBehavior = '';
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

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
            
            <div className="mt-12 text-center">
              <a 
                href="#pricing"
                className="px-8 py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg inline-flex items-center justify-center transition-colors duration-300"
              >
                View Pricing
                <FaArrowRight className="ml-2" />
              </a>
            </div>
          </div>
        </div>

        {/* Detailed Features Section */}
        <div id="features" className="bg-[#F5FDFD] dark:bg-gray-900 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-white">Powerful Features for <span className="text-[#7CCEDA] dark:text-[#7CCEDA]">Modern Networking</span></h2>
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

        {/* Testimonials Section - Added from Get Helix Pro page */}
        <div className="bg-white dark:bg-gray-800 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-800 dark:text-white">What our users are saying</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Testimonial 1 - Pharmacy Student */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
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
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
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
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
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

        {/* Pricing Comparison Section */}
        <div id="pricing" className="bg-gradient-to-b from-white to-[#F5FDFD] dark:from-gray-800 dark:to-gray-700 py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-white">Smart Networking, <span className="text-[#7CCEDA] dark:text-[#7CCEDA]">Smart Pricing</span></h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                See how Helix transforms not just your networking experience, but your budget too.
              </p>
            </div>

            {/* Pricing Cards - 3 Column Layout */}
            <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
              {/* Traditional Cards */}
              <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="bg-gray-500 text-white py-4 px-4 text-center font-medium">
                  Traditional Cards
                </div>
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="bg-red-100 dark:bg-red-900/30 w-20 h-20 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="text-center mb-8">
                    <div className="text-5xl font-bold text-gray-800 dark:text-white mb-2">$320<span className="text-2xl">+</span></div>
                    <p className="text-gray-500 dark:text-gray-400">per year</p>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Constant reordering costs</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Limited information space</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Easy to forget or run out</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Environmental waste</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Manual contact management</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Helix Basic */}
              <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="bg-[#B8EB41] text-gray-800 py-4 px-4 text-center font-medium">
                  Helix Basic
                </div>
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="bg-[#B8EB41]/20 dark:bg-[#B8EB41]/30 w-20 h-20 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#B8EB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="text-center mb-8">
                    <div className="text-5xl font-bold text-gray-800 dark:text-white mb-2">$0</div>
                    <p className="text-gray-500 dark:text-gray-400">forever</p>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#B8EB41] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">1 digital business card</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#B8EB41] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Basic contact information</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#B8EB41] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Link to physical NFC card</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#B8EB41] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Add to Apple Wallet</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#B8EB41] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Unlimited sharing</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <a 
                      href="#auth"
                      className="block w-full py-3 bg-[#B8EB41] hover:bg-[#a6d53a] text-gray-800 font-medium rounded-lg text-center transition-colors duration-300"
                    >
                      Get Started Free
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Helix Pro - Highlighted */}
              <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative border-2 border-[#7CCEDA] animate-pulse-glow">
                <div className="absolute top-4 right-4">
                  <div className="bg-[#FC9A99] text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                    Most Popular
                  </div>
                </div>
                <div className="bg-[#7CCEDA] text-gray-800 py-4 px-4 text-center font-medium">
                  Helix Pro
                </div>
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="bg-[#7CCEDA]/20 dark:bg-[#7CCEDA]/30 w-20 h-20 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#7CCEDA]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="text-center mb-8">
                    <div className="text-5xl font-bold text-gray-800 dark:text-white mb-2">$19.99</div>
                    <p className="text-gray-500 dark:text-gray-400">lifetime access</p>
                    <div className="mt-2 text-sm">
                      <span className="text-[#7CCEDA] font-medium">Also available:</span> $2.99/month or $12.99/year
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#7CCEDA] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300"><strong>Everything in Basic</strong></p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#7CCEDA] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Up to 10 business cards</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#7CCEDA] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">AI card scanning</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#7CCEDA] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">CV/Resume upload</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-[#7CCEDA] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-300">Advanced analytics</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <a 
                      href="#auth"
                      className="block w-full py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg text-center transition-colors duration-300"
                    >
                      Get Started
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add See Features button after pricing cards */}
            <div className="text-center mt-8 mb-16">
              <a 
                href="#features"
                className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg inline-flex items-center justify-center transition-colors duration-300 border border-gray-300"
              >
                See All Features
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              </a>
            </div>
            
            {/* ROI Calculator */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-white">Your Savings with Helix Pro</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Traditional Card Costs</h4>
                    <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Initial order (250 cards)</span>
                        <span className="font-medium text-gray-800 dark:text-white">$50</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Reordering (3x per year)</span>
                        <span className="font-medium text-gray-800 dark:text-white">$150</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Card holders & storage</span>
                        <span className="font-medium text-gray-800 dark:text-white">$20</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Time spent managing</span>
                        <span className="font-medium text-gray-800 dark:text-white">$100+</span>
                      </div>
                      <div className="h-px bg-gray-200 dark:bg-gray-500 my-2"></div>
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-gray-800 dark:text-white">Annual cost</span>
                        <span className="text-gray-800 dark:text-white">$320+</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Helix Pro Costs</h4>
                    <div className="bg-[#F5FDFD] dark:bg-gray-600 rounded-lg p-4 border border-[#7CCEDA]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Lifetime Pro subscription</span>
                        <span className="font-medium text-gray-800 dark:text-white">$19.99</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Annual maintenance</span>
                        <span className="font-medium text-gray-800 dark:text-white">$0</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Time spent managing</span>
                        <span className="font-medium text-gray-800 dark:text-white">$0</span>
                      </div>
                      <div className="h-px bg-gray-200 dark:bg-gray-500 my-2"></div>
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-gray-800 dark:text-white">Lifetime cost</span>
                        <span className="text-gray-800 dark:text-white">$19.99</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center">
                  <div className="text-center p-6 bg-gradient-to-br from-[#F5FDFD] to-white dark:from-gray-600 dark:to-gray-700 rounded-xl border border-[#7CCEDA] shadow-md">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Your savings with Helix Pro:</p>
                    <div className="text-6xl font-bold text-[#7CCEDA] mb-4">$1,580+</div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Based on $320+ annual cost of traditional cards over 5 years ($1,600+) minus the one-time $19.99 Helix Pro lifetime subscription</p>
                    
                    <div className="mt-6">
                      <a 
                        href="#auth"
                        className="inline-block px-6 py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg transition-colors duration-300"
                      >
                        Start Saving Today
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Benefits */}
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">Beyond the Savings</h3>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                  <div className="bg-[#7CCEDA]/20 dark:bg-[#7CCEDA]/30 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#7CCEDA]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Increased Reach</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Share your digital card with anyone, anywhere, anytime - no physical limitations
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                  <div className="bg-[#B8EB41]/20 dark:bg-[#B8EB41]/30 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#B8EB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Time Efficiency</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    No more manual data entry or organizing physical cards in holders
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                  <div className="bg-[#FC9A99]/20 dark:bg-[#FC9A99]/30 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#FC9A99]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Professional Image</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Stand out with modern networking technology that impresses connections
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
