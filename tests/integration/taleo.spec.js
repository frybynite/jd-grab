import { test, expect } from '@playwright/test';
import {
  openSiteFixture, pressShortcut, selectedText, isJobPage, findJobTitleUrl
} from '../helpers/site-fixture.js';

const SECTION_URL = 'https://epco.taleo.net/careersection/2';
// Opening a job from the list posts a form, so the URL has no job id.
const POSTED_URL = `${SECTION_URL}/jobdetail.ftl`;
const DIRECT_URL = `${SECTION_URL}/jobdetail.ftl?job=000HC3&lang=en`;
const FIXTURE = 'taleo-job-page.html';

test.describe('Taleo - Job Page', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await openSiteFixture(browser, POSTED_URL, FIXTURE);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('detects the job page', async () => {
    expect(await isJobPage(page)).toBe(true);
  });

  test('selects the title, description, qualifications, and job fields', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).toContain('000HC3');
    expect(text).toContain('The Field Environmental Manager leads a team');
    expect(text).toContain('Qualifications');
    expect(text).toContain('USA-Texas-Houston');
  });

  test('selection starts at the title and ends with the last job field', async () => {
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith('Manager, Field Environmental')).toBe(true);
    // Taleo puts a non-breaking space between the colon and the value.
    expect(text).toMatch(/Job Level\s*:\s*Manager$/);
  });

  test('does not select navigation or the pager', async () => {
    await pressShortcut(page);
    const text = await selectedText(page);
    expect(text).not.toContain('Back to prior page');
    expect(text).not.toContain('Printable Format');
    expect(text).not.toContain('Job 1 out of 84');
  });

  test('findJobTitleUrl rebuilds a shareable URL from the requisition number', async () => {
    expect(await findJobTitleUrl(page)).toBe(`${POSTED_URL}?job=000HC3`);
  });
});

test.describe('Taleo - Other Pages', () => {
  test('findJobTitleUrl keeps a URL that already names the job', async ({ browser }) => {
    const page = await openSiteFixture(browser, DIRECT_URL, FIXTURE);
    expect(await isJobPage(page)).toBe(true);
    expect(await findJobTitleUrl(page)).toBe(DIRECT_URL);
    await page.close();
  });

  test('does not treat the job list as a job page', async ({ browser }) => {
    const page = await openSiteFixture(browser, `${SECTION_URL}/joblist.ftl`, FIXTURE);
    expect(await isJobPage(page)).toBe(false);
    expect(await findJobTitleUrl(page)).toBeNull();
    await page.close();
  });
});
