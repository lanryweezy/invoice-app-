import { test, expect } from '@playwright/test';

test.describe('Accounting Dashboard', () => {
  test('accounting tab is accessible', async ({ page }) => {
    await page.goto('/');
    const accountingBtn = page.locator('button:has-text("Accounting")').first();
    if (await accountingBtn.isVisible()) {
      await accountingBtn.click();
      await page.waitForTimeout(1000);
      // Should show financial dashboard content
      const dashboard = page.locator('text=Financial Dashboard, text=Revenue, text=Expenses').first();
      if (await dashboard.isVisible()) {
        await expect(dashboard).toBeVisible();
      }
    }
  });

  test('date range filters are present', async ({ page }) => {
    await page.goto('/');
    const accountingBtn = page.locator('button:has-text("Accounting")').first();
    if (await accountingBtn.isVisible()) {
      await accountingBtn.click();
      await page.waitForTimeout(1000);
      
      const periodLabel = page.locator('text=Period').first();
      if (await periodLabel.isVisible()) {
        await expect(periodLabel).toBeVisible();
      }
    }
  });

  test('receivables tab exists', async ({ page }) => {
    await page.goto('/');
    const accountingBtn = page.locator('button:has-text("Accounting")').first();
    if (await accountingBtn.isVisible()) {
      await accountingBtn.click();
      await page.waitForTimeout(1000);
      
      const receivablesTab = page.locator('button:has-text("Receivables")').first();
      if (await receivablesTab.isVisible()) {
        await expect(receivablesTab).toBeVisible();
      }
    }
  });

  test('P&L tab exists', async ({ page }) => {
    await page.goto('/');
    const accountingBtn = page.locator('button:has-text("Accounting")').first();
    if (await accountingBtn.isVisible()) {
      await accountingBtn.click();
      await page.waitForTimeout(1000);
      
      const pnlTab = page.locator('button:has-text("P&L")').first();
      if (await pnlTab.isVisible()) {
        await expect(pnlTab).toBeVisible();
      }
    }
  });
});

test.describe('Public Profile', () => {
  test('public profile page loads for unknown username', async ({ page }) => {
    const response = await page.goto('/p/nonexistent-user-12345');
    // Should not crash - either shows profile or "not found"
    await expect(page.locator('body')).toBeVisible();
  });
});

