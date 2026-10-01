const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const {
  clear,
  get,
  seed,
  setUsage,
  load,
  store,
  deletedStoragePaths,
} = require('./helpers/loadApp.cjs');

/**
 * A small Admin SDK stand-in over the helper's in-memory store, so server code
 * (usage, usernames, public lookups) and browser code see the same documents.
 */
const admin = { transactions: 0, directWrites: [] };

function adminSnapshot(docPath) {
  const data = store.get(docPath);
  return {
    id: docPath.split('/').pop(),
    ref: adminDoc(docPath),
    exists: data !== undefined,
    data: () => (data === undefined ? undefined : { ...data }),
  };
}

function adminUpdate(docPath, data) {
  if (!store.has(docPath)) throw new Error(`NOT_FOUND: ${docPath}`);
  store.set(docPath, { ...store.get(docPath), ...data });
}

function adminQuery(collectionPath, filters = [], limit) {
  const run = () => {
    const prefix = `${collectionPath}/`;
    const docs = [];
    for (const docPath of store.keys()) {
      if (!docPath.startsWith(prefix) || docPath.slice(prefix.length).includes('/')) continue;
      const data = store.get(docPath);
      if (filters.every(filter => data[filter.field] === filter.value)) docs.push(adminSnapshot(docPath));
    }
    return limit === undefined ? docs : docs.slice(0, limit);
  };

  return {
    where: (field, op, value) => {
      assert.equal(op, '==');
      return adminQuery(collectionPath, [...filters, { field, value }], limit);
    },
    limit: n => adminQuery(collectionPath, filters, n),
    count: () => ({ get: async () => ({ data: () => ({ count: run().length }) }) }),
    get: async () => {
      const docs = run();
      return { docs, empty: docs.length === 0, size: docs.length };
    },
  };
}

function adminDoc(docPath) {
  return {
    __path: docPath,
    id: docPath.split('/').pop(),
    collection: name => adminCollection(`${docPath}/${name}`),
    get: async () => adminSnapshot(docPath),
    update: async data => {
      admin.directWrites.push(docPath);
      adminUpdate(docPath, data);
    },
    set: async data => {
      admin.directWrites.push(docPath);
      store.set(docPath, { ...data });
    },
    delete: async () => {
      admin.directWrites.push(docPath);
      store.delete(docPath);
    },
  };
}

function adminCollection(collectionPath) {
  return { ...adminQuery(collectionPath), doc: id => adminDoc(`${collectionPath}/${id}`) };
}

const adminDb = {
  collection: name => adminCollection(name),
  batch() {
    const ops = [];
    return {
      update: (ref, data) => ops.push(() => adminUpdate(ref.__path, data)),
      async commit() {
        ops.forEach(op => op());
      },
    };
  },
  async runTransaction(updateFunction) {
    admin.transactions += 1;
    const writes = [];
    const transaction = {
      get: async target => {
        assert.equal(writes.length, 0, 'transactions must read before they write');
        return target.get();
      },
      update: (ref, data) => writes.push(() => adminUpdate(ref.__path, data)),
      set: (ref, data) => writes.push(() => store.set(ref.__path, { ...data })),
      delete: ref => writes.push(() => store.delete(ref.__path)),
    };
    const result = await updateFunction(transaction);
    writes.forEach(write => write());
    return result;
  },
};

const previousLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request.endsWith('/firebase-admin')) return { db: adminDb, auth: {}, storage: {}, default: {} };
  if (request === 'next/server') {
    return { NextResponse: { json: (body, init) => Response.json(body, init) } };
  }
  return previousLoad.call(this, request, parent, isMain);
};

const firestoreMock = require('firebase/firestore');
const usageClientMock = require('../app/lib/usageClient');

