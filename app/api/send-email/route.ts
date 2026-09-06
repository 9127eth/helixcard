import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';
import { timingSafeEqual } from 'crypto';
import { consumeQuota } from '@/app/lib/usageQuota';
import { sendEmail, textAttachment } from '@/app/lib/resend';
import { sanitizeEmailAddress } from '@/app/lib/urlSafety';

// Restrict CORS to your own domains (+ localhost for development)
const ALLOWED_ORIGINS = [
  'https://www.helixcard.app',
  'https://helixcard.app',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// --- Rate limiting (per-instance, in-memory sliding window) ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1-minute window
const RATE_LIMIT_MAX_UNAUTHED = 5;       // unauthenticated sends per IP per window
const RATE_LIMIT_MAX_AUTHED = 20;        // authenticated sends per IP per window
const rateLimitMap = new Map<string, number[]>();

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Returns true if the caller should be blocked.
 * Also garbage-collects stale entries on every call.
 */
function isRateLimited(ip: string, maxRequests: number): boolean {
  const now = Date.now();

  // Inline cleanup: remove stale IPs (keeps the Map from growing unbounded)
  if (rateLimitMap.size > 10_000) {
    for (const [key, ts] of rateLimitMap) {
      if (ts.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) rateLimitMap.delete(key);
    }
  }

  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= maxRequests) {
    rateLimitMap.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

// Simple HTML entity escaping to prevent injection
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate that a URL is safe (starts with https)
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return '#';
  } catch {
    return '#';
  }
}

