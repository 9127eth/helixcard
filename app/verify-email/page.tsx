'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { applyActionCode } from 'firebase/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Layout from '../components/Layout';
import { auth } from '../lib/firebase';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const hasAppliedCode = useRef(false);
  const isEmailChange = searchParams.get('mode') === 'verifyAndChangeEmail';

  useEffect(() => {
    const code = searchParams.get('oobCode');

    if (hasAppliedCode.current) return;
    hasAppliedCode.current = true;

    const firebaseAuth = auth;
    if (!firebaseAuth || !code) {
      setStatus('error');
      return;
    }

    const applyCode = async () => {
      try {
        await applyActionCode(firebaseAuth, code);

        if (firebaseAuth.currentUser) {
          await firebaseAuth.currentUser.reload();
          const idToken = await firebaseAuth.currentUser.getIdToken(true);
          const response = await fetch('/api/auth/email', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'sync' }),
          });

          if (!response.ok) {
            console.error('Email changed, but account metadata could not be synchronized');
          }
        }

        setStatus('success');
      } catch (error) {
        console.error('Email verification failed:', error);
        setStatus('error');
      }
    };

    void applyCode();
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto text-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2c2d31] p-8 shadow-sm">
      {status === 'loading' && (
        <>
          <h1 className="text-2xl font-bold mb-3">Confirming your email…</h1>
          <p className="text-gray-600 dark:text-gray-300">This should only take a moment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <h1 className="text-2xl font-bold mb-3">
            {isEmailChange ? 'Your email has been updated' : 'Your email is verified'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {isEmailChange
              ? 'Your new email address is now connected to your HelixCard account.'
              : 'Thanks for confirming your address. Your HelixCard account is all set.'}
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-full bg-[#7CCEDA] px-5 py-3 font-semibold text-gray-900 hover:bg-[#6bb9c7]"
          >
            Go to dashboard
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold mb-3">This link is no longer valid</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The link may have expired or already been used. Sign in and request a fresh email from Settings.
          </p>
          <Link href="/" className="text-indigo-600 hover:underline dark:text-indigo-400">
            Return to HelixCard
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Layout title="Verify Email - HelixCard">
      <Suspense fallback={<div className="text-center">Confirming your email…</div>}>
        <VerifyEmailContent />
      </Suspense>
    </Layout>
  );
}
