'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardPage from '../../dashboard/page';
import LoadingSpinner from '../LoadingSpinner';
import { captureSource } from '../../utils/sourceTracking';
import MarketingHome from './MarketingHome';
import type { BusinessCard } from '../../types';

/** Signed-in visitors get their dashboard at `/`; everyone else gets the marketing page. */
export default function HomeClient({ demoCard }: { demoCard: BusinessCard }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Capture source parameter for affiliate tracking
    captureSource();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <DashboardPage />;
  }

  return <MarketingHome demoCard={demoCard} />;
}
