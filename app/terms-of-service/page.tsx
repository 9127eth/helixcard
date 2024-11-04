'use client';

import React from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

const TermsOfServicePage: React.FC = () => {
  return (
    <Layout title="Terms of Service - HelixCard">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Top Home Button */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Purpose:</strong> This document outlines the terms and conditions that govern your use of Helix Card ("the App"), a digital business card creation and sharing platform, provided by Rx Radio, LLC ("we," "us," or "our").</li>
              <li><strong>Acceptance:</strong> By using helixcard.app or downloading, accessing, or using the Helix Card App, you ("user" or "you") agree to be bound by these terms. If you do not agree with any part of these terms, you must not use the Website or App.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Age Restrictions:</strong> You must be at least 13 years old to use the App, or meet the minimum age requirement for digital consent in your country of residence, whichever is greater.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration and Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>User Responsibilities:</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use or security breach.</li>
              <li><strong>Account Activities:</strong> You agree not to share your account credentials with others or use another user's account without permission.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">4. Description of Service</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Features:</strong> The App enables users to create, customize, and share digital business cards. Additional features may include analytics, contact management, and integrations with other services.</li>
              <li><strong>Modifications:</strong> We reserve the right to modify, suspend, or discontinue any aspect of the App at any time without notice.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">5. User Conduct</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Prohibited Activities:</strong> You agree not to misuse the App, including but not limited to: spamming, hacking, uploading harmful or illegal content, or violating any local, state, national, or international laws.</li>
              <li><strong>Content Guidelines:</strong> You may not upload or share content that is defamatory, obscene, threatening, or infringes on the intellectual property rights of others.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property Rights</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>App Content:</strong> We retain all rights, title, and interest in the App, including its design, functionality, and underlying technology. Users may not copy, modify, or distribute any part of the App without our permission.</li>
              <li><strong>User Content:</strong> By uploading or sharing content through the App, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content as necessary to operate the App.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">7. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Fees:</strong> Certain features of the App may require payment. You agree to pay all fees associated with your use of the App, including subscription fees, as outlined at the time of purchase.</li>
              <li><strong>Refund Policy:</strong> We do not offer refunds on subscription payments. You can cancel your subscription at any time to prevent future charges. All sales are final.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>User Termination:</strong> You may delete your account at any time through the App settings. Upon deletion, we will no longer provide you access to the App.</li>
              <li><strong>Provider Termination:</strong> We reserve the right to suspend or terminate your account at any time for violations of these terms, fraudulent activities, or any other reason at our discretion.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers and Limitation of Liability</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>"As-Is" Basis:</strong> The App is provided "as-is" and "as available" without any warranties, express or implied, including, but not limited to, warranties of merchantability or fitness for a particular purpose.</li>
              <li><strong>Liability Limits:</strong> To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising out of your use of the App.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>User Agreement:</strong> You agree to indemnify and hold Rx Radio, LLC, its affiliates, officers, and employees harmless from any claims, damages, or expenses arising from your use of the App or violation of these terms.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">11. Governing Law and Dispute Resolution</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Applicable Law:</strong> These terms shall be governed by and construed in accordance with the laws of Florida.</li>
              <li><strong>Dispute Resolution:</strong> Any disputes arising out of or related to these terms will be resolved through binding arbitration in Florida, except where prohibited by law.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to the Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Modification Rights:</strong> We may update these terms from time to time. If changes are made, we will notify you through the App or via email.</li>
              <li><strong>Continued Use:</strong> Your continued use of the App after changes are posted signifies your acceptance of the updated terms.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Support:</strong> For any questions or concerns regarding these terms, please contact us at <a href="mailto:hello@helixcard.app" className="text-blue-600 hover:underline">hello@helixcard.app</a>.</li>
            </ul>
          </div>
        </section>

        {/* Bottom Home Button */}
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

export default TermsOfServicePage;
