'use client';

import React from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <Layout title="Privacy Policy - HelixCard">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Purpose:</strong> This Privacy Policy describes how Rx Radio, LLC collects, uses, shares, and protects your personal information when you use the App.</li>
              <li><strong>Consent:</strong> By using the App, you agree to the collection and use of information in accordance with this policy.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Data:</strong> We may collect personal information such as your name, email address, job title, and other details you provide when registering for an account or using the App.</li>
              <li><strong>Usage Data:</strong> We collect data about how you interact with the App, including device information, IP address, and activity logs.</li>
              <li><strong>Cookies and Tracking:</strong> The App may use cookies and similar technologies to enhance user experience and analyze usage patterns.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Provision:</strong> To operate, maintain, and improve the App, including providing personalized experiences and customer support.</li>
              <li><strong>Communication:</strong> To send important updates, newsletters, or promotional content. You can opt out of non-essential communications at any time.</li>
              <li><strong>Analytics:</strong> To analyze how users interact with the App, helping us improve functionality and user satisfaction.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing (EU Users)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Consent:</strong> We process your data based on your consent where applicable.</li>
              <li><strong>Legitimate Interests:</strong> We process data as necessary for the performance of our services or for our legitimate interests in improving the App.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Third-Party Services:</strong> We may share your information with third-party service providers who assist in the App's operation, such as hosting services and analytics providers.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid legal requests.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">6. International Data Transfers</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cross-Border Transfer:</strong> Your data may be transferred and processed in countries with data protection laws different from those in your country.</li>
              <li><strong>Safeguards:</strong> We implement safeguards such as standard contractual clauses to ensure the protection of your data during international transfers.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Retention Period:</strong> We retain your personal data only as long as necessary for the purposes outlined in this policy or as required by law.</li>
              <li><strong>Deletion:</strong> You can delete your account and data from the settings menu or you may request the deletion of your data by contacting us at <a href="mailto:hello@helixcard.app" className="text-blue-600 hover:underline">hello@helixcard.app</a>.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights (EU Users)</h2>
            <p className="mb-4">As an EU user, you have specific rights regarding your personal data. These include the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request and obtain access to the personal data we have collected and stored about you.</li>
              <li><strong>Rectification:</strong> Request corrections to any inaccurate or incomplete personal data we hold.</li>
              <li><strong>Erasure:</strong> Request the deletion of your personal data in certain situations, such as when it is no longer needed for its original purpose or if you withdraw consent.</li>
              <li><strong>Objection:</strong> Object to the processing of your personal data where we rely on legitimate interests, or where processing is for direct marketing purposes.</li>
              <li><strong>Data Portability:</strong> Receive a copy of your personal data in a structured, commonly used, and machine-readable format, and, where feasible, request the transfer of this data to another organization.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">9. California Privacy Rights (CCPA)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Disclosure:</strong> We disclose the categories of personal information collected and the purposes for which it is used.</li>
              <li><strong>Opt-Out:</strong> California residents have the right to opt out of the sale of their personal information. However, we do not sell any personal information.</li>
              <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">10. Security Measures</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Protection:</strong> We implement reasonable measures to protect your personal data from unauthorized access or misuse.</li>
              <li><strong>No Guarantee:</strong> While we strive to protect your information, no method of data transmission or storage is 100% secure.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Age Restriction:</strong> The App is not intended for use by children under 13. We do not knowingly collect data from children under 13 without parental consent.</li>
              <li><strong>Parental Consent:</strong> If we become aware that a child under 13 has provided us with personal information without parental consent, we will delete such data.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Updates:</strong> We may update this Privacy Policy periodically. Changes will be posted on this page, and significant changes may be communicated through the App or via email.</li>
              <li><strong>Notification:</strong> Continued use of the App after such updates signifies your acceptance of the changes.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Inquiries:</strong> If you have any questions or concerns regarding this Privacy Policy, please contact us at <a href="mailto:hello@helixcard.app" className="text-blue-600 hover:underline">hello@helixcard.app</a>.</li>
            </ul>
          </div>
        </section>

        <div className="mt-8">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Home
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;
