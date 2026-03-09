import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

// ---------------------------------------------------------------------------
// Rate limiting — in-memory sliding window (matches send-email pattern)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60 * 1_000; // 1 minute
const RATE_LIMIT_MAX = 20;               // requests per IP per window
const rateLimitMap = new Map<string, number[]>();

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  if (rateLimitMap.size > 10_000) {
    for (const [key, ts] of rateLimitMap) {
      if (ts.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) rateLimitMap.delete(key);
    }
  }

  const timestamps = (rateLimitMap.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
function buildPrompt(text: string): string {
  return `You are an AI designed to extract and organize information from text. The text will be either a business card or a tradeshow badge. Extract key details from this business card text and present them in a structured format. Also some general rules:
 - do not include prefixes like "Mr.", "Ms.", "Dr.", etc. Names should just start with the first name. You can include suffixes like "Jr.", "Sr.", "III", pharmd, md, bsn, rn, md, etc.
 - if multiple phone numbers are found, prioritize cell/mobile numbers. Then office numbers if no cell. Definitely dont want fax numbers. But only extract one phone number.
 - if a website is not present, but an email address is, we can assume the domain from the email address is the website.
 - do not include registered trademark symbols.
 - phone numbers should be in the format of (123) 456-7890
 - Ensure that all caps text is converted to proper upper and lower case formatting for a clean appearance, while preserving accurate capitalization for company names and personal names. However, do not alter someone's credentials e.g. PharmD, MD, BSN, RN, CPhT, etc.

${text}

Return only a JSON object with these fields:
{
  "name": "Full Name",
  "position": "Job Title",
  "company": "Company Name",
  "phone": "Phone Number",
  "email": "Email Address",
  "address": "Full Address",
  "website": "Website URL"
}`;
}

// ---------------------------------------------------------------------------
// Provider calls
// ---------------------------------------------------------------------------
async function callOpenAI(text: string): Promise<Record<string, string>> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You are a precise business card information extractor.' },
        { role: 'user', content: buildPrompt(text) },
      ],
    }),
  });

  if (response.status === 429) {
    throw Object.assign(new Error('OpenAI rate limit'), { isRateLimit: true });
  }
  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
}

async function callClaude(text: string): Promise<Record<string, string>> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: buildPrompt(text) },
      ],
    }),
  });

  if (response.status === 429) {
    throw Object.assign(new Error('Claude rate limit'), { isRateLimit: true });
  }
  if (!response.ok) {
    throw new Error(`Claude error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? '{}';
  return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
}

// ---------------------------------------------------------------------------
// Normalise the parsed contact so all seven keys are always present
// ---------------------------------------------------------------------------
function normaliseContact(raw: Record<string, string>) {
  const keys = ['name', 'position', 'company', 'phone', 'email', 'address', 'website'] as const;
  return Object.fromEntries(keys.map(k => [k, raw[k] ?? '']));
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  // --- Authentication ---
  const apiKey = request.headers.get('x-api-key');
  // Support both INTERNAL_API_KEY (spec name) and IOS_API_KEY (legacy name)
  const expectedKey = process.env.INTERNAL_API_KEY || process.env.IOS_API_KEY;

  if (!apiKey || !expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let keyMatch = false;
  try {
    keyMatch = timingSafeEqual(Buffer.from(apiKey), Buffer.from(expectedKey));
  } catch {
    // timingSafeEqual throws if buffers differ in length — treat as mismatch
  }

  if (!keyMatch) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Rate limiting ---
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // --- Validate body ---
  let body: { text?: unknown; provider?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, provider } = body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return NextResponse.json({ error: '`text` is required and must be a non-empty string' }, { status: 400 });
  }

  if (provider !== 'openai' && provider !== 'claude') {
    return NextResponse.json({ error: '`provider` must be "openai" or "claude"' }, { status: 400 });
  }

  // --- Call provider ---
  try {
    const raw = provider === 'openai'
      ? await callOpenAI(text.trim())
      : await callClaude(text.trim());

    return NextResponse.json(normaliseContact(raw));
  } catch (error: unknown) {
    const isRateLimit = typeof error === 'object' && error !== null && 'isRateLimit' in error && (error as { isRateLimit: boolean }).isRateLimit;

    if (isRateLimit) {
      return NextResponse.json({ error: 'Upstream rate limit reached. Please try again shortly.' }, { status: 429 });
    }

    console.error('[scan-card] upstream error:', error);
    return NextResponse.json(
      { error: 'Failed to process business card. Please try again.' },
      { status: 500 },
    );
  }
}
