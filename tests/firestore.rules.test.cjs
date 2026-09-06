/**
 * Security-rule tests.
 *
 * Run against the Firestore emulator:
 *   npx firebase emulators:exec --only firestore --project helix-rules-test \
 *     "node --test tests/firestore.rules.test.cjs"
 *
 * Needs `firebase-tools` and `@firebase/rules-unit-testing` available (they are
 * not runtime dependencies):
 *   npm install --no-save firebase-tools@13 @firebase/rules-unit-testing@3
 */
const { test, before, after } = require('node:test');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const fs = require('node:fs');
const path = require('node:path');

const RULES = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'helix-rules-test',
    firestore: { rules: RULES, host: '127.0.0.1', port: 8080 },
  });
});

after(async () => {
  await env?.cleanup();
});

/** rules-unit-testing hands back a compat Firestore instance. */
function as(uid) {
  return env.authenticatedContext(uid).firestore();
}

async function seed(fn) {
  await env.withSecurityRulesDisabled(async ctx => {
    await fn(ctx.firestore());
  });
}

const CARD = {
  firstName: 'A',
  description: '',
  cardSlug: 'alice',
  webLinks: [],
  isPrimary: true,
  isActive: true,
  theme: 'classic',
};

/** A free account with a reserved handle, one primary card slot and no cards. */
async function seedFreeUser({ cardCount = 0, contactCount = 0 } = {}) {
  await env.clearFirestore();
  await seed(async admin => {
    await admin.doc('usernames/alice').set({ uid: 'u1' });
    await admin.doc('users/u1').set({
      isPro: false,
      username: 'alice',
      primaryCardId: 'alice',
      cardCount,
      contactCount,
    });
  });
}

test('a user document can only be created with a handle reserved for that account', async () => {
  await env.clearFirestore();
  const db = as('u1');

  await assertFails(db.doc('users/u1').set({ isPro: false, username: 'alice' }));

  await seed(admin => admin.doc('usernames/alice').set({ uid: 'u1' }));
  await assertSucceeds(db.doc('users/u1').set({ isPro: false, username: 'alice' }));
});

test('a handle reserved by another account cannot be claimed', async () => {
  await env.clearFirestore();
  await seed(admin => admin.doc('usernames/bob').set({ uid: 'u2' }));

  await assertFails(as('u1').doc('users/u1').set({ isPro: false, username: 'bob' }));
});

test('username, source, group and isPro are not client-writable', async () => {
  await seedFreeUser();
  const db = as('u1');

  await assertFails(db.doc('users/u1').update({ username: 'someoneelse' }));
  await assertFails(db.doc('users/u1').update({ source: 'LIPSCOMB' }));
  await assertFails(db.doc('users/u1').update({ group: 'lipscomb' }));
  await assertFails(db.doc('users/u1').update({ isPro: true }));
  await assertSucceeds(db.doc('users/u1').update({ primaryCardPlaceholder: false }));
});

test('usage counters can only be raised by one, and never lowered', async () => {
  await seedFreeUser({ cardCount: 1, contactCount: 2 });
  const db = as('u1');

  await assertFails(db.doc('users/u1').update({ contactCount: 0 }));
  await assertFails(db.doc('users/u1').update({ contactCount: 5 }));
  await assertFails(db.doc('users/u1').update({ cardCount: 0 }));
  await assertSucceeds(db.doc('users/u1').update({ contactCount: 3 }));
});

test('a free account gets one card and the second is refused', async () => {
  await seedFreeUser();
  const db = as('u1');

  const first = db.batch();
  first.set(db.doc('users/u1/businessCards/alice'), CARD);
  first.update(db.doc('users/u1'), { cardCount: 1 });
  await assertSucceeds(first.commit());

  const second = db.batch();
  second.set(db.doc('users/u1/businessCards/second'), {
    ...CARD, cardSlug: 'second', isPrimary: false, isActive: false,
  });
  second.update(db.doc('users/u1'), { cardCount: 2 });
  await assertFails(second.commit());
});

test('a card create that does not pay for its quota is refused', async () => {
  await seedFreeUser();
  await assertFails(as('u1').doc('users/u1/businessCards/alice').set(CARD));
});

test('a free account cannot forge isActive or isPrimary', async () => {
  await seedFreeUser({ cardCount: 1 });
  await seed(admin =>
    admin.doc('users/u1/businessCards/extra').set({
      ...CARD, cardSlug: 'extra', isPrimary: false, isActive: false,
    })
  );

  const card = as('u1').doc('users/u1/businessCards/extra');
  await assertFails(card.update({ isActive: true }));
  await assertFails(card.update({ isPrimary: true }));
  await assertSucceeds(card.update({ jobTitle: 'Dev' }));
});

test('non-http link schemes are rejected on cards', async () => {
  await seedFreeUser({ cardCount: 1 });
  await seed(admin => admin.doc('users/u1/businessCards/alice').set(CARD));

  const card = as('u1').doc('users/u1/businessCards/alice');
  await assertFails(card.update({ linkedIn: 'javascript:alert(1)' }));
  await assertFails(card.update({ cvUrl: 'data:text/html,<script>alert(1)</script>' }));
  await assertFails(card.update({ webLinks: [{ url: 'javascript:alert(1)', displayText: 'x' }] }));
  await assertSucceeds(card.update({ linkedIn: 'https://linkedin.com/in/alice' }));
  await assertSucceeds(card.update({ webLinks: [{ url: 'https://example.com', displayText: 'x' }] }));
});

test('a legacy card with an unsafe stored link stays editable, but not extendable', async () => {
  await seedFreeUser({ cardCount: 1 });
  await seed(admin =>
    // Written before the URL rule existed.
    admin.doc('users/u1/businessCards/alice').set({ ...CARD, youtubeUrl: 'youtube.com/@alice' })
  );

  const card = as('u1').doc('users/u1/businessCards/alice');

  // An edit that does not touch a link field still saves.
  await assertSucceeds(card.update({ jobTitle: 'Dev' }));

  // Touching a link field means every link on the write must be valid.
  await assertFails(card.update({ linkedIn: 'javascript:alert(1)' }));
  await assertSucceeds(card.update({ youtubeUrl: 'https://youtube.com/@alice' }));
});

test('the free contact limit is enforced', async () => {
  await seedFreeUser();
  const db = as('u1');

  for (let i = 1; i <= 2; i += 1) {
    const batch = db.batch();
    batch.set(db.collection('users/u1/contacts').doc(), { name: `C${i}` });
    batch.update(db.doc('users/u1'), { contactCount: i });
    await assertSucceeds(batch.commit());
  }

  const third = db.batch();
  third.set(db.collection('users/u1/contacts').doc(), { name: 'C3' });
  third.update(db.doc('users/u1'), { contactCount: 3 });
  await assertFails(third.commit());
});

test('tags are readable and writable by their owner only', async () => {
  await seedFreeUser();

  const owner = as('u1');
  await assertSucceeds(owner.doc('users/u1/tags/t1').set({ name: 'Leads', color: '#808080' }));
  await assertSucceeds(owner.doc('users/u1/tags/t1').get());
  await assertSucceeds(owner.doc('users/u1/tags/t1').delete());

  await assertFails(as('u2').doc('users/u1/tags/t1').get());
});

test('server-only collections are closed to clients', async () => {
  await env.clearFirestore();
  const db = as('u1');

  await assertFails(db.doc('usernames/alice').get());
  await assertFails(db.doc('usernames/alice').set({ uid: 'u1' }));
  await assertFails(db.doc('usageQuotas/bucket').get());
  await assertFails(db.doc('accountDeletions/u1').get());
});
