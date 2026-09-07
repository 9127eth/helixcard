const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  clear,
  get,
  seed,
  seedUser,
  setUsage,
  setAuthUser,
  load,
  deletedStoragePaths,
  uploadedStoragePaths,
} = require('./helpers/loadApp.cjs');

const {
  saveBusinessCard,
  updateBusinessCard,
  deleteBusinessCard,
  setPrimaryCard,
  canCreateCard,
  validateCustomUsername,
} = load('app/lib/firebaseOperations.ts');
const {
  createContact,
  updateContact,
  deleteContact,
  batchDeleteContacts,
  createTag,
  searchContacts,
  canCreateContact,
} = load('app/lib/contacts.ts');
const { sanitizeCustomSlug, isValidSlug, generateCardUrl } = load('app/lib/slugUtils.ts');
const { normalizeUsername } = load('app/lib/usernames.ts');
const { cardLimitFor, contactLimitFor } = load('app/lib/entitlements.ts');
const { uploadCv, uploadImage } = load('app/lib/uploadUtils.ts');
const {
  FREE_USER_CARD_LIMIT,
  PRO_USER_CARD_LIMIT,
  FREE_USER_CONTACT_LIMIT,
  PRO_USER_CONTACT_LIMIT,
} = load('app/lib/constants.ts');

const user = { uid: 'u1', getIdToken: async () => 'token' };

function cardInput(overrides = {}) {
  return {
    description: 'Hello',
    firstName: 'Ada',
    lastName: 'Lovelace',
    jobTitle: 'Engineer',
    company: 'Analytical',
    phoneNumber: '555-0100',
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

function reset(userData = {}) {
  clear();
  seedUser('u1', userData);
}

test('a first card uses the account handle, becomes primary, and consumes quota', async () => {
  reset({ primaryCardPlaceholder: true, primaryCardId: 'alice', cardCount: 0 });

  const result = await saveBusinessCard(user, cardInput({ cardSlug: 'ignored' }));

  assert.equal(result.cardSlug, 'alice');
  assert.equal(result.cardUrl, 'https://www.helixcard.app/c/alice');

  const card = get('users/u1/businessCards/alice');
  assert.equal(card.firstName, 'Ada');
  assert.equal(card.cardSlug, 'alice');
  assert.equal(card.isPrimary, true);
  assert.equal(card.isActive, true);

  const owner = get('users/u1');
  assert.equal(owner.primaryCardId, 'alice');
  assert.equal(owner.primaryCardPlaceholder, false);
  assert.equal(owner.cardCount, 1);
});

test('a later card keeps the supplied slug and stays inactive for a free account', async () => {
  reset({
    isPro: false,
    primaryCardPlaceholder: false,
    primaryCardId: 'alice',
    cardCount: 1,
  });
  seed('users/u1/businessCards/alice', { firstName: 'Ada', isPrimary: true, cardSlug: 'alice' });

  await saveBusinessCard(user, cardInput({ cardSlug: 'work' }));

  const card = get('users/u1/businessCards/work');
  assert.equal(card.cardSlug, 'work');
  assert.equal(card.isPrimary, false);
  assert.equal(card.isActive, false);
  assert.equal(get('users/u1').cardCount, 2);
});

test('a later Pro card is active and returns the nested public URL', async () => {
  reset({
    isPro: true,
    primaryCardPlaceholder: false,
    primaryCardId: 'alice',
    cardCount: 1,
  });
  seed('users/u1/businessCards/alice', { firstName: 'Ada', isPrimary: true, cardSlug: 'alice' });

  const result = await saveBusinessCard(user, cardInput({ cardSlug: 'work' }));

  assert.equal(result.cardUrl, 'https://www.helixcard.app/c/alice/work');
  assert.equal(get('users/u1/businessCards/work').isActive, true);
});

test('creating a card is refused when usage says the account is out of slots', async () => {
  reset();
  setUsage({ canCreateCard: false, isPro: false });

  await assert.rejects(
    () => saveBusinessCard(user, cardInput()),
    /Upgrade to Helix Pro/
  );
  assert.equal(get('users/u1/businessCards/alice'), undefined);
  assert.equal(get('users/u1').cardCount, 0);
});

test('a Pro account sees the numeric card cap when it is out of slots', async () => {
  reset({ isPro: true, primaryCardPlaceholder: false, primaryCardId: 'alice' });
  setUsage({ canCreateCard: false, isPro: true, cardLimit: 10 });

  await assert.rejects(
    () => saveBusinessCard(user, cardInput()),
    /10 card limit/
  );
});

test('scheme-less links are upgraded and hostile schemes are dropped before save', async () => {
  reset();

  await saveBusinessCard(user, cardInput({
    linkedIn: 'linkedin.com/in/ada',
    twitter: 'javascript:alert(1)',
    webLinks: [
      { url: 'example.com', displayText: 'site' },
      { url: 'javascript:alert(1)', displayText: 'bad' },
    ],
  }));

  const card = get('users/u1/businessCards/alice');
  assert.equal(card.linkedIn, 'https://linkedin.com/in/ada');
  assert.equal(card.twitter, '');
  assert.deepEqual(card.webLinks, [
    { url: 'https://example.com/', displayText: 'site' },
    { url: '', displayText: 'bad' },
  ]);
});

test('free accounts cannot save Pro colors; CV uploads must be small PDFs', async () => {
  reset();

  await assert.rejects(
    () => saveBusinessCard(user, cardInput({
      customColors: {
        background: '#FFFFFF',
        button: '#000000',
        buttonText: '#FFFFFF',
        text: '#111111',
        icon: '#222222',
        position: '#333333',
      },
    })),
    /Helix Pro/
  );

  await assert.rejects(
    () => saveBusinessCard(user, cardInput(), { type: 'image/png', size: 100, name: 'cv.png' }),
    /Only PDF/
  );
  await assert.rejects(
    () => saveBusinessCard(user, cardInput(), { type: 'application/pdf', size: 6 * 1024 * 1024, name: 'cv.pdf' }),
    /5MB/
  );
});

test('card uploads use immutable generated object names instead of local filenames', async () => {
  reset();

  await uploadImage('u1', new File(['image'], 'shared-name.png', { type: 'image/png' }));
  await uploadCv('u1', new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }));

  assert.deepEqual(uploadedStoragePaths, [
    'images/u1/test-uuid.png',
    'docs/u1/test-uuid.pdf',
  ]);
});

