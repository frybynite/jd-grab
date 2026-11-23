import { test, expect } from '@playwright/test';
import {
  openSiteFixture, pressShortcut, selectedText, isJobPage, findJobTitleUrl
} from '../helpers/site-fixture.js';

const ORIGIN = 'https://ats.rippling.com';
const JOB_URL = `${ORIGIN}/rippling/jobs/528f45e5-4c17-4fb7-affe-41e0c12c7c15`;
const FIXTURE = 'rippling-job-page.html';

test.describe('Rippling - Job Page', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openSiteFixture(browser, JOB_URL, FIXTURE);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the job page', async () => {
    expect(await isJobPage(page)).toBe(true);
  });

  test('selects from the title through the description', async () => {
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Account Executive, Broker Channel (Dallas)')).toBe(true);
    expect(text).toContain('About Rippling');
    expect(text).toContain('What you will do');
    expect(text.endsWith('(60/40 commission split for base/variable pay')).toBe(true);
  });

  test('does not select the Apply button, department, location, or share links', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).not.toContain('Apply now');
    expect(text).not.toContain('Remote (Dallas, Texas, US)');
    expect(text).not.toContain('Share on:');
  });

  test('findJobTitleUrl returns the posting URL', async () => {
    expect(await findJobTitleUrl(page)).toBe(JOB_URL);
  });
});

test.describe('Rippling - Localized Job Page', () => {
  test('detects a posting with a locale prefix', async ({ browser }) => {
    const url = `${ORIGIN}/en-GB/rippling/jobs/528f45e5-4c17-4fb7-affe-41e0c12c7c15`;
    const page = await openSiteFixture(browser, url, FIXTURE);
    expect(await isJobPage(page)).toBe(true);
    expect(await findJobTitleUrl(page)).toBe(url);
    await page.close();
  });
});

test.describe('Rippling - Non-Job Pages', () => {
  test('does not treat the job list as a job page', async ({ browser }) => {
    const page = await openSiteFixture(browser, `${ORIGIN}/rippling/jobs`, FIXTURE);
    expect(await isJobPage(page)).toBe(false);
    expect(await findJobTitleUrl(page)).toBeNull();
    await page.close();
  });

  test('does not treat the application form as a job page', async ({ browser }) => {
    const page = await openSiteFixture(
      browser, `${JOB_URL}/apply`, FIXTURE
    );
    expect(await isJobPage(page)).toBe(false);
    await page.close();
  });
});
