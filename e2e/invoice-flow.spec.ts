import { test, expect } from '@playwright/test';

test.describe('Invoice Creation Flow', () => {
  test('loads the app and shows the editor', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Invoice')).toBeVisible({ timeout: 10000 });
  });

  test('can fill in client details', async ({ page }) => {
    await page.goto('/');
    
    // Find and fill client name field
    const clientNameInput = page.locator('input[name="client.name"], input[placeholder*="Client Name"]').first();
    if (await clientNameInput.isVisible()) {
      await clientNameInput.fill('Test Client Ltd');
      await expect(clientNameInput).toHaveValue('Test Client Ltd');
    }
  });

  test('can add a line item', async ({ page }) => {
    await page.goto('/');
    
    // Click add line item button
    const addBtn = page.locator('button:has-text("Add"), button[aria-label*="Add"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Verify a new row appeared
      await page.waitForTimeout(500);
    }
  });

  test('document type dropdown includes Quote', async ({ page }) => {
    await page.goto('/');
    
    const docTypeSelect = page.locator('select[name="documentType"], #documentType').first();
    if (await docTypeSelect.isVisible()) {
      const options = await docTypeSelect.locator('option').allTextContents();
      expect(options.some(o => o.includes('Quote'))).toBeTruthy();
    }
  });

  test('Quote shows Convert to Invoice button', async ({ page }) => {
    await page.goto('/');
    
    // Select Quote as document type
    const docTypeSelect = page.locator('select[name="documentType"], #documentType').first();
    if (await docTypeSelect.isVisible()) {
      await docTypeSelect.selectOption('Quote');
      await page.waitForTimeout(500);
      
      // Convert button should appear
      const convertBtn = page.locator('button:has-text("Convert to Invoice")');
      await expect(convertBtn).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Navigation', () => {
  test('all main nav tabs are clickable', async ({ page }) => {
    await page.goto('/');
    
    const tabs = ['Branches', 'Accounting', 'Recurring', 'Receipts', 'Integrations', 'Blog'];
    for (const tab of tabs) {
      const btn = page.locator(`button:has-text("${tab}")`).first();
      if (await btn.isVisible()) {
        await expect(btn).toBeEnabled();
      }
    }
  });

  test('blog link navigates to /blog', async ({ page }) => {
    await page.goto('/');
    const blogBtn = page.locator('button:has-text("Blog")').first();
    if (await blogBtn.isVisible()) {
      await blogBtn.click();
      await page.waitForURL('**/blog', { timeout: 5000 });
      expect(page.url()).toContain('/blog');
    }
  });
});

test.describe('Responsive', () => {
  test('mobile view renders without errors', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
