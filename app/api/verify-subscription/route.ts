import { NextResponse } from 'next/server';
import { auth } from '../../lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (userData?.isPro) {
      return NextResponse.json({ 
        success: true,
        subscriptionType: userData.isProType || 'free'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        subscriptionType: 'free' 
      }, { status: 402 });
    }
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
