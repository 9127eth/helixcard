'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { FaList, FaAddressBook, FaShoppingCart, FaChevronLeft, FaChevronRight, FaSignOutAlt } from 'react-icons/fa';
import { FaCreditCard } from 'react-icons/fa';
import { FaStar } from 'react-icons/fa';
import { FaQuestionCircle, FaCog } from 'react-icons/fa';

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
                          <FaCreditCard className="text-xs" />
                          {isSidebarOpen && <span className="text-sm">My Cards</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/how-it-works" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
                          <FaList className="text-xs" />
                          {isSidebarOpen && <span className="text-sm">How It Works</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/get-helix-pro" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
                          <FaStar className="text-xs" />
                          {isSidebarOpen && <span className="text-sm">Get Helix Pro</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/support" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
                          <FaQuestionCircle className="text-xs" />
                          {isSidebarOpen && <span className="text-sm">Support</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/settings" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
                          <FaCog className="text-xs" />
                          {isSidebarOpen && <span className="text-sm">Settings</span>}
                        </Link>
                      </li>
                      <li className="opacity-50 cursor-not-allowed">
                        <div className="flex items-center space-x-2 p-2 rounded">
                          <FaAddressBook className="text-xs" />
                          {isSidebarOpen && <span className="text-sm">Contacts (Coming Soon)</span>}
                        </div>
                      </li>
                      <li className="opacity-50 cursor-not-allowed">
                        <div className="flex items-center space-x-2 p-2 rounded">
                          <FaShoppingCart className="text-xs" />
                          {isSidebarOpen && <span className="text-sm">Shop (Coming Soon)</span>}
                        </div>
                      </li>
                      <li className="mt-4">
                        <button onClick={handleSignOut} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200 w-full text-left">
                          <FaSignOutAlt className="text-xs" />
                          {isSidebarOpen && <span className="text-sm">Sign Out</span>}
                        </button>
                      </li>
                    </ul>
                  </nav>
                  {isSidebarOpen && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-600">Signed in as {user.email}</p>
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
              <main className="flex-grow">
                {children}
              </main>
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