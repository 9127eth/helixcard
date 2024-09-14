import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'HelixCard' }) => {
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-foreground" style={{backgroundColor: 'white'}}>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Digital NFC Business Card App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className="p-4 bg-blue text-black">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">helixCard</Link>
          {user && (
            <nav>
              <ul className="flex space-x-4">
                <li><Link href="/dashboard" className="hover:text-red">Dashboard</Link></li>
                <li><Link href="/create-card" className="hover:text-red">Create Card</Link></li>
                <li><button onClick={handleSignOut} className="hover:text-red">Sign Out</button></li>
              </ul>
            </nav>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
