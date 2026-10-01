const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  clear,
  get,
  seed,
  seedUser,
  setUsage,
  load,
  store,
  batchCommits,
  failNext,
  deletedStoragePaths,
  uploadedStoragePaths,
} = require('./helpers/loadApp.cjs');

const {
  createContact,
  updateContact,
  batchDeleteContacts,
  batchUpdateContactTags,
  createTag,
  getTags,
  deleteTag,
  toMillis,
  normalizeContactPhone,
  formatContactPhone,
  contactImageError,
  MAX_CONTACT_IMAGE_BYTES,
} = load('app/lib/contacts.ts');

function reset(userData = {}) {
  clear();
  seedUser('u1', userData);
}

function seedTags(...ids) {
  for (const id of ids) seed(`users/u1/tags/${id}`, { name: id, userId: 'u1', createdAt: new Date(0) });
}

function seedContacts(count, data = {}) {
  const ids = [];
  for (let index = 0; index < count; index += 1) {
    const id = `c${index}`;
    seed(`users/u1/contacts/${id}`, { name: `Contact ${index}`, tags: [], ...data });
    ids.push(id);
  }
  return ids;
}

test('unknown and duplicate tag ids are dropped on create instead of failing the save', async () => {
  reset();
  seedTags('vip');

  const created = await createContact('u1', { name: 'Grace Hopper', tags: ['vip', 'deleted', 'vip', ''] });

  assert.deepEqual(created.tags, ['vip']);
  assert.deepEqual(get(`users/u1/contacts/${created.id}`).tags, ['vip']);
});

test('updating a contact that still holds a deleted tag id saves and prunes it', async () => {
  reset();
  seedTags('vip');
  seed('users/u1/contacts/c1', { name: 'Grace Hopper', tags: ['vip', 'deleted'] });

  const saved = await updateContact('u1', 'c1', { name: 'Grace Hopper', tags: ['vip', 'deleted', 'vip'] });

  assert.deepEqual(saved.tags, ['vip']);
  assert.deepEqual(get('users/u1/contacts/c1').tags, ['vip']);
});

test('bulk add unions known tags and leaves each contact\'s other tags alone', async () => {
  reset();
  seedTags('vip', 'lead', 'other');
  seed('users/u1/contacts/c1', { name: 'One', tags: ['other'] });
  seed('users/u1/contacts/c2', { name: 'Two', tags: ['vip'] });

  await batchUpdateContactTags('u1', ['c1', 'c2'], ['vip', 'lead', 'vip', 'deleted'], 'add');

  assert.deepEqual(get('users/u1/contacts/c1').tags, ['other', 'vip', 'lead']);
  assert.deepEqual(get('users/u1/contacts/c2').tags, ['vip', 'lead']);
});

test('bulk remove takes away only the chosen tags', async () => {
  reset();
  seedTags('vip', 'lead');
  seed('users/u1/contacts/c1', { name: 'One', tags: ['vip', 'lead', 'stale'] });
  seed('users/u1/contacts/c2', { name: 'Two', tags: ['lead'] });

  // A stale id can still be removed, which cleans up after a failed tag delete.
  await batchUpdateContactTags('u1', ['c1', 'c2'], ['vip', 'stale'], 'remove');

  assert.deepEqual(get('users/u1/contacts/c1').tags, ['lead']);
  assert.deepEqual(get('users/u1/contacts/c2').tags, ['lead']);
});

test('bulk tagging splits more than 400 contacts across batches', async () => {
  reset();
  seedTags('vip');
  const ids = seedContacts(450);

  await batchUpdateContactTags('u1', ids, ['vip'], 'add');
  assert.deepEqual(batchCommits, [400, 50]);
  assert.ok(ids.every(id => get(`users/u1/contacts/${id}`).tags.includes('vip')));

  batchCommits.length = 0;
  await batchUpdateContactTags('u1', ids, ['vip'], 'remove');
  assert.deepEqual(batchCommits, [400, 50]);
  assert.ok(ids.every(id => get(`users/u1/contacts/${id}`).tags.length === 0));
});

test('bulk add does nothing when none of the chosen tags exist any more', async () => {
  reset();
  seed('users/u1/contacts/c1', { name: 'One', tags: [] });

  await batchUpdateContactTags('u1', ['c1'], ['deleted'], 'add');

  assert.deepEqual(batchCommits, []);
  assert.deepEqual(get('users/u1/contacts/c1').tags, []);
});

