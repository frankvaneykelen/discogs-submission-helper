'use strict';

const DISCOGS_ADD_RELEASE_URL = 'https://www.discogs.com/release/add';
const DISCOGS_LOGIN_URL = 'https://www.discogs.com/users/login';

/**
 * Logs in to Discogs using credentials from the environment
 * (DISCOGS_USERNAME / DISCOGS_PASSWORD) unless a storage state
 * with an existing session was already loaded into the context.
 * @param {import('playwright').Page} page
 */
async function login(page) {
  const username = process.env.DISCOGS_USERNAME;
  const password = process.env.DISCOGS_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'DISCOGS_USERNAME and DISCOGS_PASSWORD environment variables are required to log in.'
    );
  }

  await page.goto(DISCOGS_LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('#username', username);
  await page.fill('#password', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('button[type="submit"]'),
  ]);
}

/**
 * Fills the basic release fields (title, country, released year, notes).
 * @param {import('playwright').Page} page
 * @param {object} releaseSpec
 */
async function fillBasicFields(page, releaseSpec) {
  if (releaseSpec.title) {
    await page.fill('input[name="title"]', releaseSpec.title);
  }
  if (releaseSpec.country) {
    await page.fill('input[name="country"]', releaseSpec.country);
  }
  if (releaseSpec.released) {
    await page.fill('input[name="released"]', String(releaseSpec.released));
  }
  if (releaseSpec.notes) {
    await page.fill('textarea[name="notes"]', releaseSpec.notes);
  }
}

/**
 * Selects/fills format-related tags (format, genre, style).
 * @param {import('playwright').Page} page
 * @param {object} releaseSpec
 */
async function fillFormats(page, releaseSpec) {
  const fields = [
    { values: releaseSpec.format, selector: 'input[name="format"]' },
    { values: releaseSpec.genre, selector: 'input[name="genre"]' },
    { values: releaseSpec.style, selector: 'input[name="style"]' },
  ];

  for (const { values, selector } of fields) {
    if (!values || !values.length) continue;
    for (const value of values) {
      await page.fill(selector, value);
      await page.press(selector, 'Enter');
    }
  }
}

/**
 * Adds tracklist rows one at a time, clicking "Add Track" before each
 * new row and waiting for it to appear before filling it in.
 * @param {import('playwright').Page} page
 * @param {Array<{position: string, artist?: string, title: string}>} tracklist
 */
async function fillTracklist(page, tracklist) {
  const rowSelector = '.tracklist_row';

  for (let i = 0; i < tracklist.length; i += 1) {
    const track = tracklist[i];

    await page.click('text=Add Track');
    await page.waitForSelector(`${rowSelector}:nth-child(${i + 1})`);

    const row = page.locator(rowSelector).nth(i);
    await row.locator('input[name="position"]').fill(track.position || '');
    await row.locator('input[name="artist"]').fill(track.artist || '');
    await row.locator('input[name="title"]').fill(track.title || '');
  }
}

/**
 * Fills the Discogs "Add Release" form from a release spec and then
 * pauses so a human can review the form before manually submitting it.
 * Automated/unattended submission is intentionally NOT performed, to
 * stay compliant with Discogs' rules against unattended bot submissions.
 * @param {import('playwright').Page} page
 * @param {object} releaseSpec
 * @param {{ skipLogin?: boolean, pause?: boolean }} [options]
 */
async function fillReleaseForm(page, releaseSpec, options = {}) {
  const { skipLogin = false, pause = true } = options;

  if (!skipLogin) {
    await login(page);
  }

  await page.goto(DISCOGS_ADD_RELEASE_URL, { waitUntil: 'domcontentloaded' });

  await fillBasicFields(page, releaseSpec);
  await fillFormats(page, releaseSpec);
  await fillTracklist(page, releaseSpec.tracklist || []);

  if (pause) {
    // Pause for manual review. The human reviewer is responsible for
    // clicking "Submit Release" themselves - this tool never does it.
    await page.pause();
  }
}

module.exports = {
  DISCOGS_ADD_RELEASE_URL,
  DISCOGS_LOGIN_URL,
  login,
  fillBasicFields,
  fillFormats,
  fillTracklist,
  fillReleaseForm,
};
