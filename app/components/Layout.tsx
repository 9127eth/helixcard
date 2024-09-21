import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'HelixCard', showSidebar = true }) => {
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
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Digital NFC Business Card App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-1">
        {user && showSidebar ? (
          <>
            <div className="w-64 flex flex-col">
              <header className="bg-off-white shadow-sm">
                <div className="px-4 py-4">
                  <Link href="/" className="text-2xl font-bold text-foreground">helixCard</Link>
                </div>
              </header>
              <aside className="bg-off-white flex-1">
                <div className="h-full flex flex-col justify-between p-4">
                  <nav>
                    <ul className="space-y-2">
                      <li><Link href="/dashboard" className="block py-2 px-4 rounded hover:bg-gray-200">Dashboard</Link></li>
                      <li><Link href="/create-card" className="block py-2 px-4 rounded hover:bg-gray-200">Create Card</Link></li>
                    </ul>
                  </nav>
                  <div className="mt-8">
                    <p className="text-sm text-gray-600">Signed in as {user.email}</p>
                    <button onClick={handleSignOut} className="text-foreground hover:text-gray-900 mt-2">Sign Out</button>
                  </div>
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
};

export default Layout;
