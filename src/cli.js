#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const { loadReleaseSpec } = require('./releaseSpec');
const { fillReleaseForm } = require('./discogsSubmission');

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node src/cli.js <path-to-release-spec.json>');
    process.exitCode = 1;
    return;
  }

  const releaseSpec = loadReleaseSpec(filePath);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await fillReleaseForm(page, releaseSpec);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