test('deleteTag keeps the tag when the contact cleanup fails, so the delete can be retried', async () => {
  reset();
  seedTags('vip', 'lead');
  seed('users/u1/contacts/c1', { name: 'One', tags: ['vip', 'lead'] });

  failNext('commit');
  await assert.rejects(() => deleteTag('u1', 'vip'), /commit failed/);
  assert.ok(get('users/u1/tags/vip'), 'tag must survive a failed cleanup');
  assert.deepEqual(get('users/u1/contacts/c1').tags, ['vip', 'lead']);

  await deleteTag('u1', 'vip');
  assert.equal(get('users/u1/tags/vip'), undefined);
  assert.deepEqual(get('users/u1/contacts/c1').tags, ['lead']);
});

test('deleteTag cleans up more than 400 contacts in batches before deleting the tag', async () => {
  reset();
  seedTags('vip');
  const ids = seedContacts(450, { tags: ['vip', 'keep'] });
  seed('users/u1/contacts/untagged', { name: 'Untagged', tags: ['keep'] });

  await deleteTag('u1', 'vip');

  assert.deepEqual(batchCommits, [400, 50]);
  assert.ok(ids.every(id => get(`users/u1/contacts/${id}`).tags.join() === 'keep'));
  assert.deepEqual(get('users/u1/contacts/untagged').tags, ['keep']);
  assert.equal(get('users/u1/tags/vip'), undefined);
});

test('bulk delete uses the caller\'s image URLs and splits large deletes', async () => {
  reset({ contactCount: 450 });
  const ids = seedContacts(450);

  await batchDeleteContacts('u1', ids.map((id, index) => (
    index < 2 ? { id, imageUrl: `contacts/u1/${id}.jpg` } : { id }
  )));

  assert.deepEqual(batchCommits, [400, 50]);
  assert.ok(ids.every(id => get(`users/u1/contacts/${id}`) === undefined));
  assert.deepEqual(deletedStoragePaths, ['contacts/u1/c0.jpg', 'contacts/u1/c1.jpg']);
});

test('createTag writes the fields iOS needs to decode the tag', async () => {
  reset();

  const tag = await createTag('u1', { name: 'Conference', color: '#808080' });
  const stored = get(`users/u1/tags/${tag.id}`);

  assert.equal(stored.name, 'Conference');
  assert.equal(stored.color, '#808080');
  assert.equal(stored.username, 'u1');
  assert.equal(stored.userId, 'u1');
  assert.ok(stored.createdAt instanceof Date, 'createdAt is a server timestamp');
  assert.deepEqual(tag, { id: tag.id, name: 'Conference', color: '#808080', username: 'u1' });
});

test('getTags backfills older web tags and shrugs off a failed backfill', async () => {
  reset();
  seed('users/u1/tags/legacy', { name: 'Legacy', color: '#808080', username: 'u1' });
  seed('users/u1/tags/ios', { name: 'From iOS', userId: 'u1', createdAt: new Date(0) });

  failNext('updateDoc');
  const first = await getTags('u1');
  assert.deepEqual(first.map(tag => tag.id).sort(), ['ios', 'legacy']);
  assert.equal(get('users/u1/tags/legacy').userId, undefined);

  await getTags('u1');
  assert.equal(get('users/u1/tags/legacy').userId, 'u1');
  assert.ok(get('users/u1/tags/legacy').createdAt instanceof Date);
  assert.equal(get('users/u1/tags/ios').createdAt.getTime(), 0);
});

test('removing a contact image deletes the field instead of storing an empty string', async () => {
  reset();
  seed('users/u1/contacts/c1', { name: 'Grace Hopper', imageUrl: 'https://cdn.example.com/contacts/u1/a.jpg' });

  const saved = await updateContact('u1', 'c1', { imageUrl: '' });

  assert.equal('imageUrl' in get('users/u1/contacts/c1'), false);
  assert.equal(saved.imageUrl, undefined);
});

test('whitespace-only names are rejected and names are trimmed on create and update', async () => {
  reset();

  await assert.rejects(() => createContact('u1', { name: '   ' }), /Name is required/);
  assert.equal(get('users/u1').contactCount, 0);

  const created = await createContact('u1', { name: '  Grace Hopper  ' });
  const stored = get(`users/u1/contacts/${created.id}`);
  assert.equal(stored.name, 'Grace Hopper');
  assert.equal(stored.firstName, 'Grace');
  assert.equal(stored.lastName, 'Hopper');

  await assert.rejects(() => updateContact('u1', created.id, { name: ' \t ' }), /Name is required/);
  assert.equal(get(`users/u1/contacts/${created.id}`).name, 'Grace Hopper');

  const saved = await updateContact('u1', created.id, { name: '  Ada Lovelace ' });
  assert.deepEqual(
    { name: saved.name, firstName: saved.firstName, lastName: saved.lastName },
    { name: 'Ada Lovelace', firstName: 'Ada', lastName: 'Lovelace' }
  );
  assert.equal(get(`users/u1/contacts/${created.id}`).name, 'Ada Lovelace');
});