/** Timing-safe comparison for static API keys */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function safeCsvFileName(value: unknown): string {
  if (typeof value !== 'string') return 'helix-card-export.csv';

  const base = value.split(/[/\\]/).pop()?.trim() || '';
  const cleaned = base.replace(/[^\w.\- ]/g, '');
  if (cleaned.length > 0 && cleaned.length <= 120 && /\.csv$/i.test(cleaned)) {
    return cleaned;
  }

  return 'helix-card-export.csv';
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured properly' },
        { status: 503, headers: corsHeaders }
      );
    }

    const { type, ...emailData } = await request.json();

    // --- Determine authentication status ---
    const authHeader = request.headers.get('Authorization');
    let isAuthenticated = false;
    let callerUid: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];

      // iOS API key (timing-safe comparison)
      if (process.env.IOS_API_KEY && safeCompare(token, process.env.IOS_API_KEY)) {
        isAuthenticated = true;
        callerUid = 'ios-api-key';
      } else {
        // Firebase ID token
        try {
          const decoded = await auth.verifyIdToken(token);
          isAuthenticated = true;
          callerUid = decoded.uid;
        } catch {
          // Token is invalid
        }
      }
    }

    // --- Rate limiting (stricter for unauthenticated callers) ---
    // The in-memory window below only bounds a burst against one serverless
    // instance; the Firestore-backed quota after it is shared across every
    // instance, which is what actually caps abuse.
    const clientIp = getClientIp(request);
    const maxRequests = isAuthenticated ? RATE_LIMIT_MAX_AUTHED : RATE_LIMIT_MAX_UNAUTHED;

    if (isRateLimited(clientIp, maxRequests)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Deliberately generous — an abuse ceiling, not a product limit. Sharing a
    // card with everyone you meet at a conference will not come close.
    const HOUR = 60 * 60 * 1000;
    const quota = await consumeQuota([
      { key: `email:ip:${clientIp}`, limit: isAuthenticated ? 120 : 40, windowMs: HOUR },
      { key: `email:ip:day:${clientIp}`, limit: isAuthenticated ? 600 : 150, windowMs: 24 * HOUR },
      ...(callerUid
        ? [
            { key: `email:user:${callerUid}`, limit: 150, windowMs: HOUR },
            { key: `email:user:day:${callerUid}`, limit: 750, windowMs: 24 * HOUR },
          ]
        : []),
    ]);

    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { ...corsHeaders, 'Retry-After': String(quota.retryAfterSeconds) },
        }
      );
    }

    // Authentication: required for sensitive operations (csvExport),
    // but not for public card sharing (businessCard).
    const REQUIRES_AUTH = ['csvExport'];

    if (REQUIRES_AUTH.includes(type) && !isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    switch (type) {
      case 'businessCard': {
        const { email, cardUrl, cardOwner, ownerEmail, note } = emailData;
        const recipient = sanitizeEmailAddress(email);
        if (!recipient) {
          return NextResponse.json(
            { error: 'Enter a valid email address' },
            { status: 400, headers: corsHeaders }
          );
        }

        const cardOwnerName = typeof cardOwner === 'string' ? cardOwner.trim().slice(0, 120) : '';
        const safeCardOwner = escapeHtml(cardOwnerName);
        const safeNote = escapeHtml(typeof note === 'string' ? note : '');
        const safeCardUrl = sanitizeUrl(typeof cardUrl === 'string' ? cardUrl : '');
        const replyTo = sanitizeEmailAddress(ownerEmail);

        await sendEmail({
          to: recipient,
          subject: `Here is ${cardOwnerName || 'a'}'s business card`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #111827;">Here is ${safeCardOwner}'s business card</h1>
              ${safeNote ? `
                <p style="font-size: 16px; color: #374151; margin-bottom: 8px;"><strong>Note:</strong></p>
                <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">${safeNote}</p>
              ` : ''}
              <a href="${safeCardUrl}" style="display: inline-block; background-color: #18181B; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 24px; font-weight: 500; margin: 16px 0;">View Business Card</a>
              ${replyTo
                ? `<p style="font-size: 14px; color: #4B5563; margin-top: 24px;">You can reply directly to this email to contact ${safeCardOwner}.</p>`
                : ''
              }
              <p style="font-size: 14px; color: #4B5563; margin-top: 24px;">Hope you have a great day!</p>
              <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #4B5563; margin: 0;">Best regards,</p>
                <p style="font-size: 14px; font-weight: 500; color: #111827; margin: 4px 0;">HelixCard Team</p>
              </div>
              <p style="font-size: 13px; color: #6B7280; margin-top: 24px;">
                P.S. Want your own digital business card? Create one for free at <a href="https://www.helixcard.app" style="color: #2563EB; text-decoration: none;">www.helixcard.app</a>
              </p>
            </div>
          `,
          text: [
            `Here is ${cardOwnerName || 'a'}'s business card`,
            safeNote ? `Note: ${typeof note === 'string' ? note : ''}` : '',
            safeCardUrl !== '#' ? `View business card: ${safeCardUrl}` : '',
            replyTo ? `You can reply directly to this email to contact ${cardOwnerName}.` : '',
            'Hope you have a great day!',
            'Best regards,\nHelixCard Team',
            'P.S. Want your own digital business card? Create one for free at https://www.helixcard.app',
          ].filter(Boolean).join('\n\n'),
          ...(replyTo ? { replyTo } : {}),
        });
        break;
      }

      case 'csvExport': {
        const { email: recipientEmail, csvData, fileName } = emailData;
        const recipient = sanitizeEmailAddress(recipientEmail);
        if (!recipient) {
          return NextResponse.json(
            { error: 'Enter a valid email address' },
            { status: 400, headers: corsHeaders }
          );
        }
        if (typeof csvData !== 'string' || !csvData.trim()) {
          return NextResponse.json(
            { error: 'CSV data is required' },
            { status: 400, headers: corsHeaders }
          );
        }

        await sendEmail({
          to: recipient,
          subject: 'Your Helix Contacts Export',
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #111827;">Your Data Export</h1>
              <p style="font-size: 16px; color: #374151; margin-bottom: 24px;"> Your requested contacts export from Helix is attached to this email as a CSV file.</p>
            </div>
          `,
          text: 'Your requested contacts export from Helix is attached to this email as a CSV file.',
          attachments: [textAttachment(safeCsvFileName(fileName), csvData)],
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400, headers: corsHeaders }
        );
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500, headers: corsHeaders }
    );
  }
}
