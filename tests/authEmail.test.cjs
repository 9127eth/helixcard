const { beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');

if (!require.extensions['.ts']) {
  require.extensions['.ts'] = (module, filename) => {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText, filename);
  };
}

const state = {
  decodedToken: { uid: 'user-123', auth_time: Math.floor(Date.now() / 1000) },
  user: {
    uid: 'user-123',
    email: 'current@example.com',
    emailVerified: true,
    providerData: [{ providerId: 'password' }],
  },
  generatedLinkArgs: null,
  generateError: null,
  sentEmails: [],
  userDocument: {},
  stripeUpdates: [],
};

const auth = {
  async verifyIdToken() {
    return state.decodedToken;
  },
  async getUser() {
    return state.user;
  },
  async generateVerifyAndChangeEmailLink(...args) {
    state.generatedLinkArgs = args;
    if (state.generateError) throw state.generateError;
    return 'https://project.firebaseapp.com/__/auth/action?mode=verifyAndChangeEmail&oobCode=change-code&apiKey=api-key';
  },
  async generateEmailVerificationLink() {
    return 'https://project.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=verify-code&apiKey=api-key';
  },
  async getUserByEmail() {
    return state.user;
  },
  async generatePasswordResetLink() {
    return 'https://project.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=reset-code&apiKey=api-key';
  },
};

const db = {
  collection(name) {
    assert.equal(name, 'users');
    return {
      doc(uid) {
        assert.equal(uid, state.user.uid);
        return {
          async get() {
            return { data: () => ({ ...state.userDocument }) };
          },
          async set(updates, options) {
            assert.deepEqual(options, { merge: true });
            state.userDocument = { ...state.userDocument, ...updates };
          },
        };
      },
    };
  },
};

class StripeMock {
  constructor(secret) {
    assert.equal(secret, 'stripe-secret');
    this.customers = {
      update: async (customerId, updates) => {
        state.stripeUpdates.push({ customerId, updates });
      },
    };
  }
}

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === 'next/server') {
    return { NextResponse: { json: (body, init) => Response.json(body, init) } };
  }
  if (request === 'stripe') return { __esModule: true, default: StripeMock };
  if (request === '@/app/lib/firebase-admin') return { auth, db };
  if (request === '@/app/lib/authEmailTemplates') {
    return {
      emailChangeEmail: url => ({ subject: 'change', html: url, text: url }),
      passwordResetEmail: url => ({ subject: 'reset', html: url, text: url }),
      verificationEmail: url => ({ subject: 'verify', html: url, text: url }),
      welcomeEmail: () => ({ subject: 'welcome', html: 'welcome', text: 'welcome' }),
    };
  }
  if (request === '@/app/lib/resend') {
    return { sendEmail: async options => state.sentEmails.push(options) };
  }
  if (request.startsWith('@/')) {
    return originalLoad(path.join(ROOT, request.slice(2)), parent, isMain);
  }
  return originalLoad(request, parent, isMain);
};

const { POST } = require(path.join(ROOT, 'app/api/auth/email/route.ts'));

function request(body, ip = `192.0.2.${Math.floor(Math.random() * 200) + 1}`) {
  return new Request('https://www.helixcard.app/api/auth/email', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer valid-token',
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.RESEND_API_KEY = 'resend-key';
  process.env.STRIPE_SECRET_KEY = 'stripe-secret';
  state.decodedToken = { uid: 'user-123', auth_time: Math.floor(Date.now() / 1000) };
  state.user = {
    uid: 'user-123',
    email: 'current@example.com',
    emailVerified: true,
    providerData: [{ providerId: 'password' }],
  };
  state.generatedLinkArgs = null;
  state.generateError = null;
  state.sentEmails = [];
  state.userDocument = {};
  state.stripeUpdates = [];
});

test('email change gives Firebase the current email, sends to the new email, and keeps the custom action URL', async () => {
  const response = await POST(request({ type: 'emailChange', newEmail: ' NEW@Example.com ' }, '192.0.2.1'));

  assert.equal(response.status, 200);
  assert.deepEqual(state.generatedLinkArgs.slice(0, 2), [
    'current@example.com',
    'new@example.com',
  ]);
  assert.equal(state.sentEmails.length, 1);
  assert.equal(state.sentEmails[0].to, 'new@example.com');
  const actionUrl = new URL(state.sentEmails[0].html);
  assert.equal(actionUrl.origin, 'https://www.helixcard.app');
  assert.equal(actionUrl.pathname, '/verify-email');
  assert.equal(actionUrl.searchParams.get('mode'), 'verifyAndChangeEmail');
  assert.equal(actionUrl.searchParams.get('oobCode'), 'change-code');
});

test('email change exposes the useful already-in-use conflict instead of a generic 500', async () => {
  state.generateError = Object.assign(new Error('already exists'), {
    code: 'auth/email-already-exists',
  });

  const response = await POST(request({ type: 'emailChange', newEmail: 'used@example.com' }, '192.0.2.2'));
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.match(body.error, /already in use/i);
  assert.equal(state.sentEmails.length, 0);
});

test('email change still requires a recently authenticated token', async () => {
  state.decodedToken.auth_time = Math.floor(Date.now() / 1000) - 301;

  const response = await POST(request({ type: 'emailChange', newEmail: 'new@example.com' }, '192.0.2.3'));

  assert.equal(response.status, 401);
  assert.equal(state.generatedLinkArgs, null);
});

test('sync updates Firestore and Stripe from the authenticated Firebase email without requiring Resend', async () => {
  delete process.env.RESEND_API_KEY;
  state.user.email = 'changed@example.com';
  state.userDocument = { stripeCustomerId: 'cus_123', email: 'current@example.com' };

  const response = await POST(request({ type: 'sync' }, '192.0.2.4'));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true, stripeSynced: true });
  assert.equal(state.userDocument.email, 'changed@example.com');
  assert.ok(state.userDocument.updatedAt instanceof Date);
  assert.deepEqual(state.stripeUpdates, [{
    customerId: 'cus_123',
    updates: { email: 'changed@example.com' },
  }]);
  assert.equal(state.sentEmails.length, 0);
});
