import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Built In - Job Matches Page', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    const htmlPath = path.join(__dirname, '../fixtures/builtin-job-matches-page.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    await page.route('https://builtin.com/**', route => {
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

    await page.goto('https://builtin.com/home/jobs/matches?preferenceId=abc&jobPreferenceEnum=All&jobid=11346415');

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
  }

  test('selects the current slide description on keyboard shortcut', async () => {
    await pressShortcut();

    const selectedText = await page.evaluate(() => window.getSelection().toString());
    expect(selectedText).toContain('Our Mission');
    expect(selectedText).toContain('Lead engineering teams adopting AI-assisted development practices');
    expect(selectedText).toContain('Final paragraph of the GDIT description.');
  });

  test('does not select hidden slides, summary, fit panel, or outside content', async () => {
    await pressShortcut();

    const selectedText = await page.evaluate(() => window.getSelection().toString());
    expect(selectedText).not.toContain('CannonDesign hidden slide description');
    expect(selectedText).not.toContain('Generated summary text');
    expect(selectedText).not.toContain('Am I A Good Fit?');
    expect(selectedText).not.toContain('Content outside job card that should NOT be selected');
  });

  test('expands the clipped description', async () => {
    await pressShortcut();

    const expanded = await page.evaluate(() =>
      document.querySelector('#match-body-11346415').parentElement.classList.contains('full-size'));
    expect(expanded).toBe(true);
  });

  test('ignores shortcut when typing in input field', async () => {
    await page.locator('#search-input').click();
    await pressShortcut();

    const selectedText = await page.evaluate(() => window.getSelection().toString());
    expect(selectedText).toBe('');
  });

  test('findJobTitleUrl returns the canonical job URL for the current slide', async () => {
    const url = await page.evaluate(() => window.JDGrab?.findJobTitleUrl?.() ?? null);
    expect(url).toBe('https://builtin.com/job/director-ai-assisted-software-engineering/11346415');
  });
});
