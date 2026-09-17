import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JOB_URL = 'https://www.remoterocketship.com/us/publicjobs/company/unity/jobs/manager-software-engineering-washington-remote-2/';
const NON_JOB_URL = 'https://www.remoterocketship.com/us/company/unity/';

async function openFixture(browser, url) {
  const page = await browser.newPage();
  const html = fs.readFileSync(
    path.join(__dirname, '../fixtures/remoterocketship-dedicated-job-page.html'), 'utf-8');

  await page.route('https://www.remoterocketship.com/**', route => {
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

test.describe('Remote Rocketship - Dedicated Job Page', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openFixture(browser, JOB_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the dedicated job page', async () => {
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(true);
  });

  test('selects company banner, title, and Description through Benefits', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = await selectedText(page);
    expect(text).toContain('Unity');
    expect(text).toContain('5001 - 10000 employees');
    expect(text).toContain('Manager, Software Engineering');
    expect(text).toContain('$135.8k - $203.6k / year');
    expect(text).toContain('Description');
    expect(text).toContain('Lead a new team delivering Unity platform support');
    expect(text).toContain('Requirements');
    expect(text).toContain('Experience developing and managing a high-performance software');
    expect(text).toContain('Benefits');
    expect(text).toContain('Volunteering and donation matching program');
  });

  test('selection starts at the company name and ends with the Benefits text', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Unity')).toBe(true);
    expect(text.endsWith('Volunteering and donation matching program')).toBe(true);
  });

  test('does not select page chrome or similar jobs', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = await selectedText(page);
    expect(text).not.toContain('Search Remote Jobs');
    expect(text).not.toContain('Similar Jobs');
    expect(text).not.toContain('Similar job card that should NOT be selected');
  });

  test('findJobTitleUrl returns the current page URL', async () => {
    expect(await page.evaluate(() => window.JDGrab.findJobTitleUrl())).toBe(JOB_URL);
  });
});

test.describe('Remote Rocketship - Non-Job Page', () => {
  test('does not treat a company page as a job page', async ({ browser }) => {
    const page = await openFixture(browser, NON_JOB_URL);
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(false);
    expect(await page.evaluate(() => window.JDGrab.findJobTitleUrl())).toBeNull();
    await page.close();
  });
});