test('a scanned image is uploaded first and saved in the same create', async () => {
  reset();

  const created = await createContact(
    'u1',
    { name: 'Katherine Johnson', contactSource: 'scanned' },
    new File(['image'], 'card.png', { type: 'image/png' })
  );

  const imageUrl = 'https://cdn.example.com/contacts/u1/test-uuid.png';
  assert.deepEqual(uploadedStoragePaths, ['contacts/u1/test-uuid.png']);
  assert.equal(created.imageUrl, imageUrl);
  assert.equal(get(`users/u1/contacts/${created.id}`).imageUrl, imageUrl);
  assert.equal(get('users/u1').contactCount, 1);
});

test('a failed create removes the image it uploaded and spends no quota', async () => {
  reset();

  failNext('commit');
  await assert.rejects(() => createContact(
    'u1',
    { name: 'Katherine Johnson' },
    new File(['image'], 'card.jpg', { type: 'image/jpeg' })
  ));

  assert.deepEqual(deletedStoragePaths, ['https://cdn.example.com/contacts/u1/test-uuid.jpg']);
  assert.equal([...store.keys()].some(key => key.startsWith('users/u1/contacts/')), false);
  assert.equal(get('users/u1').contactCount, 0);
});

test('nothing is uploaded when the account is out of contact slots or the file is not an image', async () => {
  reset();
  setUsage({ canCreateContact: false, isPro: false });
  await assert.rejects(
    () => createContact('u1', { name: 'A' }, new File(['image'], 'card.png', { type: 'image/png' })),
    /Upgrade to Helix Pro/
  );

  setUsage({ canCreateContact: true });
  await assert.rejects(
    () => createContact('u1', { name: 'A' }, new File(['text'], 'notes.txt', { type: 'text/plain' })),
    /image file/
  );

  assert.deepEqual(uploadedStoragePaths, []);
});

test('contact images must be images under the 10 MiB storage rule', () => {
  assert.equal(contactImageError({ type: 'image/jpeg', size: 1024 }), null);
  assert.equal(contactImageError({ type: 'image/png', size: MAX_CONTACT_IMAGE_BYTES - 1 }), null);
  assert.match(contactImageError({ type: 'image/png', size: MAX_CONTACT_IMAGE_BYTES }), /10 MB/);
  assert.match(contactImageError({ type: 'application/pdf', size: 10 }), /image file/);
  assert.match(contactImageError({ type: '', size: 10 }), /image file/);
});

test('phone numbers become E.164 only when that loses nothing', () => {
  assert.equal(normalizeContactPhone('(212) 555-0123'), '+12125550123');
  assert.equal(normalizeContactPhone('+44 7911 123456'), '+447911123456');
  // A UK number typed without +44 is not a valid US number: keep it as typed.
  assert.equal(normalizeContactPhone('07700 900123'), '07700 900123');
  assert.equal(normalizeContactPhone('212-555-0123 ext. 12'), '212-555-0123 ext. 12');
  assert.equal(normalizeContactPhone(' 555-0100 '), '555-0100');

  assert.equal(formatContactPhone('+12125550123'), '(212) 555-0123');
  assert.equal(formatContactPhone('+447911123456'), '+44 7911 123456');
  assert.equal(formatContactPhone('07700 900123'), '07700 900123');
});

test('toMillis reads every date shape contacts are stored or returned with', () => {
  const millis = Date.UTC(2026, 0, 15, 3, 30);
  const iso = new Date(millis).toISOString();

  assert.equal(toMillis({ toMillis: () => millis, seconds: 1 }), millis);
  assert.equal(toMillis(new Date(millis)), millis);
  assert.equal(toMillis(iso), millis);
  assert.equal(toMillis(millis), millis);
  assert.equal(toMillis({ seconds: millis / 1000, nanoseconds: 5e8 }), millis + 500);
  assert.equal(toMillis({ seconds: millis / 1000 }), millis);

  for (const value of [undefined, null, 'not a date', NaN, new Date('invalid'), {}, [], true]) {
    assert.equal(toMillis(value), 0, `toMillis(${String(value)})`);
  }
});
