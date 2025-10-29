import { test, expect } from '@playwright/test'

test('health smoke', async ({ page }) => {
  const base = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  await page.goto(`${base}/health`)
  await expect(page.locator('h1')).toContainText(/Health/i)
  await expect(page.getByText(/Status:/i)).toBeVisible()
})

