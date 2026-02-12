import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { auth } from '@/app/lib/firebase-admin';

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

    // Authentication: required for sensitive operations (csvExport),
    // but not for public card sharing (businessCard).
    const REQUIRES_AUTH = ['csvExport'];

    if (REQUIRES_AUTH.includes(type)) {
      const authHeader = request.headers.get('Authorization');
      let isAuthenticated = false;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        
        // Try iOS API key first
        if (token === process.env.IOS_API_KEY) {
          isAuthenticated = true;
        } else {
          // Try Firebase ID token
          try {
            await auth.verifyIdToken(token);
            isAuthenticated = true;
          } catch {
            // Token is invalid
          }
        }
      }

      if (!isAuthenticated) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401, headers: corsHeaders }
        );
      }
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
