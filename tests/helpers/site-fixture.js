import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

// Serves a saved fixture at a real site URL, mocks chrome.storage with the
// default Alt+Shift+S shortcut, and injects storage.js then content.js, the
// same order manifest.json uses. `transformHtml` lets one fixture stand in
// for sites that share markup but differ in details such as link paths.
export async function openSiteFixture(browser, url, fixtureFile, { transformHtml = html => html } = {}) {
  const page = await browser.newPage();
  const html = transformHtml(
    fs.readFileSync(path.join(ROOT, 'tests/fixtures', fixtureFile), 'utf-8')
  );
  const origin = new URL(url).origin;

  await page.route(requestUrl => requestUrl.origin === origin, route => {
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
  await page.addScriptTag({ path: path.join(ROOT, 'storage.js') });
  await page.addScriptTag({ path: path.join(ROOT, 'content.js') });
  await page.waitForTimeout(500);
  return page;
}

export async function pressShortcut(page) {
  await page.keyboard.down('Alt');
  await page.keyboard.down('Shift');
  await page.keyboard.press('S');
  await page.keyboard.up('Shift');
  await page.keyboard.up('Alt');
  await page.waitForTimeout(300);
}

export const selectedText = (page) => page.evaluate(() => window.getSelection().toString());
export const isJobPage = (page) => page.evaluate(() => window.JDGrab.isJobPage());
export const findJobTitleUrl = (page) => page.evaluate(() => window.JDGrab.findJobTitleUrl());
