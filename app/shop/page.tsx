'use client';

import React from 'react';
import Layout from '../components/Layout';

const ShopPage: React.FC = () => {
  return (
    <Layout title="Shop - HelixCard" showSidebar={true}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Shop</h1>
        <p>Welcome to our shop! Here you can browse and purchase our NFC pdoructs allowing you to easily share your digital business card.</p>
        {/* Add your shop content, product listings, etc. */}
      </div>
    </Layout>
  );
};

export default ShopPage;
