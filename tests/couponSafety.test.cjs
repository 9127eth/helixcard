const { beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const LIFETIME_PRICE = 'price_1QKWqI2Mf4JwDdD1NaOiqhhg';

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
  promotionCodes: [],
  coupon: null,
  couponRetrieveArgs: null,
  userDocument: {},
  userUpdates: [],
  claims: [],
  redemptions: [],
  stripeWrites: [],
};

const auth = {
  async verifyIdToken() {
    return { uid: 'user-123', email: 'member@example.com', name: 'Member' };
  },
  async setCustomUserClaims(uid, claims) {
    state.claims.push({ uid, claims });
  },
};

const db = {
  collection(name) {
    assert.equal(name, 'users');
    return {
      doc(uid) {
        assert.equal(uid, 'user-123');
        return {
          async get() {
            return { data: () => ({ ...state.userDocument }) };
          },
          async update(updates) {
            state.userUpdates.push(updates);
            state.userDocument = { ...state.userDocument, ...updates };
          },
        };
      },
    };
  },
};

class StripeMock {
  constructor() {
    const recordWrite = name => async (...args) => {
      state.stripeWrites.push({ name, args });
      throw new Error(`${name} should not be reached`);
    };

    this.promotionCodes = {
      list: async () => ({ data: state.promotionCodes }),
    };
    this.coupons = {
      // Like Stripe, only return `applies_to` when the caller expands it.
      retrieve: async (id, params) => {
        state.couponRetrieveArgs = [id, params];
        const { applies_to: appliesTo, ...coupon } = state.coupon;
        return params?.expand?.includes('applies_to') ? { ...coupon, applies_to: appliesTo } : coupon;
      },
    };
    this.prices = {
      retrieve: async () => ({ product: 'prod_lifetime' }),
    };
    this.customers = { create: recordWrite('customers.create'), retrieve: recordWrite('customers.retrieve') };
    this.paymentIntents = { create: recordWrite('paymentIntents.create') };
    this.subscriptions = { create: recordWrite('subscriptions.create') };
  }
}

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === 'next/server') {
    return { NextResponse: { json: (body, init) => Response.json(body, init) } };
  }
  if (request === 'stripe') return { __esModule: true, default: StripeMock };
  if (request.endsWith('lib/firebase-admin')) return { auth, db };
  if (request.endsWith('utils/lifetimeCoupons')) {
    return {
      hasUserUsedCoupon: async () => false,
      hasEmailUsedCoupon: async () => false,
      recordCouponRedemption: async (...args) => state.redemptions.push(args),
    };
  }
  return originalLoad(request, parent, isMain);
};

process.env.STRIPE_SECRET_KEY = 'stripe-secret';
const { POST } = require(path.join(ROOT, 'app/api/create-subscription/route.ts'));

function request(body) {
  return new Request('https://www.helixcard.app/api/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-token', priceId: LIFETIME_PRICE, ...body }),
  });
}

function assertNothingGranted() {
  assert.deepEqual(state.userUpdates, []);
  assert.deepEqual(state.claims, []);
  assert.deepEqual(state.redemptions, []);
  assert.deepEqual(state.stripeWrites, []);
}

beforeEach(() => {
  state.promotionCodes = [];
  state.coupon = null;
  state.couponRetrieveArgs = null;
  state.userDocument = { isPro: false };
  state.userUpdates = [];
  state.claims = [];
  state.redemptions = [];
  state.stripeWrites = [];
});

test('a free lifetime code that is no longer active in Stripe grants nothing', async () => {
  state.promotionCodes = [];

  const response = await POST(request({ couponCode: 'VMCRX', isFreeSubscription: true }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid promotion code' });
  assertNothingGranted();
});

test('a free lifetime code whose coupon has expired grants nothing', async () => {
  state.promotionCodes = [{ id: 'promo_1', coupon: { id: 'coupon_1', valid: false } }];

  const response = await POST(request({ couponCode: 'NCPA25', isFreeSubscription: true }));

  assert.equal(response.status, 400);
  assertNothingGranted();
});

test('a free lifetime code that is still live in Stripe activates lifetime Pro', async () => {
  state.promotionCodes = [{ id: 'promo_1', coupon: { id: 'coupon_1', valid: true } }];

  const response = await POST(request({ couponCode: 'MCKiS25', isFreeSubscription: true }));

  assert.equal(response.status, 200);
  assert.equal((await response.json()).subscriptionType, 'lifetime');
  assert.equal(state.userUpdates.length, 1);
  assert.equal(state.userUpdates[0].isPro, true);
  assert.equal(state.userUpdates[0].lifetimePurchase, true);
  assert.equal(state.userUpdates[0].couponUsed, 'MCKiS25');
  assert.deepEqual(state.claims, [{ uid: 'user-123', claims: { isPro: true } }]);
  assert.equal(state.redemptions.length, 1);
});

test('a code restricted to another product cannot discount the lifetime purchase', async () => {
  state.promotionCodes = [{ id: 'promo_1', coupon: { id: 'coupon_1', valid: true } }];
  state.coupon = {
    id: 'coupon_1',
    valid: true,
    percent_off: 90,
    applies_to: { products: ['prod_monthly'] },
  };

  const response = await POST(request({ couponCode: 'MONTHLYONLY', paymentMethodId: 'pm_123' }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'This coupon code is not valid for the selected product type',
  });
  assert.deepEqual(state.couponRetrieveArgs, ['coupon_1', { expand: ['applies_to'] }]);
  assertNothingGranted();
});
