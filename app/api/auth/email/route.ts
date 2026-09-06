import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';
import {
  emailChangeEmail,
  passwordResetEmail,
  verificationEmail,
  welcomeEmail,
} from '@/app/lib/authEmailTemplates';
import { sendEmail } from '@/app/lib/resend';

export const runtime = 'nodejs';

type EmailRequest =
  | { type: 'welcome' }
  | { type: 'verification' }
  | { type: 'passwordReset'; email?: string }
  | { type: 'emailChange'; newEmail?: string };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 8;
const requestsByIp = new Map<string, number[]>();

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) || []).filter(timestamp => now - timestamp < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    requestsByIp.set(ip, recent);
    return true;
  }

  recent.push(now);
  requestsByIp.set(ip, recent);

  if (requestsByIp.size > 10_000) {
    for (const [key, timestamps] of requestsByIp) {
      if (timestamps.every(timestamp => now - timestamp >= WINDOW_MS)) {
        requestsByIp.delete(key);
      }
    }
  }

  return false;
}

function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.helixcard.app';
  return configuredUrl.replace(/\/$/, '');
}

function customActionUrl(generatedLink: string, pathname: string): string {
  const generatedUrl = new URL(generatedLink);
  let params = generatedUrl.searchParams;

  const nestedLink = generatedUrl.searchParams.get('link');
  if (!params.get('oobCode') && nestedLink) {
    params = new URL(nestedLink).searchParams;
  }

  const destination = new URL(pathname, `${getAppUrl()}/`);
  for (const key of ['mode', 'oobCode', 'apiKey', 'lang']) {
    const value = params.get(key);
    if (value) destination.searchParams.set(key, value);
  }

  if (!destination.searchParams.get('oobCode')) {
    throw new Error('Firebase generated an email action link without an action code');
  }

  return destination.toString();
}

function actionCodeSettings() {
  return {
    url: `${getAppUrl()}/dashboard`,
    handleCodeInApp: false,
  };
}

async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const decodedToken = await auth.verifyIdToken(authorization.slice(7));
    const user = await auth.getUser(decodedToken.uid);
    return { decodedToken, user };
  } catch {
    return null;
  }
}

async function sendWelcome(request: Request) {
  const authenticated = await getAuthenticatedUser(request);
  const user = authenticated?.user;
  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const usesPassword = user.providerData.some(provider => provider.providerId === 'password');
  let verificationUrl: string | undefined;

  if (usesPassword && !user.emailVerified) {
    const link = await auth.generateEmailVerificationLink(user.email, actionCodeSettings());
    verificationUrl = customActionUrl(link, '/verify-email');
  }

  const email = welcomeEmail({
    displayName: user.displayName || undefined,
    dashboardUrl: `${getAppUrl()}/dashboard`,
    verificationUrl,
  });

  await sendEmail({ to: user.email, ...email });
  return NextResponse.json({ success: true });
}

async function sendVerification(request: Request) {
  const authenticated = await getAuthenticatedUser(request);
  const user = authenticated?.user;
  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  const link = await auth.generateEmailVerificationLink(user.email, actionCodeSettings());
  const email = verificationEmail(customActionUrl(link, '/verify-email'));
  await sendEmail({ to: user.email, ...email });

  return NextResponse.json({ success: true });
}

async function sendPasswordReset(emailAddress: string) {
  const startedAt = Date.now();

  // Keep the response identical whether an account exists or not.
  try {
    const user = await auth.getUserByEmail(emailAddress);
    const usesPassword = user.providerData.some(provider => provider.providerId === 'password');

    if (usesPassword) {
      const link = await auth.generatePasswordResetLink(emailAddress, actionCodeSettings());
      const email = passwordResetEmail(customActionUrl(link, '/reset-password'));
      await sendEmail({ to: emailAddress, ...email });
    }
  } catch (error) {
    const errorCode = typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';

    if (errorCode !== 'auth/user-not-found') {
      console.error('Unable to send password reset email:', error);
    }
  }

  // Avoid making account existence obvious from a fast user lookup versus a slower send.
  const minimumResponseTime = 800;
  const remainingDelay = minimumResponseTime - (Date.now() - startedAt);
  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }

  return NextResponse.json({ success: true });
}

async function sendEmailChange(request: Request, newEmail: string) {
  const authenticated = await getAuthenticatedUser(request);
  if (!authenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { decodedToken, user } = authenticated;
  const secondsSinceAuthentication = Math.floor(Date.now() / 1000) - decodedToken.auth_time;
  if (secondsSinceAuthentication > 5 * 60) {
    return NextResponse.json(
      { error: 'Please sign in again before changing your email address' },
      { status: 401 }
    );
  }

  if (user.email?.toLowerCase() === newEmail) {
    return NextResponse.json(
      { error: 'That is already your account email address' },
      { status: 400 }
    );
  }

  const link = await auth.generateVerifyAndChangeEmailLink(
    user.uid,
    newEmail,
    actionCodeSettings()
  );
  const email = emailChangeEmail(customActionUrl(link, '/verify-email'));
  await sendEmail({ to: newEmail, ...email });

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service is not configured' }, { status: 503 });
  }

  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json(
      { error: 'Too many email requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json() as EmailRequest;

    switch (body.type) {
      case 'welcome':
        return await sendWelcome(request);
      case 'verification':
        return await sendVerification(request);
      case 'passwordReset': {
        const email = body.email?.trim().toLowerCase() || '';
        if (!isValidEmail(email)) {
          return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
        }
        return await sendPasswordReset(email);
      }
      case 'emailChange': {
        const email = body.newEmail?.trim().toLowerCase() || '';
        if (!isValidEmail(email)) {
          return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
        }
        return await sendEmailChange(request, email);
      }
      default:
        return NextResponse.json({ error: 'Invalid email request' }, { status: 400 });
    }
  } catch (error) {
    console.error('Authentication email error:', error);
    return NextResponse.json({ error: 'Unable to send email' }, { status: 500 });
  }
}
