import { test, expect } from '@playwright/test';

test.describe('App Visual Audit', () => {
  test('Capture key marketing pages', async ({ page }) => {
    await page.goto('http://localhost:4321/blog');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/marketing_blog_index.png', fullPage: true });

    await page.goto('http://localhost:4321/blog/how-to-create-a-professional-invoice-in-nigeria-2026-guide');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/marketing_blog_post.png', fullPage: true });
  });
});
