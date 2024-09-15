import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string; cardSlug?: string } }
) {
  const { username, cardSlug } = params;

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

    let cardData;

    if (cardSlug) {
      // Fetch specific business card
      const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(cardSlug);
      const cardDoc = await cardRef.get();

      if (!cardDoc.exists) {
        return NextResponse.json({ error: 'Business card not found' }, { status: 404 });
      }

      cardData = cardDoc.data();
    } else {
      // Fetch primary business card
      if (!userData.primaryCardId) {
        return NextResponse.json({ error: 'Primary business card not set' }, { status: 404 });
      }
      const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(userData.primaryCardId);
      const cardDoc = await cardRef.get();

      if (!cardDoc.exists) {
        return NextResponse.json({ error: 'Primary business card not found' }, { status: 404 });
      }

      cardData = cardDoc.data();
    }

    return NextResponse.json({ card: cardData });
  } catch (error) {
    console.error('Error fetching business card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
