import { NextRequest, NextResponse } from 'next/server';
import { lookupPrimaryCard } from '@/app/lib/publicCardLookup';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const result = await lookupPrimaryCard(username);

    if (!result.found) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      user: result.user,
      card: result.card,
    }, { headers: { 'Cache-Control': 'no-store' }, status: 200 });
  } catch (error) {
    console.error('Error fetching primary business card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
