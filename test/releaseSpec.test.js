'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { loadReleaseSpec, validateReleaseSpec } = require('../src/releaseSpec');

const exampleReleasePath = path.join(__dirname, '..', 'examples', 'musique-arabe.json');

function createValidReleaseSpec() {
  return {
    title: 'Test Release',
    artists: ['Test Artist'],
    format: ['Vinyl'],
    country: 'Netherlands',
    released: '2026',
    label: 'Test Label',
    tracklist: [{ position: 'A1', artist: 'Test Artist', title: 'Track One' }],
  };
}

test('loadReleaseSpec loads and validates the example release spec', () => {
  const releaseSpec = loadReleaseSpec(exampleReleasePath);
  assert.equal(releaseSpec.title, 'Musique Arabe');
  assert.equal(releaseSpec.tracklist.length, 12);
  assert.deepEqual(releaseSpec.format, ['Cassette', 'Compilation', 'Unofficial Release']);
});

test('validateReleaseSpec accepts a minimal valid release spec', () => {
  const { valid, errors } = validateReleaseSpec(createValidReleaseSpec());
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test('validateReleaseSpec rejects a release spec missing required fields', () => {
  const { valid, errors } = validateReleaseSpec({ title: 'Missing tracklist and format' });
  assert.equal(valid, false);
  assert.ok(errors.length > 0);
});

test('validateReleaseSpec rejects a tracklist item missing an artist', () => {
  const releaseSpec = createValidReleaseSpec();
  releaseSpec.tracklist = [{ position: 'A1', title: 'Track One' }];
  const { valid, errors } = validateReleaseSpec(releaseSpec);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('artist')));
});

test('validateReleaseSpec rejects unsupported fields and format values', () => {
  const releaseSpec = createValidReleaseSpec();
  releaseSpec.format = ['Digital'];
  releaseSpec.extra = true;
  const { valid, errors } = validateReleaseSpec(releaseSpec);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('format')));
  assert.ok(errors.some((e) => e.includes('additional properties')));
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
