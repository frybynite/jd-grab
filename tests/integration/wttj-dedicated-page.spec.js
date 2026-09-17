import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Welcome to the Jungle - Dedicated Job Page', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    const htmlPath = path.join(__dirname, '../fixtures/wttj-dedicated-page.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

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

    await page.goto('https://www.welcometothejungle.com/en/companies/affirm/jobs/software-engineering-manager-app-experiences_new-york_afq6dk4m');

    await page.addScriptTag({ path: path.join(__dirname, '../../storage.js') });
    await page.addScriptTag({ path: path.join(__dirname, '../../content.js') });
    await page.waitForTimeout(500);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('selects job description on keyboard shortcut', async () => {
    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');
    await page.keyboard.press('S');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Alt');

    await page.waitForTimeout(100);

    const selectedText = await page.evaluate(() => window.getSelection().toString());

    expect(selectedText).toContain('Job description');
    expect(selectedText).toContain('The Engineering team builds systems');
    expect(selectedText).toContain('Preferred experience');
    expect(selectedText).toContain('7+ years of software engineering experience');
  });

  test('does not select company, FAQ or related-jobs sections', async () => {
    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');
    await page.keyboard.press('S');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Alt');

    await page.waitForTimeout(100);

    const selectedText = await page.evaluate(() => window.getSelection().toString());

    expect(selectedText).not.toContain('Who are they?');
    expect(selectedText).not.toContain('Questions and answers about the job');
    expect(selectedText).not.toContain('These job openings might interest you');
    expect(selectedText).not.toContain('Share on LinkedIn');
  });

  test('does not select content outside job card', async () => {
    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');
    await page.keyboard.press('S');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Alt');

    await page.waitForTimeout(100);

    const selectedText = await page.evaluate(() => window.getSelection().toString());
    expect(selectedText).not.toContain('Content outside job card that should NOT be selected');
  });

  test('ignores shortcut when typing in input field', async () => {
    await page.locator('#search-input').click();

    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');
    await page.keyboard.press('S');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Alt');

    await page.waitForTimeout(100);

    const selectedText = await page.evaluate(() => window.getSelection().toString());
    expect(selectedText).toBe('');
  });

  test('isJobPage detects new company job URL shape', async () => {
    const result = await page.evaluate(() => window.JDGrab?.isJobPage?.() ?? null);
    expect(result).toBe(true);
  });

  test('findJobTitleUrl returns current URL on dedicated page', async () => {
    const url = await page.evaluate(() => {
      return window.JDGrab?.findJobTitleUrl?.() ?? null;
    });

    expect(url).toContain('welcometothejungle.com');
    expect(url).toContain('/companies/affirm/jobs/software-engineering-manager-app-experiences_new-york_afq6dk4m');
  });
});
