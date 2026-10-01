const { beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
// The real Admin SDK Timestamp: its valueOf() returns a string, which is what
// made `new Date(timestamp)` print "Invalid Date" in every export.
const { Timestamp } = require('firebase-admin/firestore');

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
  uid: 'user-1',
  docs: new Map(),
  queriedCollections: [],
  quotaCalls: [],
  quotaResult: { allowed: true, retryAfterSeconds: 0 },
  sentEmails: [],
};

function listDocs(collectionPath) {
  const prefix = `${collectionPath}/`;
  return [...state.docs]
    .filter(([docPath]) => docPath.startsWith(prefix) && !docPath.slice(prefix.length).includes('/'))
    .map(([docPath, data]) => ({ id: docPath.slice(prefix.length), data: () => data }));
}

const auth = {
  async verifyIdToken(token) {
    if (token !== 'valid-token') throw new Error('invalid token');
    return { uid: state.uid };
  },
};

const db = {
  collection(collectionPath) {
    state.queriedCollections.push(collectionPath);
    return {
      where(field, op, ids) {
        assert.equal(String(field), '__name__');
        assert.equal(op, 'in');
        assert.ok(ids.length <= 30, 'Firestore allows at most 30 values in an `in` query');
        return { get: async () => ({ docs: listDocs(collectionPath).filter(doc => ids.includes(doc.id)) }) };
      },
      get: async () => ({ docs: listDocs(collectionPath) }),
    };
  },
};

class NextResponse extends Response {
  static json(body, init) {
    return Response.json(body, init);
  }
}

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === 'next/server') return { NextResponse };
  if (request === '@/app/lib/firebase-admin') return { auth, db };
  if (request === '@/app/lib/usageQuota') {
    return {
      consumeQuota: async rules => {
        state.quotaCalls.push(rules);
        return state.quotaResult;
      },
    };
  }
  if (request === '@/app/lib/resend') {
    const { textAttachment } = originalLoad(path.join(ROOT, 'app/lib/resend.ts'), parent, isMain);
    return { textAttachment, sendEmail: async options => { state.sentEmails.push(options); } };
  }
  if (request.startsWith('@/')) {
    return originalLoad(path.join(ROOT, request.slice(2)), parent, isMain);
  }
  return originalLoad(request, parent, isMain);
};

const { POST } = require(path.join(ROOT, 'app/api/contacts/export/route.ts'));

function exportRequest(body, token = 'valid-token') {
  return new Request('https://www.helixcard.app/api/contacts/export', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'me@example.com', timeZone: 'UTC', ...body }),
  });
}

function seedContact(id, data, uid = state.uid) {
  state.docs.set(`users/${uid}/contacts/${id}`, { tags: [], ...data });
}

/** Decode the emailed attachment into its raw bytes and parsed rows. */
function sentCsv() {
  assert.equal(state.sentEmails.length, 1);
  const [attachment] = state.sentEmails[0].attachments;
  const bytes = Buffer.from(attachment.content, 'base64');
  const text = bytes.toString('utf8').replace(/^﻿/, '');
  const [header, ...rows] = text.split('\n').map(line => (
    line.startsWith('"')
      ? [...line.matchAll(/"((?:[^"]|"")*)"/g)].map(match => match[1].replace(/""/g, '"'))
      : line.split(',')
  ));
  const column = name => header.indexOf(name);
  return { bytes, header, rows, column };
}

const jan15 = Timestamp.fromMillis(Date.UTC(2026, 0, 15, 3, 30)); // 14 Jan in Los Angeles
const feb1 = Timestamp.fromMillis(Date.UTC(2026, 1, 1, 12, 0));

beforeEach(() => {
  process.env.RESEND_API_KEY = 'resend-key';
  state.docs.clear();
  state.queriedCollections = [];
  state.quotaCalls = [];
  state.quotaResult = { allowed: true, retryAfterSeconds: 0 };
  state.sentEmails = [];
});

