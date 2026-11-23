import { test, expect } from '@playwright/test';
import {
  openSiteFixture, pressShortcut, selectedText, isJobPage, findJobTitleUrl
} from '../helpers/site-fixture.js';

const CAREERS_ORIGIN = 'https://apply.workable.com';
const CAREERS_JOB_URL = `${CAREERS_ORIGIN}/huggingface/j/2F83B48969/`;
const CAREERS_FIXTURE = 'workable-job-page.html';

const SEARCH_ORIGIN = 'https://jobs.workable.com';
const VIEW_URL = `${SEARCH_ORIGIN}/view/g1erLuMsQn5KngFejkVH5d/hybrid-software-engineer-in-munich-at-usercentrics`;
const SEARCH_JOB_ID = '79815d7f-16d9-4488-8b7d-03c3f0b05b30';
const SEARCH_URL = `${SEARCH_ORIGIN}/search?query=software+engineer&selectedJobId=${SEARCH_JOB_ID}`;

test.describe('Workable - Company Job Board Posting', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openSiteFixture(browser, CAREERS_JOB_URL, CAREERS_FIXTURE);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the job page', async () => {
    expect(await isJobPage(page)).toBe(true);
  });

  test('selects from the title through the benefits section', async () => {
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Senior Software Engineer, Bot Detection')).toBe(true);
    expect(text).toContain('Remote');
    expect(text).toContain("At Hugging Face, we're on a journey");
    expect(text).toContain('You have solid hands-on experience in bot detection');
    expect(text.endsWith('Join a community supporting the ML/AI community.')).toBe(true);
  });

  test('does not select the Apply button', async () => {
    await pressShortcut(page);
    expect(await selectedText(page)).not.toContain('Apply for this job');
  });

  test('ends at the last section present', async () => {
    await page.evaluate(() => document.querySelector('[data-ui="job-benefits"]').remove());
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.endsWith('a real person is on the other side.')).toBe(true);
  });

  test('findJobTitleUrl returns the posting URL', async () => {
    expect(await findJobTitleUrl(page)).toBe(CAREERS_JOB_URL);
  });
});

test.describe('Workable - Company Job Board Non-Job Pages', () => {
  test('does not treat the job list as a job page', async ({ browser }) => {
    const page = await openSiteFixture(browser, `${CAREERS_ORIGIN}/huggingface/`, CAREERS_FIXTURE);
    expect(await isJobPage(page)).toBe(false);
    expect(await findJobTitleUrl(page)).toBeNull();
    await page.close();
  });

  test('does not treat the application form as a job page', async ({ browser }) => {
    const page = await openSiteFixture(browser, `${CAREERS_JOB_URL}apply/`, CAREERS_FIXTURE);
    expect(await isJobPage(page)).toBe(false);
    await page.close();
  });
});

test.describe('Workable - Job Search Posting Page', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openSiteFixture(browser, VIEW_URL, 'workable-jobs-view-page.html');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the job page', async () => {
    expect(await isJobPage(page)).toBe(true);
  });

  test('selects from the title through the benefits section', async () => {
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Software Engineer')).toBe(true);
    expect(text).toContain('Munich, Bavaria, Germany');
    expect(text).toContain('Experience with TypeScript and Node.js');
    expect(text.endsWith('We look forward to your application.')).toBe(true);
  });

  test('does not select "More about" the company', async () => {
    await pressShortcut(page);
    expect(await selectedText(page)).not.toContain('More about Usercentrics');
  });

  test('findJobTitleUrl returns the posting URL', async () => {
    expect(await findJobTitleUrl(page)).toBe(VIEW_URL);
  });
});

test.describe('Workable - Job Search Results Dialog', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openSiteFixture(browser, SEARCH_URL, 'workable-jobs-search-dialog.html');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the open job', async () => {
    expect(await isJobPage(page)).toBe(true);
  });

  test('selects the open job, not the results list', async () => {
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Software Engineer')).toBe(true);
    expect(text).not.toContain('at Station');
    expect(text).not.toContain('Back to results');
    expect(text.endsWith('We look forward to your application.')).toBe(true);
  });

  test('findJobTitleUrl returns the posting URL for the selected job', async () => {
    expect(await findJobTitleUrl(page)).toBe(`${SEARCH_ORIGIN}/view/${SEARCH_JOB_ID}`);
  });

  test('is not a job page without an open job', async () => {
    await page.evaluate(() => document.querySelector('dialog').remove());
    expect(await isJobPage(page)).toBe(false);
  });
});
