import { test, expect } from '@playwright/test';
import {
  openSiteFixture, pressShortcut, selectedText, isJobPage, findJobTitleUrl
} from '../helpers/site-fixture.js';

// Monster and CareerBuilder run the same job search app with identical
// markup; only the posting path differs. The fixtures were captured on
// Monster, so CareerBuilder runs swap the posting path in the card links.
const SITES = [
  { name: 'Monster', origin: 'https://www.monster.com', postingPath: 'job-openings' },
  { name: 'CareerBuilder', origin: 'https://www.careerbuilder.com', postingPath: 'job-details' },
];

const SLUG = 'engineer-body-ee-subsystem-and-software-interface-specialist-novi-mi--41ef1eb3-0b18-48bb-abc0-5123001bd095';
const TITLE = 'Engineer, Body EE Subsystem and Software Interface Specialist';
const LAST_LINE = 'Automotive electronics supplier experience is desirable.';

for (const site of SITES) {
  const jobUrl = `${site.origin}/${site.postingPath}/${SLUG}`;
  const searchUrl = `${site.origin}/jobs/search?q=software+engineer&page=1`;
  const options = {
    transformHtml: html => html.replaceAll('/job-openings/', `/${site.postingPath}/`),
  };

  test.describe(`${site.name} - Search Results Panel`, () => {
    let page;

    test.beforeEach(async ({ browser }) => {
      page = await openSiteFixture(browser, searchUrl, 'monster-search-panel.html', options);
    });

    test.afterEach(async () => {
      await page.close();
    });

    test('detects the open job in the panel', async () => {
      expect(await isJobPage(page)).toBe(true);
    });

    test('selects from the panel title through the description', async () => {
      await pressShortcut(page);
      const text = (await selectedText(page)).trim();
      expect(text.startsWith(TITLE)).toBe(true);
      expect(text).toContain('Novi, MI');
      expect(text).toContain('Department: Body Electronics');
      expect(text.endsWith(LAST_LINE)).toBe(true);
    });

    test('does not select the results list or Numbers & Facts', async () => {
      await pressShortcut(page);
      const text = await selectedText(page);
      expect(text).not.toContain('DCS Corp');
      expect(text).not.toContain('Numbers & Facts');
      expect(text).not.toContain('Headquarters');
    });

    test('findJobTitleUrl returns the selected card\'s posting URL', async () => {
      expect(await findJobTitleUrl(page)).toBe(jobUrl);
    });

    test('is not a job page until a job is open in the panel', async () => {
      await page.evaluate(() => document.querySelector('[data-testid="svx-job-view-wrapper"]').remove());
      expect(await isJobPage(page)).toBe(false);
    });
  });

  test.describe(`${site.name} - Job Page`, () => {
    let page;

    test.beforeEach(async ({ browser }) => {
      page = await openSiteFixture(browser, jobUrl, 'monster-job-page.html', options);
    });

    test.afterEach(async () => {
      await page.close();
    });

    test('detects the job page', async () => {
      expect(await isJobPage(page)).toBe(true);
    });

    test('expands the clamped description and selects through it', async () => {
      await pressShortcut(page);
      const toggle = page.locator('[data-testid="description-show-more-toggle"]');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      const text = (await selectedText(page)).trim();
      expect(text.startsWith(TITLE)).toBe(true);
      expect(text.endsWith(LAST_LINE)).toBe(true);
      expect(text).not.toContain('Show less');
    });

    test('does not select Numbers & Facts or the skills section', async () => {
      await pressShortcut(page);
      const text = await selectedText(page);
      expect(text).not.toContain('Numbers & Facts');
      expect(text).not.toContain('Electrical Design');
    });

    test('pressing the shortcut again leaves the description expanded', async () => {
      await pressShortcut(page);
      await pressShortcut(page);
      const toggle = page.locator('[data-testid="description-show-more-toggle"]');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    test('findJobTitleUrl returns the current page URL', async () => {
      expect(await findJobTitleUrl(page)).toBe(jobUrl);
    });
  });
}

test.describe('CareerBuilder - Description Without a Clamp', () => {
  // Short descriptions on CareerBuilder's posting page render without the
  // "Show more" clamp and toggle.
  test('selects through the description container', async ({ browser }) => {
    const url = `https://www.careerbuilder.com/job-details/${SLUG}`;
    const page = await openSiteFixture(browser, url, 'monster-job-page.html');
    await page.evaluate(() => {
      document.querySelector('[data-testid="description-show-more-toggle"]').remove();
      const clamp = document.querySelector('[data-testid="description-clamp-wrapper"]');
      clamp.replaceWith(...clamp.childNodes);
    });
    await pressShortcut(page);
    const text = (await selectedText(page)).trim();
    expect(text.startsWith(TITLE)).toBe(true);
    expect(text.endsWith(LAST_LINE)).toBe(true);
    await page.close();
  });
});
