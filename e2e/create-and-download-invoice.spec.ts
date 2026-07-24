import { test, expect } from '@playwright/test';

test.describe('Create and Download Invoice', () => {
  test('user can create an invoice and download it as a PDF', async ({ page }) => {
    // Increase test timeout just for this test
    test.setTimeout(60000);

    // Wait longer for hydration/initialization
    await page.goto('/', { waitUntil: 'networkidle' });

    // Fill client name
    const clientNameInput = page.getByRole('textbox', { name: 'Client Name' });
    await clientNameInput.fill('Acme Corp');

    // Add a line item description
    const descriptionInput = page.getByPlaceholder('Item name...');
    await descriptionInput.first().fill('Web Development');

    // Since this is mobile/desktop, make sure the preview or download buttons are accessible.
    const downloadBtn = page.getByRole('button', { name: 'Download PDF' }).or(page.locator('button:has-text("PDF")')).first();
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });

    // Click it and wait for download
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});