const { saveBusinessCard, setPrimaryCard, canCreateCard, createUserDocument } = load('app/lib/firebaseOperations.ts');
const { syncUsage } = load('app/lib/entitlements.ts');
const { syncCardActiveStatus } = load('app/lib/adminCards.ts');
const { reserveUsername, resolveUsername, UsernameUnavailableError } = load('app/lib/usernames.ts');
const { lookupPrimaryCard, lookupCardBySlug } = load('app/lib/publicCardLookup.ts');
const primaryRoute = load('app/api/c/[username]/route.ts');
const cardSlugRoute = load('app/api/c/[username]/[cardSlug]/route.ts');

const user = { uid: 'u1', email: 'ada@example.com', getIdToken: async () => 'token' };
const ts = millis => ({ toMillis: () => millis });

function cardInput(overrides = {}) {
  return {
    description: 'Work',
    firstName: 'Ada',
    lastName: 'Lovelace',
    jobTitle: 'Engineer',
    company: 'Analytical',
    phoneNumber: '',
    email: 'ada@example.com',
    aboutMe: '',
    linkedIn: '',
    twitter: '',
    customMessage: '',
    cardSlug: 'work',
    prefix: '',
    credentials: '',
    pronouns: '',
    facebookUrl: '',
    instagramUrl: '',
    isPrimary: false,
    isActive: false,
    ...overrides,
  };
}

function seedOwner(data) {
  seed('users/u1', {
    isPro: false,
    isProType: 'free',
    username: 'alice',
    primaryCardId: 'alice',
    primaryCardPlaceholder: false,
    cardCount: 0,
    contactCount: 0,
    ...data,
  });
}

beforeEach(() => {
  clear();
  admin.transactions = 0;
  admin.directWrites = [];
});

// --- B1: usage accounting -------------------------------------------------

test('syncUsage recounts in a transaction and a deleted main card is no exception to the limit', async () => {
  seed('users/u9', { isPro: false, primaryCardPlaceholder: true, primaryCardId: null, cardCount: 0, contactCount: 7 });
  seed('users/u9/businessCards/work', { isPrimary: false, isActive: false });
  seed('users/u9/businessCards/side', { isPrimary: false, isActive: false });
  seed('users/u9/contacts/c1', { name: 'Grace' });

  const usage = await syncUsage('u9');

  assert.equal(usage.cardCount, 2);
  assert.equal(usage.contactCount, 1);
  assert.equal(usage.canCreateCard, false);
  assert.equal(usage.canCreateContact, true);
  assert.equal(get('users/u9').cardCount, 2);
  assert.equal(get('users/u9').contactCount, 1);
  assert.equal(admin.transactions, 1);
  assert.deepEqual(admin.directWrites, [], 'the totals are written inside the transaction');

  // With no cards left, the main card can be recreated.
  store.delete('users/u9/businessCards/work');
  store.delete('users/u9/businessCards/side');
  assert.equal((await syncUsage('u9')).canCreateCard, true);
});

test('offline, canCreateCard counts cards the way the rules do, placeholder or not', async t => {
  seedOwner({ primaryCardPlaceholder: true, primaryCardId: null });
  seed('users/u1/businessCards/work', { isPrimary: false, isActive: false });
  t.mock.method(usageClientMock, 'syncUsage', async () => null);

  assert.equal(await canCreateCard('u1'), false);
});

// --- B2: changing the main card -------------------------------------------

