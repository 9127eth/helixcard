import { NextResponse } from 'next/server';
import { auth } from '../../lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userRecord = await auth.getUser(uid);
    if (userRecord.customClaims?.isPro) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 402 });
    }
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}