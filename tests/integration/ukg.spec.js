import { test, expect } from '@playwright/test';
import {
  openSiteFixture, pressShortcut, selectedText, isJobPage, findJobTitleUrl
} from '../helpers/site-fixture.js';

const BOARD_PATH = '/CEN1007CSM/JobBoard/aa765f66-90f1-4d6a-b9aa-a410743ab798';
const DETAIL = `${BOARD_PATH}/OpportunityDetail?opportunityId=80965f0e-7ff2-472a-82b7-c9a171869797`;
const JOB_URL = `https://recruiting.ultipro.com${DETAIL}`;
const FIXTURE = 'ukg-job-page.html';

test.describe('UKG - Job Page', () => {
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

  test('selects the title, posting details, and full description', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).toContain('Posted on November 20, 2026');
    expect(text).toContain('Tooele, UT, USA');
    expect(text).toContain('So, who are we looking for?');
    expect(text).toContain('Core Functions:');
  });

  test('selection starts at the title and ends with the description', async () => {
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Operator')).toBe(true);
    expect(text.endsWith('operating hoists, cranes, and forklifts.')).toBe(true);
  });

  test('does not select the qualifications or EEO footer', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).not.toContain('Equal Opportunity Employer');
    expect(text).not.toContain('Licenses & Certifications');
  });

  test('findJobTitleUrl returns the current page URL', async () => {
    expect(await findJobTitleUrl(page)).toBe(JOB_URL);
  });
});

test.describe('UKG - Other Hosts and Pages', () => {
  test('supports boards on rec.pro.ukg.net', async ({ browser }) => {
    const url = `https://centralstates.rec.pro.ukg.net${DETAIL}`;
    const page = await openSiteFixture(browser, url, FIXTURE);
    expect(await isJobPage(page)).toBe(true);
    await pressShortcut(page);
    expect((await selectedText(page)).trim().startsWith('Operator')).toBe(true);
    await page.close();
  });

  test('does not treat the job board search as a job page', async ({ browser }) => {
    const page = await openSiteFixture(browser, `https://recruiting.ultipro.com${BOARD_PATH}/`, FIXTURE);
    expect(await isJobPage(page)).toBe(false);
    expect(await findJobTitleUrl(page)).toBeNull();
    await page.close();
  });
});
