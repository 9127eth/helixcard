const { beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const MONTHLY_PRICE = 'price_1QEXRZ2Mf4JwDdD1pdam2mHo';
const YEARLY_PRICE = 'price_1QEfJH2Mf4JwDdD1j2ME28Fw';
const LIFETIME_PRICE = 'price_1QKWqI2Mf4JwDdD1NaOiqhhg';
const UID = 'user-1';
const CUSTOMER = 'cus_1';

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

const authUsers = new Map();
const claimWrites = [];
const cardSyncs = [];

const auth = {
  async getUser(uid) {
    const user = authUsers.get(uid);
    if (!user) {
      throw Object.assign(new Error('There is no user record for this identifier.'), {
        code: 'auth/user-not-found',
      });
    }
    return { ...user };
  },
  async setCustomUserClaims(uid, claims) {
    claimWrites.push({ uid, claims });
    authUsers.set(uid, { ...authUsers.get(uid), customClaims: claims });
  },
};

const stripeState = {
  subscriptions: [],
  promotionCodes: {},
  customerMetadata: {},
  cancelled: [],
  promotionCodeLists: 0,
};

class StripeMock {
  constructor() {
    this.webhooks = { constructEvent: body => JSON.parse(body) };
    this.customers = {
      retrieve: async id => ({
        id,
        object: 'customer',
        metadata: { firebaseUID: UID, ...stripeState.customerMetadata },
      }),
    };
    this.subscriptions = {
      list: async ({ customer, status }) => ({
        data: stripeState.subscriptions.filter(subscription =>
          subscription.customer === customer && (status === 'all' || subscription.status === status)
        ),
      }),
      cancel: async id => {
        const subscription = stripeState.subscriptions.find(candidate => candidate.id === id);
        subscription.status = 'canceled';
        stripeState.cancelled.push(id);
        return subscription;
      },
    };
    this.promotionCodes = {
      retrieve: async id => stripeState.promotionCodes[id],
      // The newest code sharing a coupon, which the old lookup credited.
      list: async () => {
        stripeState.promotionCodeLists += 1;
        return { data: [{ id: 'promo_newest', code: 'NHMA25' }] };
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
  if (request === 'firebase-admin/firestore') return { FieldValue };
  if (/(^|\/)lib\/firebase-admin$/.test(request) || request === './firebase-admin') return { auth, db };
  if (/(^|\/)adminCards$/.test(request)) {
    // The real sync reads the plan back from the account, so record what is
    // stored at the moment it runs: a sync before the write would show up here.
    return { syncCardActiveStatus: async uid => { cardSyncs.push({ uid, isPro: docs.get(`users/${uid}`)?.isPro === true }); } };
  }
  if (request.startsWith('@/')) {
    return originalLoad(path.join(ROOT, request.slice(2)), parent, isMain);
  }
  return originalLoad(request, parent, isMain);
};

process.env.STRIPE_SECRET_KEY = 'stripe-secret';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
const { POST } = require(path.join(ROOT, 'app/api/webhook/route.ts'));

function subscription(id, status, overrides = {}) {
  return {
    id,
    object: 'subscription',
    customer: CUSTOMER,
    status,
    created: 1_700_000_000,
    cancel_at_period_end: false,
    current_period_end: 1_800_000_000,
    items: { data: [{ price: { id: MONTHLY_PRICE } }] },
    discount: null,
    metadata: { firebaseUID: UID },
    ...overrides,
  };
}

function invoice(subscriptionId) {
  return {
    id: 'in_1',
    object: 'invoice',
    customer: CUSTOMER,
    subscription: subscriptionId,
    lines: { data: [{ price: { id: MONTHLY_PRICE } }] },
  };
}

function lifetimePayment(metadata = {}) {
  return {
    id: 'pi_1',
    object: 'payment_intent',
    customer: CUSTOMER,
    created: 1_700_000_000,
    metadata: { type: 'lifetime', firebaseUID: UID, priceId: LIFETIME_PRICE, ...metadata },
  };
}

function deliver(type, object) {
  return POST(new Request('https://www.helixcard.app/api/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 't=1,v1=signature' },
    body: JSON.stringify({ id: `evt_${type}`, type, data: { object } }),
  }));
}

function seedUser(data) {
  docs.set(`users/${UID}`, { ...data });
}

function account() {
  return docs.get(`users/${UID}`);
}

beforeEach(() => {
  docs.clear();
  commits.length = 0;
  authUsers.clear();
  authUsers.set(UID, { uid: UID, email: 'member@example.com', displayName: 'Member' });
  claimWrites.length = 0;
  cardSyncs.length = 0;
  stripeState.subscriptions = [];
  stripeState.promotionCodes = {};
  stripeState.customerMetadata = {};
  stripeState.cancelled = [];
  stripeState.promotionCodeLists = 0;
});

test('a late subscription.updated (active) delivered after the deletion does not re-grant Pro', async () => {
  seedUser({ isPro: true, isProType: 'monthly', subscriptionType: 'monthly', stripeSubscriptionId: 'sub_1' });
  stripeState.subscriptions = [subscription('sub_1', 'canceled')];

  assert.equal((await deliver('customer.subscription.deleted', subscription('sub_1', 'canceled'))).status, 200);
  // Stripe does not order deliveries: an `updated` from before the
  // cancellation can arrive afterwards, or be retried after a 500.
  const response = await deliver('customer.subscription.updated', subscription('sub_1', 'active'));

  assert.equal(response.status, 200);
  assert.equal(account().isPro, false);
  assert.equal(account().subscriptionStatus, 'canceled');
  assert.equal(account().stripeSubscriptionId, null);
  assert.deepEqual(claimWrites.at(-1), { uid: UID, claims: { isPro: false } });
  assert.deepEqual(cardSyncs.at(-1), { uid: UID, isPro: false });
});

test('cancellation clears the plan type and renewal details along with Pro', async () => {
  seedUser({
    isPro: true,
    isProType: 'yearly',
    subscriptionType: 'yearly',
    stripeSubscriptionId: 'sub_1',
    cancelAtPeriodEnd: true,
    currentPeriodEnd: new Date(1_800_000_000_000),
  });
  stripeState.subscriptions = [
    subscription('sub_1', 'canceled', { items: { data: [{ price: { id: YEARLY_PRICE } }] } }),
  ];

  await deliver('customer.subscription.deleted', stripeState.subscriptions[0]);

  assert.equal(account().isPro, false);
  for (const field of ['isProType', 'subscriptionType', 'cancelAtPeriodEnd', 'currentPeriodEnd']) {
    assert.equal(field in account(), false, field);
  }
});

test('a lifetime account keeps Pro when an older subscription goes unpaid or expires', async () => {
  for (const status of ['unpaid', 'incomplete_expired']) {
    seedUser({ isPro: true, isProType: 'lifetime', subscriptionType: 'lifetime', lifetimePurchase: true });
    stripeState.subscriptions = [subscription('sub_old', status)];

    const response = await deliver('customer.subscription.updated', subscription('sub_old', status));

    assert.equal(response.status, 200);
    assert.equal(account().isPro, true, status);
    assert.equal(account().isProType, 'lifetime', status);
    assert.equal(account().subscriptionType, 'lifetime', status);
    // An unpaid subscription can still be charged, so it stays cancellable.
    assert.equal(account().stripeSubscriptionId, status === 'unpaid' ? 'sub_old' : null, status);
    assert.deepEqual(claimWrites.at(-1), { uid: UID, claims: { isPro: true } });
    assert.deepEqual(cardSyncs.at(-1), { uid: UID, isPro: true });
  }
});

test('the stored subscription moves to the one that is still active', async () => {
  seedUser({ isPro: true, isProType: 'monthly', stripeSubscriptionId: 'sub_new' });
  stripeState.subscriptions = [
    subscription('sub_new', 'canceled', { created: 1_700_000_200 }),
    subscription('sub_old', 'active', {
      created: 1_700_000_100,
      items: { data: [{ price: { id: YEARLY_PRICE } }] },
    }),
  ];

  await deliver('customer.subscription.deleted', stripeState.subscriptions[0]);

  assert.equal(account().stripeSubscriptionId, 'sub_old');
  assert.equal(account().subscriptionStatus, 'active');
  assert.equal(account().isPro, true);
  assert.equal(account().isProType, 'yearly');
});

test('an active subscription records its renewal state and start date', async () => {
  seedUser({ isPro: false });
  stripeState.subscriptions = [
    subscription('sub_1', 'active', { cancel_at_period_end: true, created: 1_700_000_000 }),
  ];

  await deliver('customer.subscription.updated', stripeState.subscriptions[0]);

  assert.equal(account().isPro, true);
  assert.equal(account().isProType, 'monthly');
  assert.equal(account().stripeCustomerId, CUSTOMER);
  assert.equal(account().cancelAtPeriodEnd, true);
  assert.deepEqual(account().currentPeriodEnd, new Date(1_800_000_000 * 1000));
  assert.deepEqual(account().subscriptionCreatedAt, new Date(1_700_000_000 * 1000));
});

test('partner credit comes from the subscription\'s own promotion code', async () => {
  seedUser({ isPro: false });
  // Typed on an abandoned first checkout attempt, then never used.
  stripeState.customerMetadata = { couponCode: 'VMCRX' };
  stripeState.promotionCodes = { promo_lipscomb: { id: 'promo_lipscomb', code: 'LIPSCOMB25' } };
  stripeState.subscriptions = [
    subscription('sub_1', 'active', {
      discount: { coupon: { id: 'coupon_shared' }, promotion_code: 'promo_lipscomb' },
    }),
  ];

  await deliver('customer.subscription.updated', stripeState.subscriptions[0]);

  assert.equal(account().couponUsed, 'LIPSCOMB25');
  assert.equal(account().group, 'lipscomb-university');
  assert.equal(stripeState.promotionCodeLists, 0);
});

test('a subscription without a promotion code leaves earlier attribution alone', async () => {
  seedUser({ isPro: false, couponUsed: 'NHMA25', group: 'nhma-members' });
  stripeState.customerMetadata = { couponCode: 'VMCRX' };
  stripeState.subscriptions = [subscription('sub_1', 'active')];

  await deliver('customer.subscription.updated', stripeState.subscriptions[0]);

  assert.equal(account().isPro, true);
  assert.equal(account().couponUsed, 'NHMA25');
  assert.equal(account().group, 'nhma-members');
});

test('invoice.paid grants nothing while the subscription is not active', async () => {
  seedUser({ isPro: false, stripeCustomerId: CUSTOMER });
  stripeState.subscriptions = [subscription('sub_1', 'past_due')];

  const response = await deliver('invoice.paid', invoice('sub_1'));

  assert.equal(response.status, 200);
  assert.equal(account().isPro, false);
  assert.equal(account().stripeSubscriptionId, 'sub_1');
  assert.deepEqual(claimWrites, [{ uid: UID, claims: { isPro: false } }]);
});

test('invoice.paid for a one-off invoice is ignored', async () => {
  seedUser({ isPro: false });

  const response = await deliver('invoice.paid', invoice(null));

  assert.equal(response.status, 200);
  assert.deepEqual(commits, []);
  assert.deepEqual(claimWrites, []);
});

test('an event for a deleted account cancels its billing and is acknowledged', async () => {
  // Deleted in the iOS app, which removes the auth user and users document
  // without going through /api/delete-account.
  authUsers.clear();
  stripeState.subscriptions = [
    subscription('sub_live', 'active'),
    subscription('sub_done', 'canceled', { created: 1_600_000_000 }),
  ];

  const response = await deliver('invoice.paid', invoice('sub_live'));

  assert.equal(response.status, 200);
  assert.deepEqual(stripeState.cancelled, ['sub_live']);
  const record = docs.get(`accountDeletions/${UID}`);
  assert.equal(record.status, 'billing_cancelled_by_webhook');
  assert.equal(record.stripeCustomerId, CUSTOMER);
  assert.deepEqual(record.cancelledSubscriptionIds, ['sub_live']);
  assert.ok(record.updatedAt instanceof Date);
  assert.equal(docs.has(`users/${UID}`), false);
  assert.deepEqual(claimWrites, []);

  // The deletion event that follows finds nothing left to cancel.
  const followUp = await deliver('customer.subscription.deleted', subscription('sub_live', 'canceled'));
  assert.equal(followUp.status, 200);
  assert.deepEqual(docs.get(`accountDeletions/${UID}`).cancelledSubscriptionIds, ['sub_live']);
});

test('an account with no users document is acknowledged without writing or cancelling', async () => {
  stripeState.subscriptions = [subscription('sub_1', 'active')];

  const subscriptionEvent = await deliver('customer.subscription.updated', stripeState.subscriptions[0]);
  const paymentEvent = await deliver('payment_intent.succeeded', lifetimePayment());

  assert.equal(subscriptionEvent.status, 200);
  assert.equal(paymentEvent.status, 200);
  assert.equal(docs.size, 0);
  assert.deepEqual(stripeState.cancelled, []);
  assert.deepEqual(claimWrites, []);
  assert.deepEqual(cardSyncs, []);
});

test('a plan change keeps an administrator\'s admin claim', async () => {
  authUsers.set(UID, { uid: UID, email: 'admin@example.com', customClaims: { admin: true } });
  seedUser({ isPro: false });
  stripeState.subscriptions = [subscription('sub_1', 'active')];

  await deliver('customer.subscription.created', stripeState.subscriptions[0]);

  assert.deepEqual(claimWrites, [{ uid: UID, claims: { admin: true, isPro: true } }]);
});

test('a redelivered lifetime payment records the redemption once', async () => {
  // Created in the iOS app: the users document has no email field.
  seedUser({ isPro: false });
  const payment = lifetimePayment({ couponCode: 'LIPSCOMB25' });

  assert.equal((await deliver('payment_intent.succeeded', payment)).status, 200);
  const firstClaim = docs.get(`lifetimesubs/LIPSCOMB25/customers/${UID}`).claimedAt;
  assert.equal((await deliver('payment_intent.succeeded', payment)).status, 200);

  assert.equal(docs.get('lifetimesubs/LIPSCOMB25').totalUses, 1);
  const record = docs.get(`lifetimesubs/LIPSCOMB25/customers/${UID}`);
  assert.equal(record.claimedAt, firstClaim);
  assert.equal(record.email, 'member@example.com');
  assert.equal(record.emailHash, createHash('sha256').update('member@example.com').digest('hex'));

  assert.equal(account().isPro, true);
  assert.equal(account().isProType, 'lifetime');
  assert.equal(account().lifetimePurchase, true);
  assert.equal(account().couponUsed, 'LIPSCOMB25');
  assert.equal(account().group, 'lipscomb-university');
  assert.deepEqual(account().subscriptionCreatedAt, new Date(1_700_000_000 * 1000));
  assert.deepEqual(claimWrites.at(-1), { uid: UID, claims: { isPro: true } });
  assert.deepEqual(cardSyncs.at(-1), { uid: UID, isPro: true });
});

test('a lifetime payment without a code is not credited to the customer\'s metadata', async () => {
  seedUser({ isPro: false });
  stripeState.customerMetadata = { couponCode: 'VMCRX' };

  await deliver('payment_intent.succeeded', lifetimePayment());

  assert.equal(account().isPro, true);
  assert.equal('couponUsed' in account(), false);
  assert.equal('group' in account(), false);
  assert.equal([...docs.keys()].some(key => key.startsWith('lifetimesubs/')), false);
});
