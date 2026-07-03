import { test, expect } from '@playwright/test';

test('every page loads and the hero case walks through all tabs', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  for (const persona of ['Investigator', 'Analyst', 'Adjudicator']) {
    await page.getByLabel('Persona').selectOption({ label: persona });
    await expect(page.locator('.kpi-grid .kpi-card').first()).toBeVisible();
  }

  await page.goto('/#/cases?q=okafor');
  await page.getByText('Daniel R. Okafor').click();
  await expect(page.getByText('***-**-4821')).toBeVisible();
  for (const tab of ['Overview', 'Guidelines', 'Investigation', 'Adjudication',
    'Continuous vetting', 'Documents']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  }

  await page.goto('/#/alerts');
  await expect(page.getByRole('heading', { name: 'CV alerts' })).toBeVisible();
  await page.goto('/#/providers');
  await expect(page.getByRole('heading', { name: 'FBI CJIS / NCIC + Rap Back' })).toBeVisible();
  await page.goto('/#/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
});
