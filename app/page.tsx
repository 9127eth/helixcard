'use client';

import React from 'react';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import { AuthModal } from './components/AuthModal';
import DashboardPage from './dashboard/page';
import LoadingSpinner from './components/LoadingSpinner';
import Image from 'next/image';
import { FaArrowRight, FaApple, FaMagic } from 'react-icons/fa';
import { Cpu, Users, CreditCard } from 'react-feather';

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
