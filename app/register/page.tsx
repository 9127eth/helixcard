import React from 'react';
import Layout from '../components/Layout';
import { RegisterForm } from '../components/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <Layout title="Register - HelixCard">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create an Account</h1>
        <RegisterForm onSuccess={() => {}} />
      </div>
    </Layout>
  );
};

export default RegisterPage;