test('editing a card keeps derived primacy and sanitizes new links', async () => {
  reset({ primaryCardPlaceholder: false, primaryCardId: 'alice', cardCount: 1 });
  seed('users/u1/businessCards/alice', {
    firstName: 'Ada',
    isPrimary: true,
    isActive: true,
    cardSlug: 'alice',
    linkedIn: 'https://linkedin.com/in/ada',
  });

  await updateBusinessCard('u1', 'alice', {
    firstName: 'Augusta',
    isPrimary: false,
    isActive: false,
    linkedIn: 'linkedin.com/in/augusta',
  });

  const card = get('users/u1/businessCards/alice');
  assert.equal(card.firstName, 'Augusta');
  assert.equal(card.isPrimary, true);
  assert.equal(card.isActive, true);
  assert.equal(card.linkedIn, 'https://linkedin.com/in/augusta');
});

test('replacing a CV saves the new URL before cleaning up the old object', async () => {
  reset({ primaryCardPlaceholder: false, primaryCardId: 'alice', cardCount: 1 });
  seed('users/u1/businessCards/alice', {
    firstName: 'Ada',
    isPrimary: true,
    isActive: true,
    cardSlug: 'alice',
    cvUrl: 'https://storage.example/docs/u1/old.pdf',
  });

  await updateBusinessCard('u1', 'alice', {
    firstName: 'Ada',
    cv: new File(['new CV'], 'new.pdf', { type: 'application/pdf' }),
  });

  assert.equal(get('users/u1/businessCards/alice').cvUrl, 'https://cdn.example.com/docs/cv.pdf');
  assert.deepEqual(deletedStoragePaths, ['https://storage.example/docs/u1/old.pdf']);
});

