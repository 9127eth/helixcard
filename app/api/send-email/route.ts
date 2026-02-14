import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { auth } from '@/app/lib/firebase-admin';
import { timingSafeEqual } from 'crypto';

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

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { error: 'Email service not configured properly' },
        { status: 500, headers: corsHeaders }
      );
    }

    const { type, ...emailData } = await request.json();

    // --- Determine authentication status ---
    const authHeader = request.headers.get('Authorization');
    let isAuthenticated = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];

      // iOS API key (timing-safe comparison)
      if (process.env.IOS_API_KEY && safeCompare(token, process.env.IOS_API_KEY)) {
        isAuthenticated = true;
      } else {
        // Firebase ID token
        try {
          await auth.verifyIdToken(token);
          isAuthenticated = true;
        } catch {
          // Token is invalid
        }
      }
    }

    // --- Rate limiting (stricter for unauthenticated callers) ---
    const clientIp = getClientIp(request);
    const maxRequests = isAuthenticated ? RATE_LIMIT_MAX_AUTHED : RATE_LIMIT_MAX_UNAUTHED;

    if (isRateLimited(clientIp, maxRequests)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: corsHeaders }
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
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    let mailOptions;

    switch (type) {
      case 'businessCard':
        const { email, cardUrl, cardOwner, ownerEmail, note } = emailData;
        
        // Sanitize all user-provided values
        const safeCardOwner = escapeHtml(cardOwner || '');
        const safeNote = escapeHtml(note || '');
        const safeCardUrl = sanitizeUrl(cardUrl || '');
        
        mailOptions = {
          from: {
            name: 'HelixCard',
            address: process.env.GMAIL_USER
          },
          ...(ownerEmail && { replyTo: ownerEmail }),
          to: email,
          subject: `Here is ${safeCardOwner}'s business card`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #111827;">Here is ${safeCardOwner}'s business card</h1>
              ${safeNote ? `
                <p style="font-size: 16px; color: #374151; margin-bottom: 8px;"><strong>Note:</strong></p>
                <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">${safeNote}</p>
              ` : ''}
              <a href="${safeCardUrl}" style="display: inline-block; background-color: #18181B; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 24px; font-weight: 500; margin: 16px 0;">View Business Card</a>
              ${ownerEmail 
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
          `
        };
        break;

      case 'csvExport':
        const { email: recipientEmail, csvData, fileName } = emailData;
        mailOptions = {
          from: {
            name: 'HelixCard',
            address: process.env.GMAIL_USER
          },
          to: recipientEmail,
          subject: 'Your Helix Contacts Export',
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #111827;">Your Data Export</h1>
              <p style="font-size: 16px; color: #374151; margin-bottom: 24px;"> Your requested contacts export from Helix is attached to this email as a CSV file.</p>
            </div>
          `,
          attachments: [
            {
              filename: fileName || 'helix-card-export.csv',
              content: csvData,
              contentType: 'text/csv'
            }
          ]
        };
        break;

      default:
        throw new Error('Invalid email type');
    }

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500, headers: corsHeaders }
    );
  }
}
