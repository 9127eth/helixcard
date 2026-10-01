const { beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
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

// In-memory Admin SDK Firestore: documents by path and FieldValue sentinels.
const FieldValue = {
  delete: () => ({ __op: 'delete' }),
  increment: n => ({ __op: 'increment', n }),
  serverTimestamp: () => ({ __op: 'serverTimestamp' }),
};

const docs = new Map();

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

function write(type, docPath, data, merge) {
  const current = docs.get(docPath);
  if (type === 'update' && !current) {
    throw Object.assign(new Error(`5 NOT_FOUND: no document to update: ${docPath}`), { code: 5 });
  }
  docs.set(docPath, applyFields(type === 'update' || merge ? current ?? {} : {}, data));
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
    set: async (data, options) => write('set', docPath, data, options?.merge),
    update: async data => write('update', docPath, data),
  };
  return ref;
}

function collectionRef(collectionPath) {
  return {
    path: collectionPath,
    doc: id => docRef(`${collectionPath}/${id}`),
    get: async () => {
      const found = [...docs.keys()]
        .filter(key => key.startsWith(`${collectionPath}/`) && !key.slice(collectionPath.length + 1).includes('/'))
        .map(key => snapshotOf(docRef(key)));
      return { docs: found, empty: found.length === 0, size: found.length };
    },
  };
}

const db = { collection: name => collectionRef(name) };

const admin = {
  firestore: Object.assign(
    () => ({
      async recursiveDelete(ref) {
        for (const key of [...docs.keys()]) {
          if (key === ref.path || key.startsWith(`${ref.path}/`)) docs.delete(key);
        }
      },
    }),
    { FieldValue }
  ),
};

const state = {
  customer: null,
  subscriptions: [],
  failures: {},
  stripeCalls: [],
  storageError: null,
  deletedAuthUsers: [],
};

const auth = {
  async verifyIdToken() {
    return { uid: UID, email: 'member@example.com', auth_time: Math.floor(Date.now() / 1000) };
  },
  async deleteUser(uid) {
    state.deletedAuthUsers.push(uid);
  },
};

const storage = {
  bucket: () => ({
    deleteFiles: async () => {
      if (state.storageError) throw state.storageError;
    },
  }),
};

class StripeMock {
  constructor() {
    const call = (name, result) => async (...args) => {
      state.stripeCalls.push(name);
      if (state.failures[name]) throw state.failures[name];
      return typeof result === 'function' ? result(...args) : result;
    };

    this.customers = {
      retrieve: call('customers.retrieve', () => state.customer),
      del: call('customers.del', id => ({ id, deleted: true })),
    };
    this.subscriptions = {
      list: call('subscriptions.list', () => ({ data: state.subscriptions })),
      cancel: call('subscriptions.cancel', id => ({ id, status: 'canceled' })),
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
  if (/(^|\/)lib\/firebase-admin$/.test(request)) {
    return { __esModule: true, default: admin, auth, db, storage };
  }
  if (/(^|\/)lib\/usernames$/.test(request)) return { releaseUsernames: async () => {} };
  return originalLoad(request, parent, isMain);
};

process.env.STRIPE_SECRET_KEY = 'stripe-secret';
const { POST } = require(path.join(ROOT, 'app/api/delete-account/route.ts'));

function deleteAccount() {
  return POST(new Request('https://www.helixcard.app/api/delete-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-token' }),
  }));
}

const missing = name => Object.assign(new Error(`No such ${name}`), {
  type: 'StripeInvalidRequestError',
  code: 'resource_missing',
});

beforeEach(() => {
  docs.clear();
  docs.set(`users/${UID}`, { email: 'member@example.com', stripeCustomerId: CUSTOMER });
  state.customer = { id: CUSTOMER, object: 'customer' };
  state.subscriptions = [];
  state.failures = {};
  state.stripeCalls = [];
  state.storageError = null;
  state.deletedAuthUsers = [];
});

test('a retry after the Stripe customer was already deleted finishes the deletion', async () => {
  // The first attempt deleted the customer, then failed further on.
  state.customer = { id: CUSTOMER, object: 'customer', deleted: true };
  state.failures['customers.del'] = missing('customer');

  const response = await deleteAccount();

  assert.equal(response.status, 200);
  assert.deepEqual(state.stripeCalls, ['customers.retrieve']);
  assert.equal(docs.has(`users/${UID}`), false);
  assert.deepEqual(state.deletedAuthUsers, [UID]);
  assert.equal(docs.get(`accountDeletions/${UID}`).status, 'completed');
});

test('a customer Stripe no longer has counts as torn down', async () => {
  for (const name of ['customers.retrieve', 'subscriptions.list', 'customers.del']) {
    state.failures[name] = missing('customer');
  }

  const response = await deleteAccount();

  assert.equal(response.status, 200);
  assert.equal(docs.get(`accountDeletions/${UID}`).status, 'completed');
});

test('a customer that disappears mid-teardown still has its live subscriptions cancelled', async () => {
  state.subscriptions = [
    { id: 'sub_live', status: 'active' },
    { id: 'sub_done', status: 'canceled' },
  ];
  state.failures['customers.del'] = missing('customer');

  const response = await deleteAccount();

  assert.equal(response.status, 200);
  assert.deepEqual(state.stripeCalls, [
    'customers.retrieve',
    'subscriptions.list',
    'subscriptions.cancel',
    'customers.del',
  ]);
});

test('any other Stripe failure still stops the deletion', async () => {
  state.failures['subscriptions.list'] = Object.assign(new Error('socket hang up'), {
    type: 'StripeConnectionError',
  });

  const response = await deleteAccount();

  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'billing-cleanup-failed');
  assert.equal(docs.get(`accountDeletions/${UID}`).status, 'billing_failed');
  assert.ok(docs.has(`users/${UID}`));
  assert.deepEqual(state.deletedAuthUsers, []);
});

test('a failure after billing was cleared keeps that status and records the step', async () => {
  state.storageError = new Error('storage unavailable');

  const response = await deleteAccount();

  assert.equal(response.status, 500);
  const record = docs.get(`accountDeletions/${UID}`);
  assert.equal(record.status, 'billing_cleared');
  assert.equal(record.failedStep, 'storage');
  assert.equal(record.lastError, 'storage unavailable');
  assert.ok(record.failedAt instanceof Date);
});
