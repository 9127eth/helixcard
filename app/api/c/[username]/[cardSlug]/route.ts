import { NextRequest, NextResponse } from 'next/server';
import { lookupCardBySlug } from '@/app/lib/publicCardLookup';

const NOT_FOUND_BODY = {
  error: 'Business card not found',
  user: { primaryCardId: null, primaryCardPlaceholder: false },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; cardSlug: string }> }
) {
  const { username, cardSlug } = await params;

  try {
    const result = await lookupCardBySlug(username, cardSlug);

    if (!result.found) {
      return NextResponse.json({ ...NOT_FOUND_BODY, error: result.error }, { status: 404 });
    }

    return NextResponse.json(
      { card: result.card },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching business card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
