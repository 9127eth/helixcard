const { beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const MONTHLY_PRICE = 'price_1QEXRZ2Mf4JwDdD1pdam2mHo';
const LIFETIME_PRICE = 'price_1QKWqI2Mf4JwDdD1NaOiqhhg';
const UID = 'user-123';

const PRICES = {
  [MONTHLY_PRICE]: { product: 'prod_monthly', unit_amount: 299 },
  [LIFETIME_PRICE]: { product: 'prod_lifetime', unit_amount: 1999 },
};

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

// In-memory Admin SDK Firestore: documents by path, FieldValue sentinels, and
// writes (including a transaction's) that commit all together or not at all.
const FieldValue = {
  delete: () => ({ __op: 'delete' }),
  increment: n => ({ __op: 'increment', n }),
  serverTimestamp: () => ({ __op: 'serverTimestamp' }),
};

const docs = new Map();
const commits = [];

function applyFields(current, fields) {
  const next = { ...current };
  for (const [key, value] of Object.entries(fields)) {
    if (value?.__op === 'delete') delete next[key];
    else if (value?.__op === 'increment') next[key] = (next[key] ?? 0) + value.n;
    else if (value?.__op === 'serverTimestamp') next[key] = new Date();
    else next[key] = value;
  }
  return next;
}

function commit(writes) {
  const staged = new Map(docs);
  for (const write of writes) {
    const current = staged.get(write.path);
    if (write.type === 'update' && !current) {
      throw Object.assign(new Error(`5 NOT_FOUND: no document to update: ${write.path}`), { code: 5 });
    }
    const base = write.type === 'update' || write.merge ? current ?? {} : {};
    staged.set(write.path, applyFields(base, write.data));
  }
  docs.clear();
  for (const [key, value] of staged) docs.set(key, value);
  commits.push(writes.map(write => write.path));
}

function snapshotOf(ref) {
  const data = docs.get(ref.path);
  return { id: ref.id, ref, exists: data !== undefined, data: () => (data && { ...data }) };
}

function docRef(docPath) {
  const ref = {
    path: docPath,
    id: docPath.split('/').pop(),
    collection: name => collectionRef(`${docPath}/${name}`),
    get: async () => snapshotOf(ref),
    set: async (data, options) => commit([{ type: 'set', path: docPath, data, merge: options?.merge }]),
    update: async data => commit([{ type: 'update', path: docPath, data }]),
  };
  return ref;
}

function queryRef(collectionPath, filters = [], max = Infinity) {
  const matches = () => [...docs.keys()]
    .filter(key => key.startsWith(`${collectionPath}/`) && !key.slice(collectionPath.length + 1).includes('/'))
    .filter(key => filters.every(([field, value]) => docs.get(key)[field] === value))
    .slice(0, max)
    .map(key => snapshotOf(docRef(key)));

  return {
    where: (field, _op, value) => queryRef(collectionPath, [...filters, [field, value]], max),
    limit: n => queryRef(collectionPath, filters, n),
    count: () => ({ get: async () => ({ data: () => ({ count: matches().length }) }) }),
    get: async () => {
      const found = matches();
      return { docs: found, empty: found.length === 0, size: found.length };
    },
  };
}

function collectionRef(collectionPath) {
  return { ...queryRef(collectionPath), path: collectionPath, doc: id => docRef(`${collectionPath}/${id}`) };
}

const db = {
  collection: name => collectionRef(name),
  async runTransaction(updateFunction) {
    const writes = [];
    const transaction = {
      get: async ref => snapshotOf(ref),
      getAll: async (...refs) => refs.map(snapshotOf),
      set(ref, data, options) {
        writes.push({ type: 'set', path: ref.path, data, merge: options?.merge });
        return transaction;
      },
      update(ref, data) {
        writes.push({ type: 'update', path: ref.path, data });
        return transaction;
      },
    };
    const result = await updateFunction(transaction);
    commit(writes);
    return result;
  },
};

const state = {
  decodedToken: null,
  promotionCodes: [],
  coupon: null,
  couponRetrieveArgs: null,
  subscriptions: [],
  seededUser: null,
  claims: [],
  cardSyncs: [],
  stripeWrites: [],
};

const auth = {
  async verifyIdToken() {
    return state.decodedToken;
  },
  async getUser(uid) {
    return { uid, customClaims: undefined };
  },
  async setCustomUserClaims(uid, claims) {
    state.claims.push({ uid, claims });
  },
};

class StripeMock {
  constructor() {
    const recordWrite = (name, result) => async (...args) => {
      state.stripeWrites.push({ name, args });
      return typeof result === 'function' ? result(...args) : result;
    };

    this.promotionCodes = {
      // Stripe matches `code` ignoring case and returns its own spelling.
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
      retrieve: async id => ({ id, ...PRICES[id] }),
    };
    this.customers = {
      retrieve: async id => ({ id, object: 'customer' }),
      create: recordWrite('customers.create', { id: 'cus_new', object: 'customer' }),
      update: recordWrite('customers.update', {}),
    };
    this.subscriptions = {
      list: async ({ status }) => ({
        data: state.subscriptions.filter(subscription => status === 'all' || subscription.status === status),
      }),
      cancel: recordWrite('subscriptions.cancel', id => ({ id, status: 'canceled' })),
      create: recordWrite('subscriptions.create', {
        id: 'sub_new',
        latest_invoice: { amount_due: 299, payment_intent: { client_secret: 'sub_secret' } },
      }),
    };
    this.paymentMethods = { attach: recordWrite('paymentMethods.attach', {}) };
    this.paymentIntents = {
      create: recordWrite('paymentIntents.create', {
        id: 'pi_1',
        client_secret: 'pi_secret',
        status: 'requires_action',
      }),
    };
  }
}

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === 'next/server') {
    return { NextResponse: { json: (body, init) => Response.json(body, init) } };
  }
  if (request === 'stripe') return { __esModule: true, default: StripeMock };
  if (request === 'firebase-admin/firestore') return { FieldValue };
  if (/(^|\/)lib\/firebase-admin$/.test(request) || request === './firebase-admin') return { auth, db };
  if (/(^|\/)adminCards$/.test(request)) {
    // The real sync reads the plan back from the account, so record what is
    // stored at the moment it runs: a sync before the grant would show up here.
    return { syncCardActiveStatus: async uid => { state.cardSyncs.push({ uid, isPro: docs.get(`users/${uid}`)?.isPro === true }); } };
  }
  return originalLoad(request, parent, isMain);
};

