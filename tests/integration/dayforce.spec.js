import { test, expect } from '@playwright/test';
import {
  openSiteFixture, pressShortcut, selectedText, isJobPage, findJobTitleUrl
} from '../helpers/site-fixture.js';

const BOARD_URL = 'https://jobs.dayforcehcm.com/en-US/mydayforce/CANDIDATEPORTAL';
const JOB_URL = `${BOARD_URL}/jobs/85833`;
const FIXTURE = 'dayforce-job-page.html';

test.describe('Dayforce - Job Page', () => {
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

  test('selects the title, header details, and full description', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).toContain('Req #22017');
    expect(text).toContain('Mauritius');
    expect(text).toContain('Posted Sunday, July 6, 2025');
    expect(text).toContain('Dayforce is a global human capital management (HCM) company');
    expect(text).toContain('Why Dayforce?');
  });

  test('selection starts at the title and ends with the description', async () => {
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Your Next Journey!')).toBe(true);
    expect(text.endsWith('We encourage individuals to apply based on their passions.')).toBe(true);
  });

  test('does not select the Job Details list or QR code', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).not.toContain('Job Details');
    expect(text).not.toContain('Job Family');
    expect(text).not.toContain('Scan this QR code');
  });

  test('findJobTitleUrl returns the current page URL', async () => {
    expect(await findJobTitleUrl(page)).toBe(JOB_URL);
  });
});

test.describe('Dayforce - Non-Job Pages', () => {
  test('does not treat the job board as a job page', async ({ browser }) => {
    const page = await openSiteFixture(browser, BOARD_URL, FIXTURE);
    expect(await isJobPage(page)).toBe(false);
    expect(await findJobTitleUrl(page)).toBeNull();
    await page.close();
  });
});
