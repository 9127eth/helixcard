import { NextResponse } from 'next/server';
import { auth } from '../../../lib/firebase-admin';
import { getAllLifetimeCoupons, getCouponStats, getCouponUsers } from '../../../utils/lifetimeCoupons';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idToken = req.headers.get('authorization')?.replace('Bearer ', '');
    const couponCode = searchParams.get('coupon');

    console.log('Admin route accessed, idToken present:', !!idToken);

    if (!idToken) {
      console.log('No authorization token provided');
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('Token decoded successfully, email:', decodedToken.email);
    
    // TODO: Add admin role check here when you implement admin roles
    // For now, you might want to check against specific email addresses
    const adminEmails = [
      'richard.waithe@medvize.com', // Replace with your admin email
      // Add other admin emails as needed
    ];
    
    console.log('Checking email against admin list:', decodedToken.email, 'Admin emails:', adminEmails);
    
    if (!adminEmails.includes(decodedToken.email || '')) {
      console.log('Email not in admin list - Access denied');
      return NextResponse.json({ 
        error: 'Unauthorized: Admin access required',
        userEmail: decodedToken.email,
        adminEmails: adminEmails
      }, { status: 403 });
    }

    console.log('Admin access granted for:', decodedToken.email);

    // If a specific coupon is requested, return detailed info
    if (couponCode) {
      const [stats, users] = await Promise.all([
        getCouponStats(couponCode),
        getCouponUsers(couponCode)
      ]);

      if (!stats) {
        return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      }

      return NextResponse.json({
        stats,
        users,
        totalUsers: users.length
      });
    }

    // Otherwise, return all lifetime coupons summary
    const allCoupons = await getAllLifetimeCoupons();

    return NextResponse.json({
      coupons: allCoupons,
      totalCoupons: allCoupons.length,
      totalRedemptions: allCoupons.reduce((sum, coupon) => sum + coupon.totalUses, 0)
    });

  } catch (error) {
    console.error('Error fetching lifetime coupon data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch coupon data', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 