test('setPrimaryCard clears the placeholder and demotes every stale primary', async () => {
  seedOwner({ primaryCardPlaceholder: true, primaryCardId: null, cardCount: 3 });
  seed('users/u1/businessCards/old', { cardSlug: 'old', isPrimary: true, isActive: true });
  seed('users/u1/businessCards/older', { cardSlug: 'older', isPrimary: true, isActive: true });
  seed('users/u1/businessCards/work', { cardSlug: 'work', isPrimary: false, isActive: false });

  await setPrimaryCard('u1', 'work');

  assert.equal(get('users/u1').primaryCardId, 'work');
  assert.equal(get('users/u1').primaryCardPlaceholder, false);
  assert.deepEqual(
    ['work', 'old', 'older'].map(id => {
      const { isPrimary, isActive } = get(`users/u1/businessCards/${id}`);
      return { id, isPrimary, isActive };
    }),
    [
      { id: 'work', isPrimary: true, isActive: true },
      { id: 'old', isPrimary: false, isActive: false },
      { id: 'older', isPrimary: false, isActive: false },
    ]
  );

  // The next card is an extra card, not a silent new primary at the handle.
  setUsage({ isPro: true, canCreateCard: true });
  const next = await saveBusinessCard(user, cardInput({ cardSlug: 'next' }));
  assert.equal(next.cardSlug, 'next');
  assert.equal(get('users/u1/businessCards/next').isPrimary, false);
  assert.equal(get('users/u1').primaryCardId, 'work');
});

test('setPrimaryCard does not touch a primaryCardId whose card is gone', async () => {
  seedOwner({ isPro: true, primaryCardId: 'gone', cardCount: 1 });
  seed('users/u1/businessCards/work', { cardSlug: 'work', isPrimary: false, isActive: true });

  await setPrimaryCard('u1', 'work');

  assert.equal(get('users/u1/businessCards/gone'), undefined);
  assert.equal(get('users/u1/businessCards/work').isPrimary, true);
  assert.equal(get('users/u1').primaryCardId, 'work');
});

// --- B3: plan changes -----------------------------------------------------

test('syncCardActiveStatus takes primacy from the owner document, not the cards', async () => {
  seed('users/u9', { isPro: false, primaryCardId: 'main' });
  seed('users/u9/businessCards/main', { isPrimary: false, isActive: false });
  seed('users/u9/businessCards/extra', { isPrimary: true, isActive: true });

  await syncCardActiveStatus('u9');

  assert.deepEqual(
    { isPrimary: get('users/u9/businessCards/main').isPrimary, isActive: get('users/u9/businessCards/main').isActive },
    { isPrimary: true, isActive: true }
  );
  assert.deepEqual(
    { isPrimary: get('users/u9/businessCards/extra').isPrimary, isActive: get('users/u9/businessCards/extra').isActive },
    { isPrimary: false, isActive: false }
  );

  // The plan is read from the account, not taken from the caller.
  seed('users/u9', { isPro: true, primaryCardId: 'main' });
  await syncCardActiveStatus('u9');
  assert.equal(get('users/u9/businessCards/extra').isActive, true);
  assert.equal(get('users/u9/businessCards/extra').isPrimary, false);
});

// --- B4 / B11: public lookups ---------------------------------------------

function seedPublicOwner(ownerData = {}) {
  seed('usernames/jordan', { uid: 'u9' });
  seed('users/u9', { isPro: false, username: 'jordan', primaryCardId: 'jordan', primaryCardPlaceholder: false, ...ownerData });
  seed('users/u9/businessCards/jordan', { firstName: 'Jordan', cardSlug: 'jordan', isPrimary: true, isActive: true });
  seed('users/u9/businessCards/work', { firstName: 'Jordan', cardSlug: 'work', isPrimary: true, isActive: true });
}

function params(value) {
  return { params: Promise.resolve(value) };
}

test('a free owner\'s extra card is not public even when its own flags say it is', async () => {
  seedPublicOwner();

  assert.deepEqual(await lookupCardBySlug('jordan', 'work'), { found: false, error: 'Business card not found' });
  assert.equal((await lookupCardBySlug('jordan', 'jordan')).found, true);

  const response = await cardSlugRoute.GET(new Request('https://example.test'), params({ username: 'jordan', cardSlug: 'work' }));
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: 'Business card not found',
    user: { primaryCardId: null, primaryCardPlaceholder: false },
  });
});

