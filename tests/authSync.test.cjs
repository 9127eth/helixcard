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
  authListeners: [],
  // users/{uid} documents the client SDK can see: path -> { pendingWrites }
  documents: new Map(),
  readError: null,
  fetchCalls: [],
  createUserDocumentCalls: [],
  createUserDocumentError: null,
};

const react = {
  useState: initial => [initial, () => {}],
  // Run effects on the spot so calling the hook registers its auth listener.
  useEffect: effect => {
    effect();
  },
};

const firebaseAuth = {
  onAuthStateChanged(_auth, listener) {
    state.authListeners.push(listener);
    return () => {};
  },
  async signOut() {},
};

const firestore = {
  doc(_db, ...segments) {
    return { path: segments.join('/') };
  },
  async getDoc(ref) {
    if (state.readError) throw state.readError;
    const entry = state.documents.get(ref.path);
    return {
      exists: () => entry !== undefined,
      metadata: { hasPendingWrites: Boolean(entry?.pendingWrites) },
    };
  },
};

const deviceInfo = { sourceDevice: 'desktop', sourceBrowser: 'chrome', sourcePlatform: 'web' };

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === 'react') return react;
  if (request === 'next/navigation') return { useRouter: () => ({}) };
  if (request === 'firebase/auth') return firebaseAuth;
  if (request === 'firebase/firestore') return firestore;
  if (request === '../lib/firebase') return { auth: {}, db: {} };
  if (request === '../lib/firebaseOperations') {
    return {
      async createUserDocument(user, info) {
        state.createUserDocumentCalls.push({ uid: user.uid, info });
        if (state.createUserDocumentError) throw state.createUserDocumentError;
      },
    };
  }
  if (request === '../utils/deviceDetection') return { getDeviceInfo: () => deviceInfo };
  return originalLoad(request, parent, isMain);
};

const sessionValues = new Map();
global.window = {};
global.sessionStorage = {
  getItem: key => (sessionValues.has(key) ? sessionValues.get(key) : null),
  setItem: (key, value) => sessionValues.set(key, String(value)),
  removeItem: key => sessionValues.delete(key),
};
global.fetch = async (url, init) => {
  state.fetchCalls.push({ url, init });
  return { ok: true, json: async () => ({ success: true, stripeSynced: true }) };
};

const { useAuth, ensureUserDocument } = require(path.join(ROOT, 'app/hooks/useAuth.ts'));

const user = { uid: 'new-user', email: 'New@Example.com', getIdToken: async () => 'id-token' };
const syncKey = 'helix-email-sync:new-user:new@example.com';

/** A component mounts useAuth and Firebase reports the signed-in user. */
async function authStateChanged() {
  state.authListeners.length = 0;
  useAuth();
  assert.equal(state.authListeners.length, 1);
  await state.authListeners[0](user);
  // Every stub settles in microtasks, so one macrotask lets the sync finish.
  await new Promise(resolve => setImmediate(resolve));
}

beforeEach(() => {
  state.documents.clear();
  state.readError = null;
  state.fetchCalls = [];
  state.createUserDocumentCalls = [];
  state.createUserDocumentError = null;
  sessionValues.clear();
});

test('the email sync waits for the account document instead of racing sign-up', async () => {
  await authStateChanged();

  assert.equal(state.fetchCalls.length, 0, 'no server upsert before createUserDocument has written');
  assert.equal(sessionValues.get(syncKey), undefined, 'a skipped sync is not marked done');

  state.documents.set('users/new-user', { pendingWrites: true });
  await authStateChanged();
  assert.equal(state.fetchCalls.length, 0, 'an unacknowledged create still counts as not written');

  state.documents.set('users/new-user', { pendingWrites: false });
  await authStateChanged();

  assert.equal(state.fetchCalls.length, 1);
  assert.equal(state.fetchCalls[0].url, '/api/auth/email');
  assert.equal(state.fetchCalls[0].init.headers.Authorization, 'Bearer id-token');
  assert.deepEqual(JSON.parse(state.fetchCalls[0].init.body), { type: 'sync' });
  assert.equal(sessionValues.get(syncKey), 'true');

  await authStateChanged();
  assert.equal(state.fetchCalls.length, 1, 'a finished sync is not repeated in the session');
});

test('a failed document read leaves the sync to a later auth event', async (t) => {
  t.mock.method(console, 'error', () => {});
  state.readError = new Error('client is offline');

  await authStateChanged();

  assert.equal(state.fetchCalls.length, 0);
  assert.equal(sessionValues.get(syncKey), undefined);
});

test('ensureUserDocument passes device info and never fails the sign-in', async (t) => {
  const logged = t.mock.method(console, 'error', () => {});
  state.createUserDocumentError = new Error('Missing or insufficient permissions.');

  await ensureUserDocument(user);

  assert.deepEqual(state.createUserDocumentCalls, [{ uid: 'new-user', info: deviceInfo }]);
  assert.equal(logged.mock.callCount(), 1);
});