process.env.STRIPE_SECRET_KEY = 'stripe-secret';
const { POST } = require(path.join(ROOT, 'app/api/create-subscription/route.ts'));
const { POST: verifyCoupon } = require(path.join(ROOT, 'app/api/verify-coupon/route.ts'));
const {
  hasEmailUsedCoupon,
  hashCouponEmail,
  redactCouponRedemptions,
} = require(path.join(ROOT, 'app/utils/lifetimeCoupons.ts'));
const { getGroupFromCoupon, getGroupFromSource } = require(path.join(ROOT, 'app/utils/groupMapping.ts'));

function request(body) {
  return new Request('https://www.helixcard.app/api/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-token', priceId: LIFETIME_PRICE, ...body }),
  });
}

function verifyRequest(body) {
  return new Request('https://www.helixcard.app/api/verify-coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-token', priceId: LIFETIME_PRICE, ...body }),
  });
}

/** A live promotion code as Stripe lists it, 100% off unless told otherwise. */
function promotion(code, coupon = {}, extra = {}) {
  return {
    id: `promo_${code}`,
    code,
    coupon: { id: `coupon_${code}`, valid: true, percent_off: 100, ...coupon },
    ...extra,
  };
}

function seedUser(data) {
  state.seededUser = { ...data };
  docs.set(`users/${UID}`, { ...data });
}

function redeemedByUser() {
  return [...docs.keys()].filter(key => key.startsWith('lifetimesubs/') && key.endsWith(`/customers/${UID}`));
}

