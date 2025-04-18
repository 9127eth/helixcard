'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { 
  List, 
  CreditCard, 
  Zap, 
  HelpCircle, 
  Settings, 
  Users, 
  ShoppingCart, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Sun 
} from 'react-feather';
import { useTheme } from 'next-themes';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
  transparentHeader?: boolean;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'HelixCard', showSidebar = true, transparentHeader = false, showHeader = true }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { theme, setTheme } = useTheme();

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

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
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
            <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} flex flex-col transition-all duration-300 ease-in-out bg-sidebar-bg`}>
              <header className="bg-sidebar-bg shadow-sm flex items-center justify-center p-4">
                {isSidebarOpen && (
                  <Link href="/" className="flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Helix Logo"
                      width={100}
                      height={100}
                      priority
                    />
                  </Link>
                )}
                <button 
                  onClick={toggleSidebar} 
                  className={`transition-transform duration-300 ease-in-out ${isLargeScreen ? 'hidden' : ''}`}
                  aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {isSidebarOpen ? (
                    <ChevronLeft className="w-6 h-6 text-header-footer-secondary-text stroke-[1.5]" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-header-footer-secondary-text stroke-[1.5]" />
                  )}
                </button>
              </header>
              <aside className="bg-sidebar-bg flex-1">
                <div className="h-full flex flex-col justify-between p-4">
                  <nav>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/dashboard" className="flex items-center space-x-2 p-2 rounded hover:bg-background">
                          <CreditCard className="w-4 h-4" />
                          {isSidebarOpen && <span className="text-sm">My Cards</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/contacts" className="flex items-center space-x-2 p-2 rounded hover:bg-background">
                          <Users className="w-4 h-4" />
                          {isSidebarOpen && <span className="text-sm">Contacts</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/how-it-works" className="flex items-center space-x-2 p-2 rounded hover:bg-background">
                          <List className="w-4 h-4" />
                          {isSidebarOpen && <span className="text-sm">How It Works</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/get-helix-pro" className="flex items-center space-x-2 p-2 rounded hover:bg-background">
                          <Zap className="w-4 h-4" />
                          {isSidebarOpen && <span className="text-sm">Get Helix Pro</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/shop" className="flex items-center space-x-2 p-2 rounded hover:bg-background">
                          <ShoppingCart className="w-4 h-4" />
                          {isSidebarOpen && <span className="text-sm">Shop</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/support" className="flex items-center space-x-2 p-2 rounded hover:bg-background">
                          <HelpCircle className="w-4 h-4" />
                          {isSidebarOpen && <span className="text-sm">Support</span>}
                        </Link>
                      </li>
                      <li>
                        <Link href="/settings" className="flex items-center space-x-2 p-2 rounded hover:bg-background">
                          <Settings className="w-4 h-4" />
                          {isSidebarOpen && <span className="text-sm">Settings</span>}
                        </Link>
                      </li>
                      <li className="mt-4">
                        <button onClick={handleSignOut} className="flex items-center space-x-2 p-2 rounded hover:bg-background w-full text-left">
                          <LogOut className="w-4 h-4" />
                          {isSidebarOpen && <span className="text-sm">Sign Out</span>}
                        </button>
                      </li>
                      {isSidebarOpen && (
                        <>
                          <li>
                            <div className="flex items-center justify-between p-2 rounded hover:bg-background">
                              <div className="flex items-center space-x-2">
                                <Sun className="w-4 h-4" />
                                <span className="text-sm">Dark Mode</span>
                              </div>
                              <button
                                onClick={toggleDarkMode}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${
                                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out ${
                                    theme === 'dark' ? 'transform translate-x-6' : ''
                                  }`}
                                ></div>
                              </button>
                            </div>
                          </li>
                        </>
                      )}
                    </ul>
                  </nav>
                </div>
              </aside>
            </div>
            <div className="flex-1 flex flex-col">
              {showHeader && (
                <header className={`${transparentHeader ? 'bg-transparent' : 'bg-background'}`}>
                  <div className="px-4 py-4">
                    {/* Add any content for the right side header here */}
                  </div>
                </header>
              )}
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
};

export default Layout;