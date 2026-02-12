import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '../../../lib/adminAuth';
import { getAllLifetimeCoupons, getCouponStats, getCouponUsers } from '../../../utils/lifetimeCoupons';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idToken = req.headers.get('authorization')?.replace('Bearer ', '');
    const couponCode = searchParams.get('coupon');

    if (!idToken) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    // Verify admin access using centralized check
    const decodedToken = await verifyAdminAccess(idToken);
    
    if (!decodedToken) {
      return NextResponse.json({ 
        error: 'Unauthorized: Admin access required'
      }, { status: 403 });
    }

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
      error: 'Failed to fetch coupon data'
    }, { status: 500 });
  }
} 
