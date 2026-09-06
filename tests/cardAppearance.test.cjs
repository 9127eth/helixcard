const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const { normalizeHexColor, normalizeCardColors, getCardColorDefaults, getCardColorStyle } = require('../app/lib/cardColors.ts');
const { prepareCardAppearance } = require('../app/lib/cardAppearance.ts');
const { CARD_EFFECTS, getAvailableCardEffect } = require('../app/lib/cardEffects.ts');
const colors = getCardColorDefaults('classic');

test('canonical sRGB hex input and invalid palette rejection', () => {
  assert.equal(normalizeHexColor(' 7cceDa '), '#7CCEDA');
  for (const input of ['#FFF', '#FFFFFFFF', 'red', 'rgb(0,0,0)', '#GGGGGG', null]) assert.equal(normalizeHexColor(input), null);
  assert.equal(normalizeCardColors({ background: '#FFFFFF' }), null);
  assert.equal(normalizeCardColors({ ...colors, extra: '#FFFFFF' }), null);
  assert.equal(normalizeCardColors({ ...colors, icon: '#GGGGGG' }), null);
  assert.deepEqual(prepareCardAppearance({ customColors: { ...colors, icon: 'abcdef' } }, true).customColors, { ...colors, icon: '#ABCDEF' });
});

test('free users cannot set Pro colors/effects; every Pro effect renders only with entitlement', () => {
  assert.throws(() => prepareCardAppearance({ customColors: colors }, false), /Pro/);
  const free = ['none', 'portal-grid', 'repel'];
  for (const { id } of CARD_EFFECTS) {
    assert.equal(getAvailableCardEffect(id, true), id);
    if (free.includes(id)) assert.equal(prepareCardAppearance({ effect: id }, false).effect, id);
    else assert.throws(() => prepareCardAppearance({ effect: id }, false), /Pro/);
    assert.equal(getAvailableCardEffect(id, false), free.includes(id) ? id : 'none');
  }
  assert.equal(getAvailableCardEffect('unknown', true), 'none');
  assert.throws(() => prepareCardAppearance({ effect: 'unknown' }, true), /valid/);
});

test('downgraded users retain settings during edits and may clear them', () => {
  const existing = { customColors: colors, effect: 'holo' };
  assert.deepEqual(prepareCardAppearance({ ...existing, firstName: 'Updated' }, false, existing), { ...existing, firstName: 'Updated' });
  assert.deepEqual(prepareCardAppearance({ customColors: null, effect: 'repel' }, false, existing), { customColors: null, effect: 'repel' });
  assert.throws(() => prepareCardAppearance({ customColors: { ...colors, text: '#AAAAAA' } }, false, existing), /Pro/);
});

test('custom text, button, icon, and position colors stay independent', () => {
  const style = getCardColorStyle({ background: '#010101', button: '#020202', buttonText: '#030303', text: '#040404', icon: '#050505', position: '#060606' });
  assert.equal(style.background, '#010101');
  assert.equal(style['--save-contact-button-bg'], '#020202');
  assert.equal(style['--save-contact-button-text'], '#030303');
  assert.equal(style['--header-footer-primary-text'], '#040404');
  assert.equal(style['--social-icon-color'], '#050505');
  assert.equal(style['--position-text-color'], '#060606');
});

test('Firestore enforces permissions, canonical hex, and downgrade preservation', { skip: !process.env.HELIX_TEST_FIRESTORE_EMULATOR }, async () => {
  const host = process.env.HELIX_TEST_FIRESTORE_EMULATOR;
  assert.match(host, /^127\.0\.0\.1:\d+$/);
  process.env.FIRESTORE_EMULATOR_HOST = host;
  const { initializeApp, deleteApp } = require('firebase/app');
  const { getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc, terminate } = require('firebase/firestore');
  const admin = require('firebase-admin');
  const projectId = 'demo-helix-appearance';
  const adminApp = admin.initializeApp({ projectId }, `rules-${Date.now()}`);
  const db = adminApp.firestore();
  const uid = `owner-${Date.now()}`;
  await db.doc(`users/${uid}`).set({ isPro: false });
  const app = initializeApp({ projectId, apiKey: 'emulator-only' }, uid);
  const client = getFirestore(app);
  connectFirestoreEmulator(client, '127.0.0.1', Number(host.split(':')[1]), { mockUserToken: { sub: uid } });
  const card = doc(client, 'users', uid, 'businessCards', 'card');
  const denied = promise => assert.rejects(promise, error => error.code === 'permission-denied');
  try {
    await denied(setDoc(card, { customColors: colors }));
    await denied(setDoc(card, { effect: 'holo', isPro: true }));
    for (const effect of ['none', 'portal-grid', 'repel']) await setDoc(card, { effect });
    await denied(setDoc(doc(client, 'users', uid, 'businessCards', 'pro-portal'), { effect: 'portal' }));
    await denied(updateDoc(card, { customColors: colors }));
    await denied(updateDoc(doc(client, 'users', uid), { isPro: true }));
    await db.doc(`users/${uid}`).update({ isPro: true });
    for (const effect of ['portal', 'holo', 'stardust', 'scramble', 'shatter']) await updateDoc(card, { effect, customColors: colors });
    for (const invalid of [{ ...colors, text: '#abcdef' }, { ...colors, text: '#FFF' }, { background: '#FFFFFF' }, { ...colors, alpha: '#FFFFFF' }]) {
      await denied(updateDoc(card, { customColors: invalid }));
    }
    await denied(updateDoc(card, { effect: 'unknown' }));
    await db.doc(`users/${uid}`).update({ isPro: false });
    await updateDoc(card, { firstName: 'Allowed edit', customColors: colors, effect: 'shatter' });
    await denied(updateDoc(card, { customColors: { ...colors, text: '#ABCDEF' } }));
    await denied(updateDoc(card, { effect: 'holo' }));
    await denied(setDoc(doc(client, 'users', uid, 'businessCards', 'copy'), { effect: 'shatter', customColors: colors }));
    await updateDoc(card, { customColors: null, effect: 'none' });
    await denied(updateDoc(doc(client, 'users', 'someone-else', 'businessCards', 'card'), { effect: 'none' }));
  } finally {
    await terminate(client);
    await deleteApp(app);
    await adminApp.delete();
  }
});
