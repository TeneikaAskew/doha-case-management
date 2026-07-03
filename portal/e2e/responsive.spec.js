import { test, expect } from '@playwright/test';

// No page may scroll horizontally at any supported size (CLAUDE.md: the shell
// adapts at 1080/900/640; wide tables scroll inside their own containers).
const VIEWPORTS = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'phablet', width: 480, height: 860 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1720, height: 1000 },
];

const ROUTES = [
  '/#/',
  '/#/dashboard',
  '/#/cases',
  '/#/cases/SUBJ-001?tab=overview',
  '/#/cases/SUBJ-001?tab=guidelines',
  '/#/cases/SUBJ-002?tab=investigation',
  '/#/cases/SUBJ-001?tab=adjudication',
  '/#/cases/SUBJ-002?tab=continuous-vetting',
  '/#/cases/SUBJ-002?tab=documents',
  '/#/alerts',
  '/#/providers',
  '/#/analytics',
  '/#/help',
];

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow on any page at ${vp.name} (${vp.width}px)`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    await context.addInitScript(() => localStorage.setItem('demo.session', 'active'));
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForSelector('.page');
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, `${route} overflows by ${overflow}px at ${vp.width}px`)
        .toBeLessThanOrEqual(1);
    }
    await context.close();
  });
}

test('sign-in screen has no horizontal overflow at phone width', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForSelector('.signin-card');
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
  await context.close();
});
