const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const {
  sanitizeExternalUrl,
  sanitizeEmailAddress,
  sanitizePhoneNumber,
} = require('../app/lib/urlSafety.ts');
const { toPublicCard } = require('../app/lib/publicCard.ts');
const { normalizeCardUrls } = require('../app/lib/cardUrls.ts');

test('only http(s) survives URL sanitising', () => {
  assert.equal(sanitizeExternalUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(sanitizeExternalUrl('http://example.com/'), 'http://example.com/');

  // Scheme-less values are treated as hostnames, matching the card form.
  assert.equal(sanitizeExternalUrl('linkedin.com/in/me'), 'https://linkedin.com/in/me');

  for (const hostile of [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    '  javascript:alert(1)  ',
    'java\nscript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '',
    '   ',
    null,
    undefined,
    42,
  ]) {
    assert.equal(sanitizeExternalUrl(hostile), undefined, `expected ${String(hostile)} to be rejected`);
  }
});

test('phone and email hrefs cannot carry a payload', () => {
  assert.equal(sanitizePhoneNumber('(555) 123-4567'), '(555) 123-4567');
  assert.equal(sanitizePhoneNumber('555"><script>'), '555');
  assert.equal(sanitizePhoneNumber(''), undefined);

  assert.equal(sanitizeEmailAddress('me@example.com'), 'me@example.com');
  for (const bad of ['me@example.com, evil@example.com', 'me@example', 'a"b@c.com', '', null]) {
    assert.equal(sanitizeEmailAddress(bad), undefined);
  }
});

test('the public DTO drops unsafe links and fields it does not know', () => {
  const card = toPublicCard('slug', {
    firstName: 'Alice',
    description: 'Card',
    linkedIn: 'javascript:alert(1)',
    twitter: 'https://x.com/alice',
    phoneNumber: '(555) 123-4567',
    email: 'alice@example.com',
    webLinks: [
      { url: 'javascript:alert(1)', displayText: 'bad' },
      { url: 'https://example.com', displayText: 'good' },
      { url: '', displayText: 'empty' },
    ],
    isActive: true,
    isPrimary: true,
    stripeCustomerId: 'cus_secret',
    internalNote: 'not for the public',
  }, false);

  assert.equal(card.linkedIn, undefined);
  assert.equal(card.twitter, 'https://x.com/alice');
  assert.deepEqual(card.webLinks, [{ url: 'https://example.com/', displayText: 'good' }]);
  assert.equal(card.stripeCustomerId, undefined);
  assert.equal(card.internalNote, undefined);
  assert.equal(card.isPro, false);
});

test('the public DTO omits a company that was cleared or is only whitespace', () => {
  const withCompany = toPublicCard('s', { firstName: 'Ada', company: 'Analytical', jobTitle: 'Engineer' }, false);
  assert.equal(withCompany.company, 'Analytical');

  const cleared = toPublicCard('s', { firstName: 'Ada', company: '', jobTitle: 'Engineer' }, false);
  assert.equal(cleared.company, undefined);
  assert.equal(cleared.jobTitle, 'Engineer');

  const blank = toPublicCard('s', { firstName: 'Ada', company: '   ', jobTitle: 'Engineer' }, false);
  assert.equal(blank.company, undefined);
});

test('custom colours only reach the public card for a Pro owner', () => {
  const colors = {
    background: '#FFFFFF', button: '#000000', buttonText: '#FFFFFF',
    text: '#111111', icon: '#222222', position: '#333333',
  };

  assert.deepEqual(toPublicCard('s', { customColors: colors }, true).customColors, colors);
  assert.equal(toPublicCard('s', { customColors: colors }, false).customColors, null);
  assert.equal(toPublicCard('s', { customColors: { background: 'red' } }, true).customColors, null);
});

test('the public card shows the effects tour unless a Pro owner turned it off', () => {
  assert.equal(toPublicCard('s', {}, false).effectTour, true);
  assert.equal(toPublicCard('s', { effectTour: false }, false).effectTour, true);
  assert.equal(toPublicCard('s', {}, true).effectTour, true);
  assert.equal(toPublicCard('s', { effectTour: false }, true).effectTour, false);
});

test('a card saved without isActive is live; only an explicit false switches it off', () => {
  assert.equal(toPublicCard('s', { firstName: 'Ada' }, false).isActive, true);
  assert.equal(toPublicCard('s', { firstName: 'Ada', isActive: true }, false).isActive, true);
  assert.equal(toPublicCard('s', { firstName: 'Ada', isActive: false }, false).isActive, false);
});

test('the private card label never leaves the server', () => {
  assert.equal(toPublicCard('s', { firstName: 'Ada', description: 'Side gig, do not share' }, true).description, '');
  assert.equal(toPublicCard('s', { firstName: 'Ada' }, false).description, '');
});

test('document fields only reach the public card for a Pro owner', () => {
  const data = {
    firstName: 'Ada',
    cvUrl: 'https://storage.example/docs/u1/cv.pdf',
    cvHeader: 'Resume',
    cvDescription: 'My work history',
    cvDisplayText: 'Download',
  };

  const free = toPublicCard('s', data, false);
  for (const field of ['cvUrl', 'cvHeader', 'cvDescription', 'cvDisplayText']) {
    assert.equal(free[field], undefined, `${field} should be withheld for a free owner`);
  }

  const pro = toPublicCard('s', data, true);
  assert.equal(pro.cvUrl, 'https://storage.example/docs/u1/cv.pdf');
  assert.equal(pro.cvHeader, 'Resume');
  assert.equal(pro.cvDescription, 'My work history');
  assert.equal(pro.cvDisplayText, 'Download');
});

test('bare social handles are rebuilt on the platform profile URL, as iOS builds them', () => {
  const card = toPublicCard('s', {
    twitter: 'https://jordan/', // an older web save of "@jordan"
    instagramUrl: 'jordan_lane', // iOS-style bare handle
    tiktokUrl: '@jordan',
    threadsUrl: 'jordan',
    linkedIn: 'in/jordan-lane',
    facebookUrl: 'jordan.lane', // a dot: indistinguishable from a domain, left alone
    blueskyUrl: 'jordan',
    discordUrl: 'invite/abc123', // what iOS keeps of discord.com/invite/abc123
    telegramUrl: 'https://t.me/jordan', // already a full URL
    imageUrl: 'https://photo/', // not a social link
    webLinks: [{ url: 'https://portfolio/', displayText: 'Portfolio' }],
  }, false);

  assert.equal(card.twitter, 'https://x.com/jordan');
  assert.equal(card.instagramUrl, 'https://www.instagram.com/jordan_lane');
  assert.equal(card.tiktokUrl, 'https://www.tiktok.com/@jordan');
  assert.equal(card.threadsUrl, 'https://www.threads.net/@jordan');
  assert.equal(card.linkedIn, 'https://www.linkedin.com/in/jordan-lane');
  assert.equal(card.facebookUrl, 'https://jordan.lane/');
  assert.equal(card.blueskyUrl, 'https://bsky.app/profile/jordan');
  assert.equal(card.discordUrl, 'https://discord.com/invite/abc123');
  assert.equal(card.telegramUrl, 'https://t.me/jordan');
  assert.equal(card.imageUrl, 'https://photo/');
  assert.deepEqual(card.webLinks, [{ url: 'https://portfolio/', displayText: 'Portfolio' }]);

  // Repair never widens what an href can hold.
  assert.equal(toPublicCard('s', { twitter: 'javascript:alert(1)' }, false).twitter, undefined);
});

test('YouTube handles and channel ids get their path back, since iOS strips both', () => {
  const channelId = 'UCabcdefghijklmnopqrstuv';
  assert.equal(toPublicCard('s', { youtubeUrl: 'jordanlane' }, false).youtubeUrl, 'https://www.youtube.com/@jordanlane');
  assert.equal(toPublicCard('s', { youtubeUrl: channelId }, false).youtubeUrl, `https://www.youtube.com/channel/${channelId}`);
  assert.equal(toPublicCard('s', { youtubeUrl: 'c/jordanlane' }, false).youtubeUrl, 'https://www.youtube.com/c/jordanlane');
  assert.equal(
    toPublicCard('s', { youtubeUrl: 'https://www.youtube.com/@jordanlane' }, false).youtubeUrl,
    'https://www.youtube.com/@jordanlane'
  );
});

test('saving turns an X handle into the profile URL instead of a dead host', () => {
  for (const typed of ['@jordan', 'jordan', ' @jordan ', 'https://jordan']) {
    assert.equal(normalizeCardUrls({ twitter: typed }).twitter, 'https://x.com/jordan', typed);
  }
  assert.equal(normalizeCardUrls({ twitter: 'x.com/jordan' }).twitter, 'https://x.com/jordan');
  assert.equal(normalizeCardUrls({ facebookUrl: 'jordan' }).facebookUrl, 'https://www.facebook.com/jordan');
  // Only social fields are rebuilt; a card photo on a single-label host is left alone.
  assert.equal(normalizeCardUrls({ imageUrl: 'https://photo/' }).imageUrl, 'https://photo/');
});

test('card writes are normalised before they reach Firestore', () => {
  const normalized = normalizeCardUrls({
    linkedIn: 'linkedin.com/in/me',
    twitter: 'javascript:alert(1)',
    instagramUrl: '',
    webLinks: [{ url: 'example.com', displayText: 'x' }, { url: 'javascript:alert(1)', displayText: 'y' }],
  });

  assert.equal(normalized.linkedIn, 'https://linkedin.com/in/me');
  assert.equal(normalized.twitter, '');
  assert.equal(normalized.instagramUrl, '');
  assert.deepEqual(normalized.webLinks, [
    { url: 'https://example.com/', displayText: 'x' },
    { url: '', displayText: 'y' },
  ]);
});