test('clearing company deletes it so the public card URL no longer shows it', async () => {
  reset({ primaryCardPlaceholder: false, primaryCardId: 'alice', cardCount: 1 });
  seed('users/u1/businessCards/alice', {
    firstName: 'Ada',
    isPrimary: true,
    isActive: true,
    cardSlug: 'alice',
    jobTitle: 'Engineer',
    company: 'Analytical',
  });

  await updateBusinessCard('u1', 'alice', {
    firstName: 'Ada',
    jobTitle: 'Engineer',
    company: '',
  });

  const card = get('users/u1/businessCards/alice');
  assert.equal(card.company, undefined);
  assert.equal(card.jobTitle, 'Engineer');
});

test('deleting the primary card reserves the handle as a placeholder', async () => {
  reset({ primaryCardPlaceholder: false, primaryCardId: 'alice', cardCount: 1 });
  seed('users/u1/businessCards/alice', { firstName: 'Ada', isPrimary: true, cardSlug: 'alice' });

  await deleteBusinessCard(user, 'alice');

  assert.equal(get('users/u1/businessCards/alice'), undefined);
  assert.equal(get('users/u1').primaryCardId, null);
  assert.equal(get('users/u1').primaryCardPlaceholder, true);
});

test('deleting a card cleans up its image and CV after removing the Firestore record', async () => {
  reset({ primaryCardPlaceholder: false, primaryCardId: 'alice', cardCount: 1 });
  seed('users/u1/businessCards/alice', {
    firstName: 'Ada',
    isPrimary: true,
    cardSlug: 'alice',
    imageUrl: 'https://storage.example/images/u1/photo.png',
    cvUrl: 'https://storage.example/docs/u1/cv.pdf',
  });

  await deleteBusinessCard(user, 'alice');

  assert.deepEqual(deletedStoragePaths, [
    'https://storage.example/images/u1/photo.png',
    'https://storage.example/docs/u1/cv.pdf',
  ]);
});

test('legacy Storage objects shared by two cards are kept until the final reference is deleted', async () => {
  reset({ primaryCardPlaceholder: false, primaryCardId: 'primary', cardCount: 3 });
  const sharedImage = 'https://storage.example/images/u1/shared.png';
  seed('users/u1/businessCards/primary', { firstName: 'Ada', isPrimary: true, cardSlug: 'primary' });
  seed('users/u1/businessCards/work', { firstName: 'Ada', isPrimary: false, cardSlug: 'work', imageUrl: sharedImage });
  seed('users/u1/businessCards/home', { firstName: 'Ada', isPrimary: false, cardSlug: 'home', imageUrl: sharedImage });

  await deleteBusinessCard(user, 'work');
  assert.deepEqual(deletedStoragePaths, []);

  await deleteBusinessCard(user, 'home');
  assert.deepEqual(deletedStoragePaths, [sharedImage]);
});

test('setPrimaryCard moves primacy and activity onto the chosen card', async () => {
  reset({
    isPro: true,
    primaryCardPlaceholder: false,
    primaryCardId: 'alice',
    cardCount: 2,
  });
  seed('users/u1/businessCards/alice', { firstName: 'Ada', isPrimary: true, isActive: true, cardSlug: 'alice' });
  seed('users/u1/businessCards/work', { firstName: 'Ada', isPrimary: false, isActive: true, cardSlug: 'work' });

  await setPrimaryCard('u1', 'work');

  assert.equal(get('users/u1').primaryCardId, 'work');
  assert.deepEqual(
    { isPrimary: get('users/u1/businessCards/work').isPrimary, isActive: get('users/u1/businessCards/work').isActive },
    { isPrimary: true, isActive: true }
  );
  assert.deepEqual(
    { isPrimary: get('users/u1/businessCards/alice').isPrimary, isActive: get('users/u1/businessCards/alice').isActive },
    { isPrimary: false, isActive: true }
  );
});

