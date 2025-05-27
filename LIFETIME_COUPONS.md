# Lifetime Coupon Tracking System

This document describes the Firebase-based lifetime coupon tracking system implemented for Helix Pro subscriptions.

## Overview

The system tracks lifetime coupon usage entirely through Firebase, bypassing Stripe for free lifetime subscriptions while maintaining proper usage validation and analytics.

## Firebase Database Structure

### Collections

#### `lifetimesubs` Collection
- **Document ID**: Coupon code (e.g., "VMCRX")
- **Fields**:
  - `couponCode`: String - The coupon code
  - `totalUses`: Number - Total number of times this coupon has been redeemed
  - `createdAt`: Timestamp - When the first redemption occurred
  - `lastUsedAt`: Timestamp - When the coupon was last used

#### `lifetimesubs/{couponCode}/customers` Subcollection
- **Document ID**: Firebase User UID
- **Fields**:
  - `uid`: String - Firebase user ID
  - `email`: String - User's email address
  - `name`: String - User's display name
  - `claimedAt`: Timestamp - When the coupon was redeemed
  - `couponCode`: String - The coupon code used
  - `priceId`: String - Stripe price ID (for reference)
  - `subscriptionType`: String - "lifetime"

## API Endpoints

### `/api/create-subscription` (POST)
Handles free VMCRX lifetime subscription creation:
- Validates user doesn't already have a subscription
- Checks if coupon has been used by user ID or email
- Records redemption in Firebase
- Updates user's Pro status

### `/api/admin/lifetime-coupons` (GET)
Admin endpoint for viewing coupon usage:
- Without `?coupon=CODE`: Returns all lifetime coupons summary
- With `?coupon=CODE`: Returns detailed usage for specific coupon
- Requires admin authorization

## Utility Functions

Located in `app/utils/lifetimeCoupons.ts`:

- `hasUserUsedCoupon(couponCode, uid)`: Check if user ID has used coupon
- `hasEmailUsedCoupon(couponCode, email)`: Check if email has used coupon
- `recordCouponRedemption(...)`: Record a new coupon redemption
- `getCouponStats(couponCode)`: Get usage statistics for a coupon
- `getCouponUsers(couponCode)`: Get all users who used a coupon
- `getAllLifetimeCoupons()`: Get summary of all lifetime coupons

## Admin Interface

Located at `/admin/lifetime-coupons`:
- View all lifetime coupons and their usage counts
- Click on any coupon to see detailed usage information
- See list of all users who redeemed each coupon
- View timestamps and user details

## Key Features

### Duplicate Prevention
- Prevents same user ID from using a coupon twice
- Prevents same email address from using a coupon twice
- Validates existing Pro subscription status

### Usage Tracking
- Tracks total redemptions per coupon
- Records individual user redemptions with timestamps
- Maintains coupon-level statistics

### Admin Analytics
- Real-time usage statistics
- User detail tracking
- Export capabilities through API

## Configuration

### Admin Access
Update the admin email list in `/api/admin/lifetime-coupons/route.ts`:

```typescript
const adminEmails = [
  'admin@helixcard.app', // Replace with your admin email
  // Add other admin emails as needed
];
```

### Supported Coupons
Currently configured lifetime coupons in `COUPON_RESTRICTIONS`:
- `VMCRX`: Lifetime plan only
- `LIPSCOMB25`: Lifetime plan only  
- `UTTYLER25`: Lifetime plan only

## Implementation Benefits

1. **No Stripe Dependency**: Free lifetime subscriptions don't require Stripe processing
2. **Complete Tracking**: Full audit trail of all coupon usage
3. **Duplicate Prevention**: Robust validation against misuse
4. **Admin Visibility**: Real-time analytics and user tracking
5. **Scalable**: Firebase handles scaling automatically
6. **Cost Effective**: No transaction fees for free subscriptions

## Migration Notes

This system replaces the previous Stripe-based approach that was causing errors when trying to create subscriptions with one-time prices. The new system maintains all tracking capabilities while eliminating the technical constraints. 