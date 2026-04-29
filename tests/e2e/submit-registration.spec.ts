// @spec: submit-registration
// @urs: FR-01
// @risk_zone: 1

import { test, expect } from '@playwright/test';

const validRegistration = {
  nik: '3201230101234567',
  kk: '3201230101234560',
  phone: '+6281234567890',
};

test.describe('FR-01 — Customer submits SIM registration', () => {
  test('happy path: customer submits and is redirected to status page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('cust@example.com');
    await page.getByLabel(/password/i).fill('test-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto('/register');
    await page.getByLabel(/NIK/i).fill(validRegistration.nik);
    await page.getByLabel(/KK/i).fill(validRegistration.kk);
    await page.getByLabel(/phone/i).fill(validRegistration.phone);
    await page.getByRole('button', { name: /submit/i }).click();

    await expect(page).toHaveURL(/\/registrations\/[0-9a-f-]+\/status/);
    await expect(page.getByText(/pending/i)).toBeVisible();
  });

  test('FR-02 — invalid NIK shows field error and does not submit', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/NIK/i).fill('123');
    await page.getByLabel(/KK/i).fill(validRegistration.kk);
    await page.getByLabel(/phone/i).fill(validRegistration.phone);
    await page.getByRole('button', { name: /submit/i }).click();

    await expect(page.getByText(/NIK must be exactly 16 digits/i)).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test('UR-01 — customer cannot see another customer\'s registration', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();

    const pageA = await ctxA.newPage();
    await pageA.goto('/login');
    await pageA.getByLabel(/email/i).fill('a@example.com');
    await pageA.getByLabel(/password/i).fill('test-password');
    await pageA.getByRole('button', { name: /sign in/i }).click();

    await pageA.goto('/register');
    await pageA.getByLabel(/NIK/i).fill('3201230101234567');
    await pageA.getByLabel(/KK/i).fill('3201230101234560');
    await pageA.getByLabel(/phone/i).fill('+6281234567890');
    await pageA.getByRole('button', { name: /submit/i }).click();

    const idMatch = pageA.url().match(/\/registrations\/([0-9a-f-]+)\/status/);
    const registrationIdA = idMatch?.[1];
    expect(registrationIdA).toBeTruthy();

    const pageB = await ctxB.newPage();
    await pageB.goto('/login');
    await pageB.getByLabel(/email/i).fill('b@example.com');
    await pageB.getByLabel(/password/i).fill('test-password');
    await pageB.getByRole('button', { name: /sign in/i }).click();

    const responseB = await pageB.goto(`/registrations/${registrationIdA}/status`);
    expect(responseB?.status()).toBeGreaterThanOrEqual(400);

    await ctxA.close();
    await ctxB.close();
  });
});
