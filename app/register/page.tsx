'use client';

import React from 'react';
import Layout from '../components/Layout';
import { RegisterForm } from '../components/RegisterForm';

const RegisterPage: React.FC = () => {
  const handleSuccess = () => {
    console.log('Registration successful');
    // Add any additional logic here, such as redirecting to a dashboard
  };

  return (
    <Layout title="Register - HelixCard">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create an Account</h1>
        <RegisterForm onSuccess={handleSuccess} />
      </div>
    </Layout>
  );
};

export default RegisterPage;
