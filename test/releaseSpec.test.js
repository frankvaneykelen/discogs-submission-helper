'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { loadReleaseSpec, validateReleaseSpec } = require('../src/releaseSpec');

const exampleReleasePath = path.join(__dirname, '..', 'examples', 'musique-arabe.json');

test('loadReleaseSpec loads and validates the example release spec', () => {
  const releaseSpec = loadReleaseSpec(exampleReleasePath);
  assert.equal(releaseSpec.title, 'Musique Arabe');
  assert.equal(releaseSpec.tracklist.length, 12);
  assert.deepEqual(releaseSpec.format, ['Cassette', 'Compilation', 'Unofficial Release']);
});

test('validateReleaseSpec accepts a minimal valid release spec', () => {
  const { valid, errors } = validateReleaseSpec({
    title: 'Test Release',
    format: ['Vinyl'],
    tracklist: [{ position: 'A1', title: 'Track One' }],
  });
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test('validateReleaseSpec rejects a release spec missing required fields', () => {
  const { valid, errors } = validateReleaseSpec({ title: 'Missing tracklist and format' });
  assert.equal(valid, false);
  assert.ok(errors.length > 0);
});

test('validateReleaseSpec rejects a tracklist item missing a title', () => {
  const { valid, errors } = validateReleaseSpec({
    title: 'Test Release',
    format: ['Vinyl'],
    tracklist: [{ position: 'A1' }],
  });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('title')));
});

test('loadReleaseSpec throws a helpful error for invalid JSON', () => {
  const tmpFile = path.join(os.tmpdir(), `invalid-release-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, '{ not valid json');
  try {
    assert.throws(() => loadReleaseSpec(tmpFile), /Failed to parse release spec JSON/);
  } finally {
    fs.unlinkSync(tmpFile);
  }
});

test('loadReleaseSpec throws a helpful error for a spec failing validation', () => {
  const tmpFile = path.join(os.tmpdir(), `bad-release-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify({ title: 'No format or tracklist' }));
  try {
    assert.throws(() => loadReleaseSpec(tmpFile), /failed validation/);
  } finally {
    fs.unlinkSync(tmpFile);
  }
});