test('canCreateCard trusts the server summary and only answers for the signed-in user', async () => {
  reset();
  setUsage({ canCreateCard: false });
  assert.equal(await canCreateCard('u1'), false);

  setUsage({ canCreateCard: true });
  assert.equal(await canCreateCard('u1'), true);

  setAuthUser({ uid: 'someone-else', getIdToken: async () => 'token' });
  assert.equal(await canCreateCard('u1'), false);
});

test('creating a contact requires a name, splits it, and increments the quota counter', async () => {
  reset();

  await assert.rejects(() => createContact('u1', { company: 'Acme' }), /Name is required/);

  const created = await createContact('u1', {
    name: 'Grace Hopper',
    email: 'grace@example.com',
    company: 'Navy',
  });

  assert.equal(created.firstName, 'Grace');
  assert.equal(created.lastName, 'Hopper');
  assert.equal(created.contactSource, 'manual');
  assert.deepEqual(created.tags, []);

  const stored = get(`users/u1/contacts/${created.id}`);
  assert.equal(stored.name, 'Grace Hopper');
  assert.equal(stored.firstName, 'Grace');
  assert.equal(stored.lastName, 'Hopper');
  assert.equal(stored.email, 'grace@example.com');
  assert.equal(get('users/u1').contactCount, 1);
});

test('creating a scanned contact preserves its source and rejects unknown tag IDs', async () => {
  reset();
  const tag = await createTag('u1', { name: 'Conference' });

  const scanned = await createContact('u1', {
    name: 'Katherine Johnson',
    contactSource: 'scanned',
    tags: [tag.id],
  });

  assert.equal(scanned.contactSource, 'scanned');
  assert.equal(get(`users/u1/contacts/${scanned.id}`).contactSource, 'scanned');
  assert.deepEqual(scanned.tags, [tag.id]);

  await assert.rejects(
    () => createContact('u1', { name: 'Unknown Tag', tags: ['missing-tag'] }),
    /no longer exist/
  );
});

test('a single-word contact name becomes a first name with an empty last name', async () => {
  reset();

  const created = await createContact('u1', { name: 'Prince' });
  assert.equal(created.firstName, 'Prince');
  assert.equal(created.lastName, '');
});

test('creating a contact is refused when usage says the account is out of slots', async () => {
  reset();
  setUsage({ canCreateContact: false, isPro: false });

  await assert.rejects(
    () => createContact('u1', { name: 'Alan Turing' }),
    /Upgrade to Helix Pro/
  );
  assert.equal(get('users/u1').contactCount, 0);
});

test('a Pro account sees the numeric contact cap when it is out of slots', async () => {
  reset({ isPro: true });
  setUsage({ canCreateContact: false, isPro: true, contactLimit: 1000 });

  await assert.rejects(
    () => createContact('u1', { name: 'Alan Turing' }),
    /1000 contact limit/
  );
});

test('updating a contact re-parses the name', async () => {
  reset();
  seed('users/u1/contacts/c1', {
    name: 'Grace Hopper',
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@example.com',
    tags: [],
  });

  await updateContact('u1', 'c1', { name: 'Grace Brewster Hopper', email: 'gh@example.com' });

  const stored = get('users/u1/contacts/c1');
  assert.equal(stored.firstName, 'Grace');
  assert.equal(stored.lastName, 'Brewster Hopper');
  assert.equal(stored.email, 'gh@example.com');
});

test('deleting a contact removes the document', async () => {
  reset({ contactCount: 1 });
  seed('users/u1/contacts/c1', { name: 'Grace Hopper', firstName: 'Grace', lastName: 'Hopper' });

  await deleteContact('u1', 'c1');
  assert.equal(get('users/u1/contacts/c1'), undefined);
});

