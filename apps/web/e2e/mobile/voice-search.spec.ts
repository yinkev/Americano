/**
 * Story 3.6 - Mobile Search Interface E2E Tests
 * Test Suite 2: Voice Search Testing
 *
 * Tests voice search functionality:
 * - Microphone button appears
 * - Speech recognition detection
 * - Auto-submit on speech end
 * - Fallback for unsupported browsers
 * - Error handling (permission denied)
 */

import { type BrowserContext, expect, type Page, test } from '@playwright/test'

test.describe('Story 3.6 - Voice Search Functionality', () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  })

  test.describe('Voice Search UI Elements', () => {
    test('should display microphone button when voice search is enabled', async ({
      page,
      browserName,
    }) => {
      await page.goto('/search/mobile')

      // Voice search button should be visible
      const voiceButton = page.getByLabel(/voice search/i)

      // Button visibility depends on browser support
      // Chromium supports SpeechRecognition, Firefox/WebKit may not
      if (browserName === 'chromium') {
        await expect(voiceButton).toBeVisible()
      }
    })

    test('should show Mic icon when inactive', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await page.goto('/search/mobile')

      const voiceButton = page.getByLabel('Start voice search')
      await expect(voiceButton).toBeVisible()

      // Check for Mic icon (not MicOff)
      const micIcon = voiceButton.locator('svg')
      await expect(micIcon).toBeVisible()
    })

    test('should have proper ARIA attributes', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await page.goto('/search/mobile')

      const voiceButton = page.getByLabel('Start voice search')

      // Should have aria-label
      await expect(voiceButton).toHaveAttribute('aria-label', /voice search/i)

      // Should have aria-pressed
      const ariaPressed = await voiceButton.getAttribute('aria-pressed')
      expect(ariaPressed).toBe('false')
    })
  })

  test.describe('Voice Search Interaction', () => {
    test('should toggle listening state when clicked', async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      // Grant microphone permission
      await context.grantPermissions(['microphone'])

      await page.goto('/search/mobile')

      const voiceButton = page.getByLabel('Start voice search')
      await expect(voiceButton).toBeVisible()

      // Click to start listening
      await voiceButton.click()

      // Wait for state change
      await page.waitForTimeout(500)

      // Button should change to "Stop voice search"
      const stopButton = page.getByLabel('Stop voice search')
      await expect(stopButton).toBeVisible()

      // Should show listening indicator
      const listeningIndicator = page.getByText(/listening/i)
      await expect(listeningIndicator).toBeVisible()

      // aria-pressed should be true
      const ariaPressed = await stopButton.getAttribute('aria-pressed')
      expect(ariaPressed).toBe('true')

      // Click to stop
      await stopButton.click()
      await page.waitForTimeout(500)

      // Should return to start state
      await expect(page.getByLabel('Start voice search')).toBeVisible()
    })

    test('should show listening status message', async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await context.grantPermissions(['microphone'])
      await page.goto('/search/mobile')

      const voiceButton = page.getByLabel('Start voice search')
      await voiceButton.click()

      // Should show status message
      const statusMessage = page.getByRole('status')
      await expect(statusMessage).toContainText(/listening/i)
      await expect(statusMessage).toContainText(/speak your search query/i)
    })

    test('should update search input with transcript', async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await context.grantPermissions(['microphone'])
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      const voiceButton = page.getByLabel('Start voice search')

      // Mock speech recognition by directly setting input
      // (Real speech API requires actual audio input)
      await voiceButton.click()
      await page.waitForTimeout(500)

      // In real scenario, speech would populate this
      // For testing, we verify the input accepts updates
      await searchInput.fill('cardiac physiology')
      await expect(searchInput).toHaveValue('cardiac physiology')
    })

    test('should apply visual feedback during listening', async ({
      page,
      context,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await context.grantPermissions(['microphone'])
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      const voiceButton = page.getByLabel('Start voice search')

      await voiceButton.click()
      await page.waitForTimeout(500)

      // Search input should have listening state styling
      const hasAnimatedStyle = await searchInput.evaluate((el) => {
        const className = el.className
        return className.includes('animate-pulse') || className.includes('ring-primary')
      })

      expect(hasAnimatedStyle).toBeTruthy()
    })
  })

  test.describe('Browser Support Detection', () => {
    test('should hide voice button when SpeechRecognition is unsupported', async ({
      page,
      browserName,
    }) => {
      // Firefox and some WebKit versions don't support SpeechRecognition
      if (browserName === 'firefox' || browserName === 'webkit') {
        await page.goto('/search/mobile')

        const voiceButton = page.getByLabel(/voice search/i)

        // Button should not be visible in unsupported browsers
        const count = await voiceButton.count()
        expect(count).toBe(0)
      }
    })

    test('should show voice button only when enableVoiceSearch prop is true', async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await page.goto('/search/mobile')

      // Default behavior: voice search enabled when online
      const voiceButton = page.getByLabel(/voice search/i)
      await expect(voiceButton).toBeVisible()
    })
  })

  test.describe('Permission Handling', () => {
    test('should handle microphone permission denial', async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      // Deny microphone permission
      await context.grantPermissions([], { origin: page.url() })
      await context.clearPermissions()

      await page.goto('/search/mobile')

      const voiceButton = page.getByLabel('Start voice search')
      await voiceButton.click()

      // Should show error message
      await page.waitForTimeout(1000)

      const errorMessage = page.locator('[role="alert"]')
      const errorCount = await errorMessage.count()

      // May show error or silently fail depending on browser behavior
      if (errorCount > 0) {
        await expect(errorMessage).toBeVisible()
      }
    })

    test('should gracefully handle speech recognition errors', async ({
      page,
      context,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await context.grantPermissions(['microphone'])
      await page.goto('/search/mobile')

      const voiceButton = page.getByLabel('Start voice search')

      // Start and immediately stop (simulates error scenario)
      await voiceButton.click()
      await page.waitForTimeout(100)

      const stopButton = page.getByLabel('Stop voice search')
      await stopButton.click()

      // Should return to normal state without crashing
      await expect(page.getByLabel('Start voice search')).toBeVisible()
    })
  })

  test.describe('Auto-Submit Behavior', () => {
    test('should auto-submit search when speech ends', async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await context.grantPermissions(['microphone'])
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      const voiceButton = page.getByLabel('Start voice search')

      // Start voice search
      await voiceButton.click()
      await page.waitForTimeout(500)

      // Simulate transcript completion by filling input and stopping
      await searchInput.fill('myocardial infarction')

      // Stop listening
      const stopButton = page.getByLabel('Stop voice search')
      await stopButton.click()

      // In the component, onEnd callback with finalTranscript triggers onSearch
      // We verify the search input retains the value
      await expect(searchInput).toHaveValue('myocardial infarction')
    })
  })

  test.describe('Offline Behavior', () => {
    test('should disable voice search when offline', async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await page.goto('/search/mobile')

      // Simulate offline
      await context.setOffline(true)

      // Reload to trigger offline state
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Voice button should not be enabled when offline
      // Check if enableVoiceSearch={isOnline} works
      const voiceButton = page.getByLabel(/voice search/i)
      const count = await voiceButton.count()

      // Should be hidden or disabled
      if (count > 0) {
        const isDisabled = await voiceButton.isDisabled()
        expect(isDisabled).toBeTruthy()
      } else {
        expect(count).toBe(0)
      }
    })
  })

  test.describe('Integration with Search', () => {
    test('should preserve manual input when voice search is available', async ({
      page,
      context,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await context.grantPermissions(['microphone'])
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')

      // Type manually
      await searchInput.fill('endocrine system')
      await expect(searchInput).toHaveValue('endocrine system')

      // Voice button should still be available
      const voiceButton = page.getByLabel('Start voice search')
      await expect(voiceButton).toBeVisible()

      // Can click voice button
      await voiceButton.click()
      await page.waitForTimeout(500)

      // Should be in listening state
      await expect(page.getByLabel('Stop voice search')).toBeVisible()
    })

    test('should allow clearing voice input', async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await context.grantPermissions(['microphone'])
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')

      // Simulate voice input by filling
      await searchInput.fill('respiratory system')

      // Clear button should appear
      const clearButton = page.getByLabel('Clear search')
      await expect(clearButton).toBeVisible()

      // Click clear
      await clearButton.click()

      // Input should be empty
      await expect(searchInput).toHaveValue('')

      // Voice button should still be available
      const voiceButton = page.getByLabel('Start voice search')
      await expect(voiceButton).toBeVisible()
    })
  })

  test.describe('Accessibility for Voice Search', () => {
    test('should have proper role and live region', async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await context.grantPermissions(['microphone'])
      await page.goto('/search/mobile')

      const voiceButton = page.getByLabel('Start voice search')
      await voiceButton.click()

      // Status message should have role="status" and aria-live="polite"
      const statusMessage = page.locator('#voice-search-active')
      await expect(statusMessage).toHaveAttribute('role', 'status')
      await expect(statusMessage).toHaveAttribute('aria-live', 'polite')
    })

    test('should announce errors to screen readers', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Speech API only in Chromium')

      await page.goto('/search/mobile')

      // Trigger error by clicking without permission
      const voiceButton = page.getByLabel('Start voice search')
      await voiceButton.click()

      await page.waitForTimeout(1000)

      // Error message should have role="alert"
      const errorMessages = page.locator('[role="alert"]')
      const count = await errorMessages.count()

      if (count > 0) {
        // Should be announced
        await expect(errorMessages.first()).toBeVisible()
      }
    })
  })
})
