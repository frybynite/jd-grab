import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORIGIN = 'https://blackline.wd108.myworkdayjobs.com';
const DEDICATED_URL = `${ORIGIN}/BlackLineCareers/job/Remote-USA/Sr-Director--Engineering_001978`;
const PANEL_URL = `${ORIGIN}/en-US/BlackLineCareers/details/Senior-Manager--Marketing---UKI_002056`;
const SEARCH_URL = `${ORIGIN}/BlackLineCareers`;
const APPLY_URL = `${DEDICATED_URL}/apply`;

async function openFixture(browser, fixture, url) {
  const page = await browser.newPage();
  const html = fs.readFileSync(path.join(__dirname, '../fixtures', fixture), 'utf-8');

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

test.describe('Workday - Dedicated Job Page', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openFixture(browser, 'workday-dedicated-job-page.html', DEDICATED_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the dedicated job page', async () => {
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(true);
  });

  test('selects the title, job details, and full description', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = await selectedText(page);
    expect(text).toContain('Sr. Director, Engineering');
    expect(text).toContain('Remote USA');
    expect(text).toContain('Full time');
    expect(text).toContain('001978');
    expect(text).toContain('Make Your Mark:');
    expect(text).toContain("You'll Get To:");
    expect(text).toContain('BlackLine is committed to creating an inclusive');
  });

  test('selection starts at the title and ends with the description', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Sr. Director, Engineering')).toBe(true);
    expect(text.endsWith('please complete this form.')).toBe(true);
  });

  test('does not select page chrome or the sidebar', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = await selectedText(page);
    expect(text).not.toContain('Search for Jobs');
    expect(text).not.toContain('page is loaded');
    expect(text).not.toContain('Picture Yourself at Blackline');
    expect(text).not.toContain('Sidebar promo text that should NOT be selected');
    expect(text).not.toContain('Follow Us');
  });

  test('findJobTitleUrl returns the current page URL', async () => {
    expect(await page.evaluate(() => window.JDGrab.findJobTitleUrl())).toBe(DEDICATED_URL);
  });
});

test.describe('Workday - Search Results Panel', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openFixture(browser, 'workday-search-panel.html', PANEL_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the job details panel', async () => {
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(true);
  });

  test('selects the panel title through the end of the description', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Senior Manager, Marketing - UKI')).toBe(true);
    expect(text).toContain('End Date: December 31, 2026');
    expect(text).toContain('This is a digital-first, AI-led role.');
    expect(text.endsWith('please complete this form.')).toBe(true);
  });

  test('does not select the results list or the sidebar', async () => {
    await pressShortcut(page);
    await page.waitForTimeout(300);

    const text = await selectedText(page);
    expect(text).not.toContain('94 JOBS FOUND');
    expect(text).not.toContain('Senior Value Advisor');
    expect(text).not.toContain('Return to selected search result');
    expect(text).not.toContain('Sidebar promo text that should NOT be selected');
  });

  test('findJobTitleUrl returns the posting link from the panel header', async () => {
    expect(await page.evaluate(() => window.JDGrab.findJobTitleUrl()))
      .toBe(`${ORIGIN}/en-US/BlackLineCareers/job/Senior-Manager--Marketing---UKI_002056`);
  });
});

test.describe('Workday - Non-Job Pages', () => {
  test('does not treat the search page without a selected job as a job page', async ({ browser }) => {
    const page = await openFixture(browser, 'workday-search-panel.html', SEARCH_URL);
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(false);
    expect(await page.evaluate(() => window.JDGrab.findJobTitleUrl())).toBeNull();
    await page.close();
  });

  test('does not treat the application form as a job page', async ({ browser }) => {
    const page = await openFixture(browser, 'workday-dedicated-job-page.html', APPLY_URL);
    expect(await page.evaluate(() => window.JDGrab.isJobPage())).toBe(false);
    await page.close();
  });
});
