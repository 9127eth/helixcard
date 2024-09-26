'use client';

import React from 'react';
import Layout from '../components/Layout';

const ShopPage: React.FC = () => {
  return (
    <Layout title="Shop - HelixCard" showSidebar={true}>
      <div className="flex">
        <div className="w-[70%] pl-8 pr-12">
          <h1 className="text-2xl font-bold mb-4">Shop</h1>
          <p>Welcome to our shop! Here you can browse and purchase our NFC products allowing you to easily share your digital business card.</p>
          {/* Add your shop content, product listings, etc. */}
        </div>
        <div className="w-[30%] bg-background"></div>
      </div>
    </Layout>
  );
};

export default ShopPage;