test('a Pro owner publishes every active card, never a switched-off one', async () => {
  seedPublicOwner({ isPro: true });

  const response = await cardSlugRoute.GET(new Request('https://example.test'), params({ username: 'jordan', cardSlug: 'work' }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const body = await response.json();
  assert.deepEqual(Object.keys(body), ['card']);
  assert.equal(body.card.cardSlug, 'work');
  assert.equal(body.card.isPro, true);

  seed('users/u9/businessCards/work', { firstName: 'Jordan', cardSlug: 'work', isActive: false });
  assert.equal((await lookupCardBySlug('jordan', 'work')).found, false);
});

test('the public API keeps its response shapes', async () => {
  seedPublicOwner();

  const primary = await primaryRoute.GET(new Request('https://example.test'), params({ username: 'jordan' }));
  assert.equal(primary.status, 200);
  assert.equal(primary.headers.get('Cache-Control'), 'no-store');
  const body = await primary.json();
  assert.deepEqual(body.user, { isPro: false, primaryCardId: 'jordan', primaryCardPlaceholder: false });
  assert.equal(body.card.id, 'jordan');
  assert.equal(body.card.firstName, 'Jordan');

  const unknown = await primaryRoute.GET(new Request('https://example.test'), params({ username: 'nobody' }));
  assert.equal(unknown.status, 404);
  assert.deepEqual(await unknown.json(), { error: 'User not found' });

  const unknownSlug = await cardSlugRoute.GET(new Request('https://example.test'), params({ username: 'nobody', cardSlug: 'x' }));
  assert.equal(unknownSlug.status, 404);
  assert.deepEqual(await unknownSlug.json(), {
    error: 'User not found',
    user: { primaryCardId: null, primaryCardPlaceholder: false },
  });

  seed('users/u9/businessCards/jordan', { firstName: 'Jordan', isActive: false });
  assert.deepEqual(await lookupPrimaryCard('jordan'), { found: false, error: 'Primary card not found' });
  const off = await primaryRoute.GET(new Request('https://example.test'), params({ username: 'jordan' }));
  assert.equal(off.status, 404);
  assert.deepEqual(await off.json(), { error: 'Primary card not found' });
});

// --- B6: usernames --------------------------------------------------------

test('reserveUsername refuses a legacy handle another account still holds', async () => {
  seed('users/legacy', { username: 'jordan', createdAt: ts(1) });
  seed('users/u1', { username: 'alice' });
  seed('usernames/alice', { uid: 'u1' });

  await assert.rejects(() => reserveUsername('u1', 'jordan'), UsernameUnavailableError);
  assert.equal(get('usernames/jordan'), undefined);
  assert.equal(get('users/u1').username, 'alice');
  assert.deepEqual(get('usernames/alice'), { uid: 'u1' });

  // Its owner can still reserve it, and anyone can take a free handle.
  await reserveUsername('legacy', 'jordan');
  assert.equal(get('usernames/jordan').uid, 'legacy');

  await reserveUsername('u1', 'ada-l');
  assert.equal(get('users/u1').username, 'ada-l');
  assert.equal(get('usernames/ada-l').uid, 'u1');
  assert.equal(get('usernames/alice'), undefined);
});

test('resolveUsername hands an unreserved legacy handle to the oldest account', async () => {
  seed('users/b-newer', { username: 'jordan', createdAt: ts(2000) });
  seed('users/a-undated', { username: 'jordan' });
  seed('users/d-registered', { username: 'jordan', registeredAt: ts(1500) });
  seed('users/c-oldest', { username: 'jordan', createdAt: ts(1000) });

  assert.equal(await resolveUsername('jordan'), 'c-oldest');
  assert.equal(get('usernames/jordan').uid, 'c-oldest');

  // Equal dates fall back to the uid, so the answer never depends on query order.
  seed('users/zz', { username: 'tied', createdAt: ts(5) });
  seed('users/aa', { username: 'tied', createdAt: ts(5) });
  assert.equal(await resolveUsername('tied'), 'aa');
});

// --- B7: account documents ------------------------------------------------

function mockUsernameServer(t, username) {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, '/api/generate-username');
    // Like reserveUsername: the server writes the handle into an existing document.
    if (store.has('users/u1')) store.set('users/u1', { ...store.get('users/u1'), username });
    return { ok: true, json: async () => ({ username }) };
  });
}

