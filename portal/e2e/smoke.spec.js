import { test, expect } from '@playwright/test';

test('every page loads and the hero case walks through all tabs', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Subjects' })).toBeVisible();
  await expect(page.getByText('Total Subjects')).toBeVisible();
  await expect(page.getByText('Vetting Pipeline')).toBeVisible();

  await page.goto('/#/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  for (const persona of ['Investigator', 'Analyst', 'Adjudicator']) {
    await page.getByLabel('Persona').selectOption({ label: persona });
    await expect(page.locator('.kpi-grid .kpi-card').first()).toBeVisible();
  }

  await page.goto('/#/cases?q=okafor');
  await page.getByText('Daniel R. Okafor').click();
  await expect(page.getByRole('heading', { name: 'Daniel R. Okafor' })).toBeVisible();
  await expect(page.getByText('Eligibility: Interim')).toBeVisible();
  for (const tab of ['Overview', 'Guidelines', 'Investigation', 'Adjudication',
    'Continuous Vetting', 'Documents']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  }
  // Full identity (SSN, demographics) lives on the Overview tab.
  await page.getByRole('tab', { name: 'Overview' }).click();
  await expect(page.getByText('923-04-4821').first()).toBeVisible();

  // Record-check drill-down: Bell's police report opens from the Investigation tab.
  await page.goto('/#/cases/SUBJ-002?tab=investigation');
  await page.getByRole('button', { name: /police report retrieval/i }).click();
  await page.getByRole('button', { name: /view document/i }).click();
  await expect(page.getByText(/Arrest report 26-044812/)).toBeVisible();

  await page.goto('/#/alerts');
  await expect(page.getByRole('heading', { name: 'CV Alerts' })).toBeVisible();
  await page.goto('/#/providers');
  await expect(page.getByRole('heading', { name: 'FBI CJIS / NCIC + Rap Back' })).toBeVisible();
  await page.goto('/#/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
});
