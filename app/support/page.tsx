'use client';

import React from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

const SupportPage: React.FC = () => {
  return (
    <Layout title="Support - HelixCard" showSidebar={true}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Support</h1>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><Link href="#" className="text-blue-600 hover:underline">How do I create a new business card?</Link></li>
              <li><Link href="#" className="text-blue-600 hover:underline">Can I customize the design of my card?</Link></li>
              <li><Link href="#" className="text-blue-600 hover:underline">What is the difference between free and pro accounts?</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
            <p>If you can not find the answer to your question, please do not hesitate to reach out:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Email: <a href="mailto:support@helixcard.app" className="text-blue-600 hover:underline">support@helixcard.app</a></li>
              <li>Phone: +1 (555) 123-4567</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Helpful Resources</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><Link href="/how-it-works" className="text-blue-600 hover:underline">How It Works Guide</Link></li>
              <li><Link href="#" className="text-blue-600 hover:underline">Video Tutorials</Link></li>
              <li><Link href="#" className="text-blue-600 hover:underline">Best Practices for Digital Business Cards</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SupportPage;