test('createUserDocument repairs an account document a failed sign-up left incomplete', async t => {
  seed('users/u1', { email: 'ada@example.com', updatedAt: new Date() });
  mockUsernameServer(t, 'fresh1');
  t.mock.method(firestoreMock, 'updateDoc');
  const creationTime = 'Tue, 01 Sep 2026 10:00:00 GMT';

  await createUserDocument({ ...user, metadata: { creationTime } });

  const repaired = get('users/u1');
  assert.equal(repaired.username, 'fresh1');
  assert.equal(repaired.primaryCardId, 'fresh1');
  assert.equal(repaired.primaryCardPlaceholder, true);

  // The client only ever writes fields the rules let it write, and dates the
  // account by its sign-up (the helper's store flattens Dates, so read the write).
  const [call] = firestoreMock.updateDoc.mock.calls;
  const written = call.arguments[1];
  assert.deepEqual(Object.keys(written).sort(), ['createdAt', 'primaryCardId', 'primaryCardPlaceholder', 'updatedAt']);
  assert.equal(written.createdAt.getTime(), Date.parse(creationTime));
});

test('createUserDocument leaves a complete account alone and never dates one "now"', async t => {
  seedOwner({ createdAt: ts(1) });
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('should not be called');
  });
  const updateMock = t.mock.method(firestoreMock, 'updateDoc');

  await createUserDocument({ ...user, metadata: { creationTime: 'Tue, 01 Sep 2026 10:00:00 GMT' } });
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(updateMock.mock.callCount(), 0);

  // A missing createdAt with no usable sign-up time is left missing.
  seed('users/u1', { username: 'alice', primaryCardId: 'alice', primaryCardPlaceholder: false });
  await createUserDocument({ ...user, metadata: {} });
  assert.equal(updateMock.mock.callCount(), 0);
  assert.equal(get('users/u1').createdAt, undefined);
});

test('a failed account create keeps the affiliate source for the retry', async t => {
  const saved = new Map([['helix_source', JSON.stringify({ source: 'partner1', timestamp: Date.now() })]]);
  globalThis.window = { location: { search: '?source=partner1' } };
  globalThis.localStorage = {
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: key => saved.delete(key),
  };
  t.after(() => {
    delete globalThis.window;
    delete globalThis.localStorage;
  });
  mockUsernameServer(t, 'fresh2');

  const setDocMock = t.mock.method(firestoreMock, 'setDoc', async () => {
    throw new Error('Missing or insufficient permissions.');
  });
  await assert.rejects(() => createUserDocument(user), /insufficient permissions/);
  assert.ok(saved.has('helix_source'));

  setDocMock.mock.restore();
  await createUserDocument(user);
  assert.equal(get('users/u1').source, 'partner1');
  assert.equal(get('users/u1').username, 'fresh2');
  assert.equal(saved.has('helix_source'), false);
});

// --- B7 / B8: creating cards ----------------------------------------------

test('creating a card before the account document exists says what to do', async () => {
  await assert.rejects(() => saveBusinessCard(user, cardInput()), /still being set up/);
});

