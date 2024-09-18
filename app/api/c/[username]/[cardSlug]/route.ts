import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import admin from 'firebase-admin';
import { BusinessCard } from '@/app/types';

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

    let cardData: BusinessCard | null = null;
    let primaryCardPlaceholder = false;

    if (cardSlug) {
      // Fetch specific business card
      const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(cardSlug);
      const cardDoc = await cardRef.get();

      if (!cardDoc.exists) {
        return NextResponse.json({ error: 'Business card not found' }, { status: 404 });
      }

      cardData = { id: cardDoc.id, ...cardDoc.data() } as BusinessCard;
    } else {
      // Fetch primary business card
      if (!userData.primaryCardId) {
        primaryCardPlaceholder = userData.primaryCardPlaceholder || false;
        if (primaryCardPlaceholder) {
          return NextResponse.json({ primaryCardPlaceholder: true, card: null });
        }
        return NextResponse.json({ error: 'Primary business card not set' }, { status: 404 });
      }
      const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(userData.primaryCardId);
      const cardDoc = await cardRef.get();

      if (!cardDoc.exists) {
        return NextResponse.json({ error: 'Primary business card not found' }, { status: 404 });
      }

      cardData = { id: cardDoc.id, ...cardDoc.data() } as BusinessCard;
    }

    return NextResponse.json({ card: cardData, primaryCardPlaceholder });
  } catch (error) {
    console.error('Error fetching business card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  try {
    const body = await request.json();
    const { cardData } = body;

    // Find user by username
    const userQuery = db.collection('users').where('username', '==', username);
    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    // Generate a new card slug
    const cardSlug = generateCardSlug();

    // Check if primaryCardPlaceholder is true
    const isPrimary = userData.primaryCardPlaceholder || false;

    // Create a new business card document
    const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(cardSlug);
    
    const batch = db.batch();

    batch.set(cardRef, {
      ...cardData,
      cardSlug,
      isPrimary,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (isPrimary) {
      // Update user document
      batch.update(db.collection('users').doc(userId), {
        primaryCardId: cardSlug,
        primaryCardPlaceholder: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    const cardUrl = `https://www.helixcard.app/c/${username}/${cardSlug}`;

    return NextResponse.json({ cardSlug, cardUrl, isPrimary }, { status: 201 });
  } catch (error) {
    console.error('Error creating business card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateCardSlug(): string {
  return Math.random().toString(36).substring(2, 5);
}
