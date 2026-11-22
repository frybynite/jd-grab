import { test, expect } from '@playwright/test';
import {
  openSiteFixture, pressShortcut, selectedText, isJobPage, findJobTitleUrl
} from '../helpers/site-fixture.js';

const ORIGIN = 'https://www.levels.fyi';
const SEARCH_URL = `${ORIGIN}/jobs?searchText=software+engineer&jobId=17g8nv1trq8cz`;
const FIXTURE = 'levelsfyi-job-pane.html';

test.describe('Levels.fyi - Job Pane', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openSiteFixture(browser, SEARCH_URL, FIXTURE);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the open job', async () => {
    expect(await isJobPage(page)).toBe(true);
  });

  test('selects from the title through the description', async () => {
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Founding Product Designer')).toBe(true);
    expect(text).toContain('Slash · 3 months ago · San Francisco, CA · On-site');
    expect(text).toContain('Slash is building the future of business banking');
    expect(text.endsWith('has a strong in-person culture.')).toBe(true);
  });

  test('does not select the Show More button or Company Details', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).not.toContain('Show More');
    expect(text).not.toContain('Company Details');
  });

  test('expands the collapsed description', async () => {
    await page.evaluate(() => {
      window.__toggleClicks = 0;
      document.querySelector('button[class*="_showMoreOrLess"]')
        .addEventListener('click', () => { window.__toggleClicks += 1; });
    });
    await pressShortcut(page);
    expect(await page.evaluate(() => window.__toggleClicks)).toBe(1);
  });

  test('findJobTitleUrl returns the job link without search filters', async () => {
    expect(await findJobTitleUrl(page)).toBe(`${ORIGIN}/jobs?jobId=17g8nv1trq8cz`);
  });

  test('is not a job page without an open job', async () => {
    await page.evaluate(() => document.querySelector('[class*="_jobDetailContainer"]').remove());
    expect(await isJobPage(page)).toBe(false);
  });
});

test.describe('Levels.fyi - Non-Job Pages', () => {
  test('does not treat salary pages as job pages', async ({ browser }) => {
    const page = await openSiteFixture(browser, `${ORIGIN}/companies/slash/salaries`, FIXTURE);
    expect(await isJobPage(page)).toBe(false);
    expect(await findJobTitleUrl(page)).toBeNull();
    await page.close();
  });
});
