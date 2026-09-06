/**
 * Storage security-rule tests.
 *
 * Run against the Storage emulator:
 *   npx firebase emulators:exec --only storage --project helix-rules-test \
 *     "node --test tests/storage.rules.test.cjs"
 *
 * Needs `firebase-tools` and `@firebase/rules-unit-testing` available:
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

const RULES = fs.readFileSync(path.join(__dirname, '..', 'storage.rules'), 'utf8');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'helix-rules-test',
    storage: { rules: RULES, host: '127.0.0.1', port: 9199 },
  });
});

after(async () => {
  await env?.cleanup();
});

function as(uid) {
  return env.authenticatedContext(uid).storage();
}

test('an owner can upload a card image and anyone can read it', async () => {
  await env.clearStorage();

  await assertSucceeds(
    as('u1').ref('images/u1/photo.png').put(PNG, { contentType: 'image/png' })
  );
  await assertSucceeds(env.unauthenticatedContext().storage().ref('images/u1/photo.png').getDownloadURL());
});

test('a card image cannot be written into another account', async () => {
  await env.clearStorage();

  await assertFails(
    as('u2').ref('images/u1/photo.png').put(PNG, { contentType: 'image/png' })
  );
});

test('card documents accept PDFs only', async () => {
  await env.clearStorage();

  await assertSucceeds(
    as('u1').ref('docs/u1/cv.pdf').put(PNG, { contentType: 'application/pdf' })
  );
  await assertFails(
    as('u1').ref('docs/u1/cv.html').put(PNG, { contentType: 'text/html' })
  );
});

test('scanned contact images are private to their owner', async () => {
  await env.clearStorage();

  await assertSucceeds(
    as('u1').ref('contacts/u1/scan.jpg').put(PNG, { contentType: 'image/jpeg' })
  );
  await assertSucceeds(as('u1').ref('contacts/u1/scan.jpg').getDownloadURL());

  await assertFails(as('u2').ref('contacts/u1/scan.jpg').getDownloadURL());
  await assertFails(env.unauthenticatedContext().storage().ref('contacts/u1/scan.jpg').getDownloadURL());
});

test('unknown paths stay denied', async () => {
  await env.clearStorage();

  await assertFails(
    as('u1').ref('something-else/u1/file.png').put(PNG, { contentType: 'image/png' })
  );
});
