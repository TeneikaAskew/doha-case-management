import { test, expect } from '@playwright/test';

test('every page loads and the hero case walks through all tabs', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('with confidence');
  await page.getByRole('button', { name: 'Sign in to explore' }).first().click();
  await expect(page.getByText('About This Demo')).toBeVisible();
  await expect(page.getByLabel('Access password')).toBeVisible();
  const password = process.env.DEMO_ACCESS_PASSWORD; // from portal/.env, gitignored
  if (password) {
    await page.getByLabel('Access password').fill(password);
    await page.getByRole('button', { name: /sign in with sso/i }).click();
  } else {
    await page.evaluate(() => localStorage.setItem('demo.session', 'active'));
    await page.reload();
  }
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

  // Record-check drill-down: checks are grouped by category; Bell's police
  // report is a source row inside the Criminal record checks group.
  await page.goto('/#/cases/SUBJ-002?tab=investigation');
  await page.getByRole('button', { name: /criminal record checks/i }).click();
  await expect(page.getByText('State & local courts').first()).toBeVisible();
  await page.getByRole('button', { name: 'View' }).click();
  // The split document view shows the reference twice (header + paper facsimile).
  await expect(page.getByText(/Report 26-044812, Chesapeake Police Department/).first())
    .toBeVisible();

  await page.goto('/#/alerts');
  await expect(page.getByRole('heading', { name: 'Alerts from Data Providers' })).toBeVisible();
  await page.goto('/#/providers');
  await expect(page.getByRole('heading', { name: 'FBI CJIS / NCIC + Rap Back' })).toBeVisible();
  // Provider drill-down: card -> health KPIs -> triage mode -> queue -> case CV tab
  await page.getByRole('button', { name: /^TransUnion/ }).click();
  await expect(page.getByText('Match Error Rate')).toBeVisible();
  await expect(page.getByText('Alert Volume by Month')).toBeVisible();
  await expect(page.getByText('Record Checks Delivered')).toBeVisible();
  await page.getByRole('switch', { name: /triage/i }).click();
  await expect(page.getByText('Work Queue - Open First')).toBeVisible();
  await expect(page.getByText('Median Time To Adjudicate')).toBeVisible();
  await page.getByRole('switch', { name: /triage/i }).click(); // session-sticky: turn back off
  await page.getByRole('cell', { name: 'Marcus T. Bell' }).first().click();
  await expect(page).toHaveURL(/continuous-vetting/);
  await page.goto('/#/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('with confidence');
});
