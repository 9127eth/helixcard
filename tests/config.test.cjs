const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Firebase canonical-host redirect preserves the complete request path', () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'firebase.json'), 'utf8')
  );
  const redirect = config.hosting[0].redirects[0];

  assert.deepEqual(redirect, {
    source: '/:path*',
    destination: 'https://www.helixcard.app/:path',
    type: 301,
  });
});
