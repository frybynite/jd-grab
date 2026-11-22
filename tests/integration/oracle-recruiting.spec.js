import { test, expect } from '@playwright/test';
import {
  openSiteFixture, pressShortcut, selectedText, isJobPage, findJobTitleUrl
} from '../helpers/site-fixture.js';

const SITE_URL = 'https://eeho.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/jobsearch';
const JOB_URL = `${SITE_URL}/job/346142`;
const PREVIEW_URL = `${SITE_URL}/jobs/preview/346142?keyword=collections&mode=location`;
const FIXTURE = 'oracle-recruiting-job-page.html';

test.describe('Oracle Recruiting - Job Page', () => {
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

  test('selects every headed section of the posting', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).toContain('BUCHAREST, Romania');
    expect(text).toContain('Job Identification');
    expect(text).toContain('Join Our Team at Oracle!');
    expect(text).toContain('Responsibilities');
    expect(text).toContain('Required Skills');
    expect(text).toContain('About Us');
  });

  test('selection starts at the title and ends with the last section', async () => {
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Collections Analyst with Portuguese - evening shift')).toBe(true);
    expect(text.endsWith('1-888-404-2494 in the United States.')).toBe(true);
  });

  test('does not select the apply button, similar jobs, or navigation', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).not.toContain('View More Jobs');
    expect(text).not.toContain('Apply Now');
    expect(text).not.toContain('Similar Jobs');
    expect(text).not.toContain('See More Jobs');
  });

  test('findJobTitleUrl returns the posting URL', async () => {
    expect(await findJobTitleUrl(page)).toBe(JOB_URL);
  });
});

test.describe('Oracle Recruiting - Search Preview and Other Pages', () => {
  test('selects the posting in the search results preview', async ({ browser }) => {
    const page = await openSiteFixture(browser, PREVIEW_URL, FIXTURE);
    expect(await isJobPage(page)).toBe(true);
    await pressShortcut(page);
    expect((await selectedText(page)).trim().startsWith('Collections Analyst')).toBe(true);
    await page.close();
  });

  test('maps the preview to the posting URL', async ({ browser }) => {
    const page = await openSiteFixture(browser, PREVIEW_URL, FIXTURE);
    expect(await findJobTitleUrl(page)).toBe(JOB_URL);
    await page.close();
  });

  test('does not treat the job search as a job page', async ({ browser }) => {
    const page = await openSiteFixture(browser, `${SITE_URL}/jobs`, FIXTURE);
    expect(await isJobPage(page)).toBe(false);
    expect(await findJobTitleUrl(page)).toBeNull();
    await page.close();
  });
});
