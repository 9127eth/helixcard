'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardPage from '../../dashboard/page';
import LoadingSpinner from '../LoadingSpinner';
import { captureSource } from '../../utils/sourceTracking';
import MarketingHome from './MarketingHome';
import type { BusinessCard } from '../../types';
import styles from './home.module.css';

/** Present while this browser is signed in, so the next visit to `/` can wait for the dashboard. */
const SIGNED_IN_KEY = 'helix_signed_in';

/** Runs before the first paint of a server-rendered visit; see `.authWait` in home.module.css. */
const WAIT_IF_SIGNED_IN = `try{if(localStorage.getItem('${SIGNED_IN_KEY}'))document.documentElement.setAttribute('data-hx-auth','pending')}catch(e){}`;

function readSignedInHint() {
  try {
    return localStorage.getItem(SIGNED_IN_KEY) !== null;
  } catch {
    return false;
  }
}

const noSubscription = () => () => {};

/**
 * Signed-in visitors get their dashboard at `/`; everyone else gets the
 * marketing page. The server renders the marketing page, so search engines
 * and first-time visitors get it without waiting for Firebase to check
 * sign-in; browsers that were signed in last time wait behind a spinner.
 */
export default function HomeClient({ demoCard }: { demoCard: BusinessCard }) {
  const { user, loading } = useAuth();
  // False on the server and while hydrating, so both render the marketing page.
  const wasSignedIn = useSyncExternalStore(noSubscription, readSignedInHint, () => false);

  useEffect(() => {
    // Capture source parameter for affiliate tracking
    captureSource();
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      if (user) localStorage.setItem(SIGNED_IN_KEY, '1');
      else localStorage.removeItem(SIGNED_IN_KEY);
    } catch {
      // Without storage, a signed-in visit shows this page briefly before the dashboard.
    }
    document.documentElement.removeAttribute('data-hx-auth');
  }, [user, loading]);

  if (user) {
    return <DashboardPage />;
  }

  if (loading && wasSignedIn) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: WAIT_IF_SIGNED_IN }} />
      <div className={styles.authWait}>
        <LoadingSpinner />
      </div>
      <MarketingHome demoCard={demoCard} />
    </>
  );
}