test('dates come from Timestamps and are written in the exporter\'s time zone', async () => {
  seedContact('c1', { name: 'Ada Lovelace', dateAdded: jan15, dateModified: feb1 });

  const response = await POST(exportRequest({ contactIds: ['c1'], timeZone: 'America/Los_Angeles' }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  const { rows, column } = sentCsv();
  assert.equal(rows[0][column('Date Added')], '1/14/2026');
  assert.equal(rows[0][column('Date Modified')], '2/1/2026');
});

test('an unknown time zone falls back to UTC instead of failing the export', async () => {
  seedContact('c1', { name: 'Ada Lovelace', dateAdded: jan15, dateModified: jan15 });

  const response = await POST(exportRequest({ contactIds: ['c1'], timeZone: 'Mars/Olympus_Mons' }));

  assert.equal(response.status, 200);
  const { rows, column } = sentCsv();
  assert.equal(rows[0][column('Date Added')], '1/15/2026');
});

test('legacy ISO-string dates still format, and rows are newest-modified first', async () => {
  seedContact('old', { name: 'Legacy Row', dateAdded: '2024-12-05T10:00:00.000Z', dateModified: '2024-12-05T10:00:00.000Z' });
  seedContact('new', { name: 'Recent Row', dateAdded: jan15, dateModified: feb1 });

  await POST(exportRequest({ contactIds: ['old', 'new'] }));

  const { rows, column } = sentCsv();
  assert.deepEqual(rows.map(row => row[column('Full Name')]), ['Recent Row', 'Legacy Row']);
  assert.equal(rows[1][column('Date Added')], '12/5/2024');
});

test('the tags column lists tag names and skips deleted tags', async () => {
  state.docs.set('users/user-1/tags/t1', { name: 'VIP' });
  state.docs.set('users/user-1/tags/t2', { name: 'Conference 2026' });
  seedContact('c1', { name: 'Ada Lovelace', tags: ['t1', 'deleted', 't2'], dateAdded: jan15, dateModified: jan15 });

  await POST(exportRequest({ contactIds: ['c1'] }));

  const { rows, column } = sentCsv();
  assert.equal(rows[0][column('Tags')], 'VIP, Conference 2026');
});

test('the CSV starts with a UTF-8 byte order mark so Excel keeps accented names', async () => {
  seedContact('c1', { name: 'Zoë Ångström', dateAdded: jan15, dateModified: jan15 });

  await POST(exportRequest({ contactIds: ['c1'] }));

  const { bytes, rows, column } = sentCsv();
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.equal(rows[0][column('Full Name')], 'Zoë Ångström');
  assert.match(state.sentEmails[0].attachments[0].filename, /^helix-contacts-export-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.equal(state.sentEmails[0].to, 'me@example.com');
  assert.equal(state.sentEmails[0].subject, 'Your Helix Contacts Export');
});

test('only the caller\'s own contacts are read, in chunks Firestore accepts', async () => {
  seedContact('shared-id', { name: 'Mine', dateAdded: jan15, dateModified: jan15 });
  seedContact('shared-id', { name: 'Someone Else', dateAdded: jan15, dateModified: jan15 }, 'user-2');
  seedContact('theirs', { name: 'Also Someone Else', dateAdded: jan15, dateModified: jan15 }, 'user-2');
  const manyIds = Array.from({ length: 64 }, (_, index) => `missing-${index}`);

  await POST(exportRequest({ contactIds: ['shared-id', 'theirs', ...manyIds] }));

  const { rows, column } = sentCsv();
  assert.deepEqual(rows.map(row => row[column('Full Name')]), ['Mine']);
  assert.ok(state.queriedCollections.every(collection => collection.startsWith('users/user-1/')));
});

test('each export is charged to the caller\'s own quota, and a spent quota sends nothing', async () => {
  seedContact('c1', { name: 'Ada Lovelace', dateAdded: jan15, dateModified: jan15 });

  await POST(exportRequest({ contactIds: ['c1'] }));
  assert.equal(state.quotaCalls.length, 1);
  assert.ok(state.quotaCalls[0].length > 0);
  assert.ok(state.quotaCalls[0].every(rule => rule.key.includes('user-1') && rule.limit > 0));

  state.sentEmails = [];
  state.quotaResult = { allowed: false, retryAfterSeconds: 120 };
  const response = await POST(exportRequest({ contactIds: ['c1'] }));

  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '120');
  assert.match((await response.json()).error, /try again later/i);
  assert.equal(state.sentEmails.length, 0);
});

test('bad requests are refused before any quota is spent or email sent', async () => {
  seedContact('c1', { name: 'Ada Lovelace', dateAdded: jan15, dateModified: jan15 });

  const badEmail = await POST(exportRequest({ contactIds: ['c1'], email: 'not-an-email' }));
  assert.equal(badEmail.status, 400);
  assert.match((await badEmail.json()).error, /valid email/);

  const noContacts = await POST(exportRequest({ contactIds: [] }));
  assert.equal(noContacts.status, 400);

  const badToken = await POST(exportRequest({ contactIds: ['c1'] }, 'forged-token'));
  assert.equal(badToken.status, 401);

  assert.equal(state.quotaCalls.length, 0);
  assert.equal(state.sentEmails.length, 0);
});
