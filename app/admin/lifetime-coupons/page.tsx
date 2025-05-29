'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

interface LifetimeCouponStats {
  couponCode: string;
  totalUses: number;
  createdAt: Date;
  lastUsedAt: Date;
}

interface LifetimeCouponUsage {
  uid: string;
  email: string;
  name: string;
  claimedAt: Date;
  couponCode: string;
  priceId: string;
  subscriptionType: string;
}

interface CouponDetail {
  stats: LifetimeCouponStats;
  users: LifetimeCouponUsage[];
  totalUsers: number;
}

const LifetimeCouponsAdmin: React.FC = () => {
  const [coupons, setCoupons] = useState<LifetimeCouponStats[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string | null>(null);
  const [couponDetail, setCouponDetail] = useState<CouponDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchCoupons = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const idToken = await user.getIdToken();
      
      console.log('Making request to admin API with user:', user.email);
      
      const response = await fetch('/api/admin/lifetime-coupons', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`Failed to fetch coupon data (${response.status}): ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('Admin page useEffect - user:', user?.email, 'authLoading:', authLoading);
    
    // Don't redirect if we're still loading auth state
    if (authLoading) {
      console.log('Still loading auth state, waiting...');
      return;
    }
    
    // Only redirect if auth is done loading and there's no user
    if (!authLoading && !user) {
      console.log('No user found after auth loading completed, redirecting to register');
      router.push('/register');
      return;
    }
    
    // If we have a user, fetch coupons
    if (user) {
      console.log('User authenticated, fetching coupons for:', user.email);
      fetchCoupons();
    }
  }, [user, authLoading, router, fetchCoupons]);

  const fetchCouponDetail = async (couponCode: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/admin/lifetime-coupons?coupon=${couponCode}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch coupon details');
      }

      const data = await response.json();
      setCouponDetail(data);
      setSelectedCoupon(couponCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupon details');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (loading && coupons.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">
            Error: {error}
            <button 
              onClick={() => window.location.reload()} 
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Lifetime Coupon Administration
        </h1>

        {!selectedCoupon ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                All Lifetime Coupons
              </h2>
              
              {coupons.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No lifetime coupons found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Coupon Code
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Total Uses
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Last Used
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <tr 
                          key={coupon.couponCode} 
                          className="border-b border-gray-100 dark:border-gray-700"
                        >
                          <td className="py-3 px-4 text-gray-900 dark:text-white font-mono">
                            {coupon.couponCode}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                            {coupon.totalUses}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                            {new Date(coupon.lastUsedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => fetchCouponDetail(coupon.couponCode)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Coupon Details: {selectedCoupon}
              </h2>
              <button
                onClick={() => {
                  setSelectedCoupon(null);
                  setCouponDetail(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Back to All Coupons
              </button>
            </div>

            {couponDetail && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                    Usage Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Uses</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {couponDetail.stats.totalUses}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">First Used</p>
                      <p className="text-lg text-gray-900 dark:text-white">
                        {new Date(couponDetail.stats.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Used</p>
                      <p className="text-lg text-gray-900 dark:text-white">
                        {new Date(couponDetail.stats.lastUsedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                      Users Who Redeemed This Coupon
                    </h3>
                    
                    {couponDetail.users.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No users have redeemed this coupon yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                                Email
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                                Name
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                                Claimed Date
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                                User ID
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {couponDetail.users.map((user) => (
                              <tr 
                                key={user.uid} 
                                className="border-b border-gray-100 dark:border-gray-700"
                              >
                                <td className="py-3 px-4 text-gray-900 dark:text-white">
                                  {user.email}
                                </td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                  {user.name || 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                  {new Date(user.claimedAt).toLocaleDateString()} at{' '}
                                  {new Date(user.claimedAt).toLocaleTimeString()}
                                </td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-mono text-sm">
                                  {user.uid.substring(0, 8)}...
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LifetimeCouponsAdmin; 