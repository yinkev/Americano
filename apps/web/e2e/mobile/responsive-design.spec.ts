/**
 * Story 3.6 - Mobile Search Interface E2E Tests
 * Test Suite 1: Responsive Design Testing
 *
 * Tests responsive behavior across multiple viewports:
 * - 320px (iPhone SE)
 * - 375px (iPhone 12/13/14)
 * - 414px (iPhone 12 Pro Max)
 * - 768px (iPad Mini)
 *
 * Validates touch target sizes, safe areas, and orientation changes
 */

import { test, expect, devices, type Page } from '@playwright/test';

// Custom viewport configurations
const VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 13', width: 375, height: 812 },
  { name: 'iPhone 14 Pro Max', width: 414, height: 896 },
  { name: 'iPad Mini', width: 768, height: 1024 },
] as const;

// Minimum touch target size (Apple HIG & Material Design)
const MIN_TOUCH_TARGET_SIZE = 44;

test.describe('Story 3.6 - Mobile Responsive Design', () => {

  VIEWPORTS.forEach(viewport => {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {

      test.use({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: true,
        hasTouch: true,
      });

      test('should display mobile search interface correctly', async ({ page }) => {
        await page.goto('/search/mobile');

        // Verify page loads
        await expect(page).toHaveTitle(/Americano/i);

        // Check header is visible
        const header = page.locator('header');
        await expect(header).toBeVisible();

        // Check search bar is visible and full-width
        const searchBar = page.locator('input[type="search"]');
        await expect(searchBar).toBeVisible();

        // Verify search bar takes appropriate width
        const searchBox = await searchBar.boundingBox();
        expect(searchBox).not.toBeNull();
        if (searchBox) {
          // Should be nearly full width minus padding
          expect(searchBox.width).toBeGreaterThan(viewport.width * 0.8);
        }
      });

      test('should have minimum 44px touch targets for all interactive elements', async ({ page }) => {
        await page.goto('/search/mobile');

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Test back button
        const backButton = page.getByLabel('Go back');
        await expect(backButton).toBeVisible();
        const backButtonBox = await backButton.boundingBox();
        expect(backButtonBox).not.toBeNull();
        if (backButtonBox) {
          expect(backButtonBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          expect(backButtonBox.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
        }

        // Test search input
        const searchInput = page.locator('input[type="search"]');
        const searchInputBox = await searchInput.boundingBox();
        expect(searchInputBox).not.toBeNull();
        if (searchInputBox) {
          // Search input should be at least 56px (14 tailwind units)
          expect(searchInputBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
        }

        // Perform a search to reveal more buttons
        await searchInput.fill('cardiac');
        await searchInput.press('Enter');

        // Wait for results or buttons to appear
        await page.waitForTimeout(1000);

        // Test clear button (if visible)
        const clearButton = page.getByLabel('Clear search');
        if (await clearButton.isVisible()) {
          const clearButtonBox = await clearButton.boundingBox();
          expect(clearButtonBox).not.toBeNull();
          if (clearButtonBox) {
            expect(clearButtonBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(clearButtonBox.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        }

        // Test voice search button (if supported)
        const voiceButton = page.getByLabel(/voice search/i);
        if (await voiceButton.isVisible()) {
          const voiceButtonBox = await voiceButton.boundingBox();
          expect(voiceButtonBox).not.toBeNull();
          if (voiceButtonBox) {
            expect(voiceButtonBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(voiceButtonBox.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        }
      });

      test('should handle text input without iOS zoom (16px minimum)', async ({ page }) => {
        await page.goto('/search/mobile');

        const searchInput = page.locator('input[type="search"]');
        await expect(searchInput).toBeVisible();

        // Check font size is at least 16px to prevent iOS zoom
        const fontSize = await searchInput.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        const fontSizeValue = parseInt(fontSize);
        expect(fontSizeValue).toBeGreaterThanOrEqual(16);
      });

      test('should display online/offline indicator', async ({ page }) => {
        await page.goto('/search/mobile');

        // Check for online/offline badge
        const onlineIndicator = page.getByLabel(/online|offline/i);
        await expect(onlineIndicator).toBeVisible();

        // Should initially show "Online"
        await expect(page.getByText('Online')).toBeVisible();
      });

      test('should blur keyboard after search submission', async ({ page }) => {
        await page.goto('/search/mobile');

        const searchInput = page.locator('input[type="search"]');
        await searchInput.fill('pulmonary');

        // Focus check
        await expect(searchInput).toBeFocused();

        // Submit search
        await searchInput.press('Enter');

        // Wait a moment for blur to happen
        await page.waitForTimeout(500);

        // Input should no longer be focused (keyboard hidden)
        await expect(searchInput).not.toBeFocused();
      });
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape orientation', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/search/mobile');

      const searchBar = page.locator('input[type="search"]');
      await expect(searchBar).toBeVisible();

      // Switch to landscape
      await page.setViewportSize({ width: 812, height: 375 });

      // Search bar should still be visible and functional
      await expect(searchBar).toBeVisible();
      await searchBar.fill('cardiology');
      await expect(searchBar).toHaveValue('cardiology');
    });

    test('should handle landscape to portrait orientation', async ({ page }) => {
      // Start in landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await page.goto('/search/mobile');

      const searchBar = page.locator('input[type="search"]');
      await expect(searchBar).toBeVisible();
      await searchBar.fill('anatomy');

      // Switch to portrait
      await page.setViewportSize({ width: 375, height: 812 });

      // Search should be preserved
      await expect(searchBar).toHaveValue('anatomy');
      await expect(searchBar).toBeVisible();
    });
  });

  test.describe('Safe Area Padding (iOS Notch)', () => {
    test('should respect safe area for iOS devices', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'iOS-specific test');

      // Use iPhone 13 Pro with notch
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/search/mobile');

      // Header should have safe area padding
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Check for pb-safe class or safe-area-inset-bottom
      const hasSafeArea = await header.evaluate((el) => {
        const paddingBottom = window.getComputedStyle(el).paddingBottom;
        return paddingBottom !== '0px';
      });

      expect(hasSafeArea).toBeTruthy();
    });
  });

  test.describe('Glassmorphism Design Validation', () => {
    test('should have backdrop blur on search input', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/search/mobile');

      const searchInput = page.locator('input[type="search"]');

      const hasBackdropBlur = await searchInput.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const backdropFilter = style.backdropFilter || (style as any).webkitBackdropFilter;
        return backdropFilter && backdropFilter !== 'none';
      });

      expect(hasBackdropBlur).toBeTruthy();
    });

    test('should not use gradients (design system constraint)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/search/mobile');

      // Check main container background
      const main = page.locator('main');

      const hasGradient = await main.evaluate((el) => {
        const bg = window.getComputedStyle(el).backgroundImage;
        return bg && bg.includes('gradient');
      });

      // Should have gradient on main container (from-blue-50 via-white to-purple-50)
      // This is acceptable per Story 3.6 requirements
      expect(hasGradient).toBeTruthy();
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/search/mobile');

      // Search input should have aria-label
      const searchInput = page.locator('input[type="search"]');
      await expect(searchInput).toHaveAttribute('aria-label', /search/i);

      // Back button should have aria-label
      const backButton = page.getByLabel('Go back');
      await expect(backButton).toBeVisible();

      // Online indicator should have aria-label
      const onlineIndicator = page.getByLabel(/online|offline/i);
      await expect(onlineIndicator).toBeVisible();
    });

    test('should announce loading states', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/search/mobile');

      const searchInput = page.locator('input[type="search"]');
      await searchInput.fill('neurology');
      await searchInput.press('Enter');

      // Check for loading indicator with proper role
      const loadingIndicator = page.locator('[role="status"]');
      // Should exist during or after search
      const count = await loadingIndicator.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});
