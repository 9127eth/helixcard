import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { BusinessCard } from '@/app/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    // Find user by username
    const userQuery = db.collection('users').where('username', '==', username);
    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    if (!userData.primaryCardId) {
      return NextResponse.json({ error: 'Primary card not found' }, { status: 404 });
    }

    // Fetch primary business card
    const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(userData.primaryCardId);
    const cardDoc = await cardRef.get();

    if (!cardDoc.exists) {
      return NextResponse.json({ error: 'Primary card not found' }, { status: 404 });
    }

    const cardData = { id: cardDoc.id, ...cardDoc.data() } as BusinessCard;

    return NextResponse.json({
      user: {
        isPro: userData.isPro || false,  // Add this line to include isPro status
        primaryCardId: userData.primaryCardId,
        primaryCardPlaceholder: userData.primaryCardPlaceholder || false,
      },
      card: {
        ...cardData,
        id: cardDoc.id,
      },
    }, { headers: { 'Cache-Control': 'no-store' }, status: 200 });
  } catch (error) {
    console.error('Error fetching primary business card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
