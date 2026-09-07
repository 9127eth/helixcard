/**
 * Load app TypeScript modules against an in-memory Firestore.
 *
 * Card and contact writes are gated by Firebase plus `/api/usage`. These
 * helpers stand in for both so the real create/update/delete functions can
 * run in `node --test` without emulators or a browser.
 */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('module');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..', '..');

if (!require.extensions['.ts']) {
  require.extensions['.ts'] = (module, filename) => {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText, filename);
  };
}

const store = new Map();
let autoId = 0;
let usageState = defaultUsage();
const deletedStoragePaths = [];
const uploadedStoragePaths = [];

const auth = {
  currentUser: { uid: 'u1', getIdToken: async () => 'token' },
};

const firebase = { db: { __memory: true }, storage: { __memory: true }, auth };

function defaultUsage() {
  return {
    isPro: false,
    cardCount: 0,
    contactCount: 0,
    cardLimit: 1,
    contactLimit: 2,
    canCreateCard: true,
    canCreateContact: true,
  };
}

function applySentinels(value) {
  if (!value || typeof value !== 'object') return value;
  if (value.__op === 'increment') return value.n;
  if (value.__op === 'serverTimestamp') return new Date();
  if (value.__op === 'deleteField') return undefined;
  if (Array.isArray(value)) return value.map(applySentinels);
  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    const next = applySentinels(entry);
    if (next !== undefined) result[key] = next;
  }
  return result;
}

function applyUpdate(current, updates) {
  const next = { ...(current || {}) };
  for (const [key, value] of Object.entries(updates)) {
    if (value && value.__op === 'increment') {
      next[key] = (typeof next[key] === 'number' ? next[key] : 0) + value.n;
    } else if (value && value.__op === 'serverTimestamp') {
      next[key] = new Date();
    } else if (value && value.__op === 'deleteField') {
      delete next[key];
    } else {
      next[key] = applySentinels(value);
    }
  }
  return next;
}

function isRef(value) {
  return value && typeof value === 'object' && typeof value.__path === 'string';
}

function childPath(first, rest) {
  if (isRef(first)) return [first.__path, ...rest].filter(Boolean).join('/');
  return rest.filter(Boolean).join('/');
}

function snapshot(docRef) {
  const data = store.get(docRef.__path);
  const existsValue = data !== undefined;
  const exists = () => existsValue;
  exists.valueOf = () => existsValue;
  return {
    exists,
    data: () => data,
    id: docRef.__path.split('/').pop(),
    ref: docRef,
  };
}

