import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORIGIN = 'https://regroup.bamboohr.com';
const JOB_URL = `${ORIGIN}/careers/90`;
const LIST_URL = `${ORIGIN}/careers`;

async function openFixture(browser, url) {
  const page = await browser.newPage();
  const html = fs.readFileSync(path.join(__dirname, '../fixtures/bamboohr-job-page.html'), 'utf-8');

  await page.route(`${ORIGIN}/**`, route => {
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

test.describe('BambooHR - Job Page', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openFixture(browser, JOB_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the job page', async () => {
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(true);
  });

  test('selects the title, department line, and full description', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = await selectedText(page);
    expect(text).toContain('Director of Engineering');
    expect(text).toContain('Product Development - United States (Remote)');
    expect(text).toContain('Regroup Mass Notification');
    expect(text).toContain('Show us what you');
    expect(text).toContain('A background check is required.');
  });

  test('selection starts at the title and ends with the description', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Director of Engineering')).toBe(true);
    expect(text.endsWith('reliable home internet connection are a must.')).toBe(true);
  });

  test('does not select the back link, sidebar, or footer', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = await selectedText(page);
    expect(text).not.toContain('Job Openings');
    expect(text).not.toContain('Apply for This Job');
    expect(text).not.toContain('Link to This Job');
    expect(text).not.toContain('Minimum Experience');
    expect(text).not.toContain('Terms of Service');
  });

  test('findJobTitleUrl returns the current page URL', async () => {
    expect(await page.evaluate(() => window.JDGrab.findJobTitleUrl())).toBe(JOB_URL);
  });
});

test.describe('BambooHR - Non-Job Pages', () => {
  test('does not treat the job list as a job page', async ({ browser }) => {
    const page = await openFixture(browser, LIST_URL);
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(false);
    expect(await page.evaluate(() => window.JDGrab.findJobTitleUrl())).toBeNull();
    await page.close();
  });
});