test('single and bulk contact deletion clean up stored images', async () => {
  reset({ contactCount: 3 });
  seed('users/u1/contacts/c1', { name: 'One', imageUrl: 'contacts/u1/one.jpg' });
  seed('users/u1/contacts/c2', { name: 'Two', imageUrl: 'contacts/u1/two.jpg' });
  seed('users/u1/contacts/c3', { name: 'Three' });

  await deleteContact('u1', 'c1');
  await batchDeleteContacts('u1', ['c2', 'c3']);

  assert.deepEqual(deletedStoragePaths, ['contacts/u1/one.jpg', 'contacts/u1/two.jpg']);
  assert.equal(get('users/u1/contacts/c2'), undefined);
  assert.equal(get('users/u1/contacts/c3'), undefined);
});

test('tags cannot be duplicated and search matches name or company', async () => {
  reset();

  const tag = await createTag('u1', { name: 'Leads' });
  assert.equal(tag.color, '#808080');
  await assert.rejects(() => createTag('u1', { name: 'Leads' }), /already exists/);

  seed('users/u1/contacts/c1', { firstName: 'Grace', lastName: 'Hopper', company: 'Navy', tags: [tag.id] });
  seed('users/u1/contacts/c2', { firstName: 'Ada', lastName: 'Lovelace', company: 'Analytical', tags: [] });

  const byName = await searchContacts('u1', 'hopper');
  assert.equal(byName.length, 1);
  assert.equal(byName[0].firstName, 'Grace');

  const byCompany = await searchContacts('u1', 'analytical');
  assert.equal(byCompany.length, 1);
  assert.equal(byCompany[0].firstName, 'Ada');

  const byTag = await searchContacts('u1', '', [tag.id]);
  assert.equal(byTag.length, 1);
  assert.equal(byTag[0].firstName, 'Grace');
});

test('canCreateContact trusts the server summary and only answers for the signed-in user', async () => {
  reset();
  setUsage({ canCreateContact: false });
  assert.equal(await canCreateContact('u1'), false);

  setUsage({ canCreateContact: true });
  assert.equal(await canCreateContact('u1'), true);

  setAuthUser({ uid: 'someone-else', getIdToken: async () => 'token' });
  assert.equal(await canCreateContact('u1'), false);
});

test('username, slug, and plan limits match the product rules', () => {
  assert.equal(validateCustomUsername('ada-lovelace'), true);
  assert.equal(validateCustomUsername('Ada'), false);
  assert.equal(validateCustomUsername('ab'), false);

  assert.equal(normalizeUsername('  Ada-Lovelace  '), 'ada-lovelace');
  assert.equal(normalizeUsername('admin'), null);
  assert.equal(normalizeUsername('dashboard'), null);
  assert.equal(normalizeUsername('ab'), null);
  assert.equal(normalizeUsername(12), null);

  assert.equal(isValidSlug('work-card'), true);
  assert.equal(isValidSlug('x'), false);
  assert.equal(sanitizeCustomSlug('Work Card!!'), 'workcard');

  assert.equal(cardLimitFor(false), FREE_USER_CARD_LIMIT);
  assert.equal(cardLimitFor(true), PRO_USER_CARD_LIMIT);
  assert.equal(contactLimitFor(false), FREE_USER_CONTACT_LIMIT);
  assert.equal(contactLimitFor(true), PRO_USER_CONTACT_LIMIT);
  assert.equal(FREE_USER_CARD_LIMIT, 1);
  assert.equal(FREE_USER_CONTACT_LIMIT, 2);
});

test('generateCardUrl uses the reserved handle and nests non-primary slugs', async () => {
  reset();
  assert.equal(await generateCardUrl('u1', 'alice', true), 'https://www.helixcard.app/c/alice');
  assert.equal(await generateCardUrl('u1', 'work', false), 'https://www.helixcard.app/c/alice/work');
});