function assertNothingGranted() {
  assert.deepEqual(docs.get(`users/${UID}`), state.seededUser);
  assert.deepEqual(state.claims, []);
  assert.deepEqual(state.cardSyncs, []);
  assert.deepEqual(redeemedByUser(), []);
  assert.deepEqual(state.stripeWrites, []);
}

beforeEach(() => {
  docs.clear();
  commits.length = 0;
  state.decodedToken = { uid: UID, email: 'member@example.com', name: 'Member' };
  state.promotionCodes = [];
  state.coupon = null;
  state.couponRetrieveArgs = null;
  state.subscriptions = [];
  state.claims = [];
  state.cardSyncs = [];
  state.stripeWrites = [];
  seedUser({ isPro: false });
});

test('a free lifetime code that is no longer active in Stripe grants nothing', async () => {
  state.promotionCodes = [];

  const response = await POST(request({ couponCode: 'VMCRX', isFreeSubscription: true }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid promotion code' });
  assertNothingGranted();
});

test('a free lifetime code whose coupon has expired grants nothing', async () => {
  state.promotionCodes = [promotion('NCPA25', { valid: false })];

  const response = await POST(request({ couponCode: 'NCPA25', isFreeSubscription: true }));

  assert.equal(response.status, 400);
  assertNothingGranted();
});

test('a free lifetime code that is still live in Stripe activates lifetime Pro', async () => {
  state.promotionCodes = [promotion('MCKiS25')];

  const response = await POST(request({ couponCode: 'MCKiS25', isFreeSubscription: true }));

  assert.equal(response.status, 200);
  assert.equal((await response.json()).subscriptionType, 'lifetime');
  assert.equal(commits.filter(paths => paths.includes(`users/${UID}`)).length, 1);
  const account = docs.get(`users/${UID}`);
  assert.equal(account.isPro, true);
  assert.equal(account.lifetimePurchase, true);
  assert.equal(account.couponUsed, 'MCKiS25');
  assert.deepEqual(state.claims, [{ uid: UID, claims: { isPro: true } }]);
  assert.deepEqual(redeemedByUser(), [`lifetimesubs/MCKiS25/customers/${UID}`]);
});

test('a code restricted to another product cannot discount the lifetime purchase', async () => {
  state.promotionCodes = [promotion('MONTHLYONLY')];
  state.coupon = {
    id: 'coupon_MONTHLYONLY',
    valid: true,
    percent_off: 90,
    applies_to: { products: ['prod_monthly'] },
  };

  const response = await POST(request({ couponCode: 'MONTHLYONLY', paymentMethodId: 'pm_123' }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'This coupon code is not valid for the selected product type',
  });
  assert.deepEqual(state.couponRetrieveArgs, ['coupon_MONTHLYONLY', { expand: ['applies_to'] }]);
  assertNothingGranted();
});

test('a partner code typed in lower case is verified and claimed as its canonical code', async () => {
  state.promotionCodes = [promotion('VMCRX')];
  state.coupon = { id: 'coupon_VMCRX', valid: true, percent_off: 100 };

  const verified = await verifyCoupon(verifyRequest({ couponCode: 'vmcrx' }));
  const quote = await verified.json();
  assert.equal(verified.status, 200);
  assert.equal(quote.isVMCRX, true);
  assert.equal(quote.isFree, true);

  const response = await POST(request({ couponCode: 'vmcrx', isFreeSubscription: true }));

  assert.equal(response.status, 200);
  const account = docs.get(`users/${UID}`);
  assert.equal(account.couponUsed, 'VMCRX');
  assert.equal(account.group, 'vmcrx-partners');
  assert.deepEqual(redeemedByUser(), [`lifetimesubs/VMCRX/customers/${UID}`]);
  assert.equal(docs.get('lifetimesubs/VMCRX').totalUses, 1);
});

test('UCONN25 is lifetime-only when bought, not just when verified', async () => {
  state.promotionCodes = [promotion('UCONN25', { percent_off: 10 })];
  state.coupon = { id: 'coupon_UCONN25', valid: true, percent_off: 10 };

  const verified = await verifyCoupon(verifyRequest({ couponCode: 'uconn25', priceId: MONTHLY_PRICE }));
  assert.equal(verified.status, 400);

  const response = await POST(request({
    priceId: MONTHLY_PRICE,
    couponCode: 'UCONN25',
    paymentMethodId: 'pm_123',
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'This coupon code is not valid for the selected product type',
  });
  assertNothingGranted();
});

test('an abandoned checkout no longer blocks the next paid attempt, and is cancelled first', async () => {
  seedUser({ isPro: false, stripeCustomerId: 'cus_existing' });
  // A declined card left the first attempt's subscription incomplete.
  state.subscriptions = [{ id: 'sub_abandoned', status: 'incomplete' }];

  const response = await POST(request({ priceId: MONTHLY_PRICE, paymentMethodId: 'pm_123' }));

  assert.equal(response.status, 200);
  assert.equal((await response.json()).clientSecret, 'sub_secret');
  assert.deepEqual(state.stripeWrites.map(write => write.name), [
    'subscriptions.cancel',
    'paymentMethods.attach',
    'customers.update',
    'subscriptions.create',
  ]);
  assert.deepEqual(state.stripeWrites[0].args, ['sub_abandoned']);
});

test('a subscription that still bills keeps refusing a second purchase', async () => {
  seedUser({ isPro: false, stripeCustomerId: 'cus_existing' });
  state.subscriptions = [{ id: 'sub_overdue', status: 'past_due' }];

  const response = await POST(request({ priceId: MONTHLY_PRICE, paymentMethodId: 'pm_123' }));

  assert.equal(response.status, 409);
  assert.deepEqual(state.stripeWrites, []);
});

test('the free path records the redemption and grants Pro in one commit, then syncs cards', async () => {
  state.promotionCodes = [promotion('NCPA25')];

  const response = await POST(request({ couponCode: 'NCPA25', isFreeSubscription: true }));

  assert.equal(response.status, 200);
  const grant = commits.find(paths => paths.includes(`users/${UID}`));
  assert.deepEqual([...grant].sort(), [
    'lifetimesubs/NCPA25',
    `lifetimesubs/NCPA25/customers/${UID}`,
    `users/${UID}`,
  ]);
  assert.deepEqual(state.claims, [{ uid: UID, claims: { isPro: true } }]);
  assert.deepEqual(state.cardSyncs, [{ uid: UID, isPro: true }]);
});

test('a free grant that fails leaves the code unspent', async () => {
  state.promotionCodes = [promotion('NCPA25')];
  docs.delete(`users/${UID}`);

  const failed = await POST(request({ couponCode: 'NCPA25', isFreeSubscription: true }));

  assert.equal(failed.status, 500);
  assert.deepEqual(redeemedByUser(), []);
  assert.equal(docs.has('lifetimesubs/NCPA25'), false);
  assert.deepEqual(state.claims, []);

  seedUser({ isPro: false });
  const retried = await POST(request({ couponCode: 'NCPA25', isFreeSubscription: true }));
  assert.equal(retried.status, 200);
});

test('the free path refuses a paying customer and clears an abandoned checkout', async () => {
  seedUser({ isPro: false, stripeCustomerId: 'cus_existing' });
  state.promotionCodes = [promotion('VMCRX')];

  state.subscriptions = [{ id: 'sub_active', status: 'active' }];
  const refused = await POST(request({ couponCode: 'VMCRX', isFreeSubscription: true }));
  assert.equal(refused.status, 400);
  assertNothingGranted();

  state.subscriptions = [{ id: 'sub_abandoned', status: 'incomplete' }];
  const claimed = await POST(request({ couponCode: 'VMCRX', isFreeSubscription: true }));
  assert.equal(claimed.status, 200);
  assert.deepEqual(state.stripeWrites, [{ name: 'subscriptions.cancel', args: ['sub_abandoned'] }]);
});

test('an expired or fully redeemed code is refused on the lifetime paths', async () => {
  const anHourAgo = Math.floor(Date.now() / 1000) - 3600;
  state.promotionCodes = [promotion('VMCRX', {}, { expires_at: anHourAgo })];

  let response = await POST(request({ couponCode: 'VMCRX', isFreeSubscription: true }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'This code has expired' });

  // Stripe never redeems these codes, so its caps are checked against our records.
  docs.set('lifetimesubs/VMCRX/customers/someone-else', { uid: 'someone-else' });
  state.promotionCodes = [promotion('VMCRX', {}, { max_redemptions: 1 })];

  response = await POST(request({ couponCode: 'VMCRX', isFreeSubscription: true }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'This code has reached its redemption limit' });

  docs.set('lifetimesubs/LIPSCOMB25/customers/someone-else', { uid: 'someone-else' });
  state.promotionCodes = [promotion('LIPSCOMB25', { percent_off: 25 })];
  state.coupon = { id: 'coupon_LIPSCOMB25', valid: true, percent_off: 25, max_redemptions: 1 };

  response = await POST(request({ couponCode: 'LIPSCOMB25', paymentMethodId: 'pm_123' }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'This code has reached its redemption limit' });

  assertNothingGranted();
});

test('the lifetime charge can finish 3-D Secure in the browser and carries the canonical code', async () => {
  state.promotionCodes = [promotion('LIPSCOMB25', { percent_off: 25 })];
  state.coupon = { id: 'coupon_LIPSCOMB25', valid: true, percent_off: 25 };

  const response = await POST(request({ couponCode: 'lipscomb25', paymentMethodId: 'pm_123' }));

  assert.equal(response.status, 200);
  assert.equal((await response.json()).clientSecret, 'pi_secret');
  const [intent] = state.stripeWrites.find(write => write.name === 'paymentIntents.create').args;
  assert.equal(intent.confirm, true);
  assert.equal(intent.use_stripe_sdk, true);
  assert.equal('confirmation_method' in intent, false);
  assert.equal(intent.amount, 1499);
  assert.equal(intent.metadata.couponCode, 'LIPSCOMB25');
  // The customer outlives this attempt, so it no longer carries the code.
  const [customer] = state.stripeWrites.find(write => write.name === 'customers.create').args;
  assert.deepEqual(customer.metadata, { firebaseUID: UID });
});

test('an account without an email is not refused by redacted records', async () => {
  // Sign in with Apple can leave the token without an email.
  state.decodedToken = { uid: UID, name: 'Member' };
  docs.set('lifetimesubs/MCKiS25/customers/deleted-account', {
    uid: 'deleted-account',
    email: '',
    emailHash: '',
  });
  state.promotionCodes = [promotion('MCKiS25')];

  const response = await POST(request({ couponCode: 'MCKiS25', isFreeSubscription: true }));

  assert.equal(response.status, 200);
  assert.equal(await hasEmailUsedCoupon('MCKiS25', ''), false);
});

test('redaction keeps the hash of the address that redeemed the code', async () => {
  docs.set('lifetimesubs/VMCRX', { couponCode: 'VMCRX', totalUses: 1 });
  docs.set(`lifetimesubs/VMCRX/customers/${UID}`, {
    uid: UID,
    email: 'first@example.com',
    emailHash: hashCouponEmail('first@example.com'),
    name: 'Member',
  });

  // The account changed its email before it was deleted.
  await redactCouponRedemptions(UID, 'second@example.com');

  const record = docs.get(`lifetimesubs/VMCRX/customers/${UID}`);
  assert.equal(record.email, '');
  assert.equal(record.name, '');
  assert.equal(record.emailHash, hashCouponEmail('first@example.com'));
  assert.equal(await hasEmailUsedCoupon('VMCRX', 'first@example.com'), true);
});

test('partner groups match codes and sources in any case', () => {
  assert.equal(getGroupFromSource('Lipscomb'), 'lipscomb-university');
  assert.equal(getGroupFromCoupon('mckis25'), 'mckis-group');
  assert.equal(getGroupFromCoupon('UNKNOWN'), null);
});
