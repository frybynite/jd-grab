import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JOB_URL = 'https://www.welcometothejungle.com/en/companies/airbnb/jobs/engineering-manager-payments-aircover-insurance-platform_us_ermi3cmk';

test.describe('Welcome to the Jungle - Job Page (2026 layout)', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    const html = fs.readFileSync(path.join(__dirname, '../fixtures/wttj-job-page-2026.html'), 'utf-8');

    await page.route('https://www.welcometothejungle.com/**', route => {
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

    await page.goto(JOB_URL);

    await page.addScriptTag({ path: path.join(__dirname, '../../storage.js') });
    await page.addScriptTag({ path: path.join(__dirname, '../../content.js') });
    await page.waitForTimeout(500);
  });

  test.afterEach(async () => {
    await page.close();
  });

  async function pressShortcut() {
    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');
    await page.keyboard.press('S');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Alt');
    await page.waitForTimeout(100);
    return page.evaluate(() => window.getSelection().toString());
  }

  test('selects the header, description, and requirements', async () => {
    const selectedText = await pressShortcut();

    expect(selectedText).toContain('Engineering Manager (Payments)');
    expect(selectedText).toContain('Airbnb');
    expect(selectedText).toContain('Permanent');
    expect(selectedText).toContain('212K to 265K $ a year');
    expect(selectedText).toContain("You'll be working on");
    expect(selectedText).toContain('AirCover protects Hosts and guests');
    expect(selectedText).toContain('Benefits');
    expect(selectedText).toContain("We're looking for");
    expect(selectedText).toContain('10+ years of relevant experience');
  });

  test('selection starts at the title and ends with the requirements', async () => {
    const selectedText = (await pressShortcut()).trim();

    expect(selectedText.indexOf('Engineering Manager (Payments)')).toBeLessThan(selectedText.indexOf("You'll be working on"));
    expect(selectedText.endsWith('10+ years of relevant experience in backend platforms.')).toBe(true);
  });

  test('does not select nav, related jobs, or footer', async () => {
    const selectedText = await pressShortcut();

    expect(selectedText).not.toContain('Find a job');
    expect(selectedText).not.toContain('Explore the company');
    expect(selectedText).not.toContain('These job openings might interest you');
    expect(selectedText).not.toContain('Content outside job card that should NOT be selected');
  });

  test('ignores shortcut when typing in input field', async () => {
    await page.locator('#search-input').click();
    const selectedText = await pressShortcut();
    expect(selectedText).toBe('');
  });

  test('isJobPage detects the job page', async () => {
    const result = await page.evaluate(() => window.JDGrab?.isJobPage?.() ?? null);
    expect(result).toBe(true);
  });

  test('findJobTitleUrl returns the current URL', async () => {
    const url = await page.evaluate(() => window.JDGrab?.findJobTitleUrl?.() ?? null);
    expect(url).toBe(JOB_URL);
  });
});