function listCollection(collectionPath, constraints = []) {
  const prefix = `${collectionPath}/`;
  let docs = [];
  for (const [docPath, data] of store) {
    if (!docPath.startsWith(prefix)) continue;
    if (docPath.slice(prefix.length).includes('/')) continue;
    docs.push({
      id: docPath.slice(prefix.length),
      ref: { __path: docPath, __type: 'doc' },
      data: () => data,
      exists: () => true,
    });
  }

  for (const constraint of constraints) {
    if (!constraint || constraint.__type !== 'where') continue;
    docs = docs.filter(doc => {
      const value = doc.data()[constraint.field];
      if (constraint.op === '==') return value === constraint.value;
      if (constraint.op === 'array-contains') {
        return Array.isArray(value) && value.includes(constraint.value);
      }
      if (constraint.op === 'array-contains-any') {
        return Array.isArray(value) && constraint.value.some(item => value.includes(item));
      }
      return true;
    });
  }

  const order = constraints.find(constraint => constraint && constraint.__type === 'orderBy');
  if (order) {
    docs.sort((left, right) => {
      const a = left.data()[order.field];
      const b = right.data()[order.field];
      if (a < b) return order.dir === 'desc' ? 1 : -1;
      if (a > b) return order.dir === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return docs;
}

const firestore = {
  doc(first, ...rest) {
    if (isRef(first) && first.__type === 'collection' && rest.length === 0) {
      autoId += 1;
      const id = `doc-${autoId}`;
      return { __path: `${first.__path}/${id}`, __type: 'doc', id };
    }
    const docPath = childPath(first, rest);
    return { __path: docPath, __type: 'doc', id: docPath.split('/').pop() };
  },
  collection(first, ...rest) {
    return { __path: childPath(first, rest), __type: 'collection' };
  },
  async getDoc(docRef) {
    return snapshot(docRef);
  },
  async getDocs(queryOrCollection) {
    const docs = listCollection(queryOrCollection.__path, queryOrCollection.__constraints || []);
    return { docs, empty: docs.length === 0, size: docs.length };
  },
  query(refOrQuery, ...constraints) {
    return {
      __path: refOrQuery.__path,
      __type: 'query',
      __constraints: [...(refOrQuery.__constraints || []), ...constraints],
    };
  },
  where(field, op, value) {
    return { __type: 'where', field, op, value };
  },
  orderBy(field, dir = 'asc') {
    return { __type: 'orderBy', field, dir };
  },
  increment(n) {
    return { __op: 'increment', n };
  },
  serverTimestamp() {
    return { __op: 'serverTimestamp' };
  },
  deleteField() {
    return { __op: 'deleteField' };
  },
  writeBatch() {
    const ops = [];
    return {
      set(docRef, data) {
        ops.push({ type: 'set', path: docRef.__path, data });
      },
      update(docRef, data) {
        ops.push({ type: 'update', path: docRef.__path, data });
      },
      delete(docRef) {
        ops.push({ type: 'delete', path: docRef.__path });
      },
      async commit() {
        for (const op of ops) {
          if (op.type === 'set') store.set(op.path, applySentinels(op.data));
          if (op.type === 'update') store.set(op.path, applyUpdate(store.get(op.path), op.data));
          if (op.type === 'delete') store.delete(op.path);
        }
      },
    };
  },
  async setDoc(docRef, data) {
    store.set(docRef.__path, applySentinels(data));
  },
  async updateDoc(docRef, data) {
    if (!store.has(docRef.__path)) throw new Error('No document to update');
    store.set(docRef.__path, applyUpdate(store.get(docRef.__path), data));
  },
  async addDoc(collectionRef, data) {
    autoId += 1;
    const id = `doc-${autoId}`;
    const docRef = { __path: `${collectionRef.__path}/${id}`, __type: 'doc', id };
    store.set(docRef.__path, applySentinels(data));
    return docRef;
  },
  async deleteDoc(docRef) {
    store.delete(docRef.__path);
  },
  Timestamp: {
    fromDate(date) {
      return date;
    },
  },
};

const storageApi = {
  ref(_storage, storagePath) {
    return { __path: storagePath };
  },
  async uploadBytes(fileRef) {
    uploadedStoragePaths.push(fileRef.__path);
  },
  async getDownloadURL(fileRef) {
    return `https://cdn.example.com/${fileRef.__path}`;
  },
  async deleteObject(fileRef) {
    deletedStoragePaths.push(fileRef.__path);
  },
};

const usageClient = {
  async syncUsage() {
    return usageState;
  },
  refreshUsageAfterDelete() {},
};

const uploadUtils = {
  async uploadCv() {
    return 'https://cdn.example.com/docs/cv.pdf';
  },
  async uploadImage() {
    return 'https://cdn.example.com/images/photo.png';
  },
  async deleteImage() {},
};

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === 'firebase/firestore') return firestore;
  if (request === 'firebase/storage') return storageApi;
  if (request === 'firebase/auth') return { User: class User {} };
  if (request === 'uuid') return { v4: () => 'test-uuid' };

  if (request.startsWith('@/')) {
    return originalLoad(path.join(ROOT, request.slice(2)), parent, isMain);
  }

  if (request === './firebase' || request === '../lib/firebase' || request.endsWith('/firebase')) {
    if (!request.includes('firebase-admin') && !request.startsWith('firebase/')) {
      return firebase;
    }
  }

  if (request === './firebase-admin' || request.endsWith('/firebase-admin')) {
    return { db: {}, auth: {}, storage: {}, default: {} };
  }

  if (request === './usageClient' || request.endsWith('/usageClient')) {
    return usageClient;
  }

  if (request === './uploadUtils' || request.endsWith('/uploadUtils')) {
    return uploadUtils;
  }

  return originalLoad(request, parent, isMain);
};

function clear() {
  store.clear();
  autoId = 0;
  usageState = defaultUsage();
  deletedStoragePaths.length = 0;
  uploadedStoragePaths.length = 0;
  auth.currentUser = { uid: 'u1', getIdToken: async () => 'token' };
}

function seed(docPath, data) {
  store.set(docPath, { ...data });
}

function get(docPath) {
  return store.get(docPath);
}

function seedUser(uid = 'u1', data = {}) {
  const username = data.username ?? 'alice';
  seed(`users/${uid}`, {
    isPro: false,
    isProType: 'free',
    username,
    primaryCardId: username,
    primaryCardPlaceholder: true,
    cardCount: 0,
    contactCount: 0,
    ...data,
  });
}

function setUsage(partial) {
  usageState = { ...defaultUsage(), ...partial };
}

function setAuthUser(user) {
  auth.currentUser = user;
}

function load(relPath) {
  return require(path.join(ROOT, relPath));
}

module.exports = {
  clear,
  seed,
  get,
  seedUser,
  setUsage,
  setAuthUser,
  load,
  store,
  deletedStoragePaths,
  uploadedStoragePaths,
};
