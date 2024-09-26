'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { FaQuestionCircle, FaAddressBook, FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Custom BusinessCard icon component
const BusinessCardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2" />
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'HelixCard', showSidebar = true }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // 1024px is the 'lg' breakpoint in Tailwind
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Digital NFC Business Card App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-1">
        {user && showSidebar ? (
          <>
            <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} flex flex-col transition-all duration-300 ease-in-out`}>
              <header className="bg-off-white shadow-sm flex items-center justify-between p-4">
                {isSidebarOpen ? (
                  <Link href="/" className="text-2xl font-bold text-foreground">Helix.</Link>
                ) : (
                  <span className="text-2xl font-bold">H</span>
                )}
                <button 
                  onClick={toggleSidebar} 
                  className={`transition-transform duration-300 ease-in-out ${isLargeScreen ? 'hidden' : ''}`}
                  aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {isSidebarOpen ? (
                    <FaChevronLeft className="w-6 h-6 text-[#F1DBD9] stroke-[1.5]" />
                  ) : (
                    <FaChevronRight className="w-6 h-6 text-[#F1DBD9] stroke-[1.5]" />
                  )}
                </button>
              </header>
              <aside className="bg-off-white flex-1">
                <div className="h-full flex flex-col justify-between p-4">
                  <nav>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/dashboard" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
                          <BusinessCardIcon />
                          {isSidebarOpen && <span>My Cards</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/how-it-works" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
                          <FaQuestionCircle className="text-xl" />
                          {isSidebarOpen && <span>How It Works</span>}
                        </Link>
                      </li>
                      <li className="opacity-50 cursor-not-allowed">
                        <div className="flex items-center space-x-2 p-2 rounded">
                          <FaAddressBook className="text-xl" />
                          {isSidebarOpen && <span>Contacts (Coming Soon)</span>}
                        </div>
                      </li>
                      <li>
                        <Link href="/shop" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
                          <FaShoppingCart className="text-xl" />
                          {isSidebarOpen && <span>Shop</span>}
                        </Link>
                      </li>
                    </ul>
                  </nav>
                  {isSidebarOpen && (
                    <div className="mt-8">
                      <p className="text-sm text-gray-600">Signed in as {user.email}</p>
                      <button onClick={handleSignOut} className="text-foreground hover:text-gray-900 mt-2">Sign Out</button>
                    </div>
                  )}
                </div>
              </aside>
            </div>
            <div className="flex-1 flex flex-col">
              <header className="bg-background shadow-sm">
                <div className="px-4 py-4">
                  {/* Add any content for the right side header here */}
                </div>
              </header>
              <main className="flex-1 bg-background p-4">{children}</main>
            </div>
          </>
        ) : (
          <main className="flex-1 bg-background">{children}</main>
        )}
      </div>
    </div>
  );
}

export default Layout;