test('a new card never overwrites an existing one on a slug collision, and uses quota', async () => {
  seedOwner({ isPro: true, cardCount: 2 });
  seed('users/u1/businessCards/alice', { firstName: 'Ada', cardSlug: 'alice', isPrimary: true, isActive: true });
  const existing = {
    firstName: 'Existing',
    cardSlug: 'work',
    isPrimary: false,
    isActive: true,
    imageUrl: 'https://storage.example/images/u1/existing.png',
  };
  seed('users/u1/businessCards/work', existing);

  const result = await saveBusinessCard(user, cardInput({ cardSlug: 'work', firstName: 'New' }));

  assert.notEqual(result.cardSlug, 'work');
  assert.deepEqual(get('users/u1/businessCards/work'), existing);
  assert.deepEqual(deletedStoragePaths, []);
  const created = get(`users/u1/businessCards/${result.cardSlug}`);
  assert.equal(created.firstName, 'New');
  assert.equal(created.cardSlug, result.cardSlug);
  assert.equal(created.isPrimary, false);
  assert.equal(get('users/u1').cardCount, 3);
  assert.equal(get('users/u1').primaryCardId, 'alice');
  assert.equal(result.cardUrl, `https://www.helixcard.app/c/alice/${result.cardSlug}`);
});

test('a first card whose handle is already a card id takes a fresh slug and is still primary', async () => {
  seedOwner({ isPro: true, primaryCardPlaceholder: true, primaryCardId: null, cardCount: 1 });
  const existing = { firstName: 'Stale', cardSlug: 'alice', isPrimary: false, isActive: true };
  seed('users/u1/businessCards/alice', existing);

  const result = await saveBusinessCard(user, cardInput());

  assert.notEqual(result.cardSlug, 'alice');
  assert.deepEqual(get('users/u1/businessCards/alice'), existing);
  const created = get(`users/u1/businessCards/${result.cardSlug}`);
  assert.equal(created.isPrimary, true);
  assert.equal(created.isActive, true);
  const owner = get('users/u1');
  assert.equal(owner.primaryCardId, result.cardSlug);
  assert.equal(owner.primaryCardPlaceholder, false);
  assert.equal(owner.cardCount, 2);
  assert.equal(result.cardUrl, 'https://www.helixcard.app/c/alice');
});

test('card creation gives up rather than overwrite when every slug it tries is taken', async t => {
  seedOwner({ isPro: true, cardCount: 3 });
  seed('users/u1/businessCards/alice', { firstName: 'Main', cardSlug: 'alice', isPrimary: true });
  seed('users/u1/businessCards/work', { firstName: 'Existing', cardSlug: 'work' });
  // Math.random() === 0.5 always yields the slug "i".
  seed('users/u1/businessCards/i', { firstName: 'Existing', cardSlug: 'i' });
  t.mock.method(Math, 'random', () => 0.5);

  await assert.rejects(() => saveBusinessCard(user, cardInput({ cardSlug: 'work' })), /Could not create a link/);
  assert.equal(get('users/u1/businessCards/work').firstName, 'Existing');
  assert.equal(get('users/u1/businessCards/i').firstName, 'Existing');
  assert.equal(get('users/u1').cardCount, 3);
});

test('a primaryCardId naming a deleted card lets the next new card become the main card', async () => {
  // Deleted without the placeholder being set, so /c/alice had nothing to show.
  seedOwner({ primaryCardId: 'gone', primaryCardPlaceholder: false });

  const result = await saveBusinessCard(user, cardInput({ cardSlug: 'work' }));

  assert.equal(result.cardSlug, 'alice');
  assert.equal(get('users/u1/businessCards/alice').isPrimary, true);
  assert.equal(get('users/u1/businessCards/alice').isActive, true);
  assert.equal(get('users/u1').primaryCardId, 'alice');
  assert.equal(get('users/u1').primaryCardPlaceholder, false);
});

test('a CV of exactly 5 MiB is refused before upload, as Storage would refuse it', async () => {
  seedOwner({ primaryCardPlaceholder: true });

  await assert.rejects(
    () => saveBusinessCard(user, cardInput(), { type: 'application/pdf', size: 5 * 1024 * 1024, name: 'cv.pdf' }),
    /smaller than 5MB/
  );
  assert.equal(get('users/u1/businessCards/alice'), undefined);
});
