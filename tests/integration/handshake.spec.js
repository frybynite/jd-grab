import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEARCH_URL = 'https://app.joinhandshake.com/job-search/11427915?page=1&per_page=25';
const JOB_URL = 'https://app.joinhandshake.com/jobs/11427915?searchId=8f7e5832-99a1-4cb9-a288-99ea98f2b9fa';

async function openFixture(browser, fixture, url) {
  const page = await browser.newPage();
  const html = fs.readFileSync(path.join(__dirname, '../fixtures', fixture), 'utf-8');

  await page.route('https://app.joinhandshake.com/**', route => {
    route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.addInitScript(() => {
    window.chrome = {
      storage: {
        local: {
          get(keys, callback) {
            callback({
              keyboardShortcut: {
                key: 'S', code: 'KeyS',
                altKey: true, ctrlKey: false, shiftKey: true, metaKey: false
              }
            });
          }
        },
        onChanged: { addListener: () => {} }
      },
      runtime: { onMessage: { addListener: () => {} }, sendMessage: () => {} }
    };
  });

  await page.goto(url);
  await page.addScriptTag({ path: path.join(__dirname, '../../storage.js') });
  await page.addScriptTag({ path: path.join(__dirname, '../../content.js') });
  await page.waitForTimeout(500);
  return page;
}

async function pressShortcut(page) {
  await page.keyboard.down('Alt');
  await page.keyboard.down('Shift');
  await page.keyboard.press('S');
  await page.keyboard.up('Shift');
  await page.keyboard.up('Alt');
}

const selectedText = (page) => page.evaluate(() => window.getSelection().toString());

test.describe('Handshake - Search Results Two-Pane Layout', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openFixture(browser, 'handshake-search-panel.html', SEARCH_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('expands the truncated description, then selects title through "What this job offers"', async () => {
    await pressShortcut(page);
    // Fixture expands asynchronously (150ms) after "More" is clicked.
    await page.waitForTimeout(700);

    const text = await selectedText(page);
    expect(text).toContain('Software and Web Developer');
    expect(text).toContain('At a glance');
    expect(text).toContain('$60–70K/yr');
    expect(text).toContain('Job description');
    expect(text).toContain('Shepherd’s Finance is looking for a Software & Web Applications Developer');
    expect(text).toContain('Build and maintain internal web applications');
    expect(text).toContain("What they're looking for");
    expect(text).toContain('What this job offers');
    expect(text).toContain('Paid sick leave');
  });

  test('does not select employer blurb, similar jobs, or the results list', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(700);

    const text = await selectedText(page);
    expect(text).not.toContain('About the employer');
    expect(text).not.toContain('Similar Jobs');
    expect(text).not.toContain('Red Bud Industries');
    expect(text).not.toContain('Content outside job details that should NOT be selected');
  });

  test('ignores shortcut when typing in input field', async () => {
    await page.locator('#search-input').click();
    await pressShortcut(page);
    await page.waitForTimeout(700);
    expect(await selectedText(page)).toBe('');
  });

  test('isJobPage is true on the search URL with a selected job', async () => {
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(true);
  });

  test('findJobTitleUrl returns the canonical job URL from the title link', async () => {
    const url = await page.evaluate(() => window.JDGrab.findJobTitleUrl());
    expect(url).toBe(JOB_URL);
  });
});

test.describe('Handshake - Dedicated Job Page', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openFixture(browser, 'handshake-job-page.html', JOB_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('selects title through "What this job offers" when description is already expanded', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = await selectedText(page);
    expect(text).toContain('Software and Web Developer');
    expect(text).toContain('At a glance');
    expect(text).toContain('Job description');
    expect(text).toContain('Shepherd’s Finance is looking for a Software & Web Applications Developer');
    expect(text).toContain('What this job offers');
    expect(text).toContain('Paid sick leave');
    expect(text).not.toContain('About the employer');
    expect(text).not.toContain('Similar Jobs');
    expect(text).not.toContain('Content outside job details that should NOT be selected');
  });

  test('isJobPage is true on the dedicated job URL', async () => {
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(true);
  });

  test('findJobTitleUrl returns the canonical job URL', async () => {
    const url = await page.evaluate(() => window.JDGrab.findJobTitleUrl());
    expect(url).toBe(JOB_URL);
  });
});
