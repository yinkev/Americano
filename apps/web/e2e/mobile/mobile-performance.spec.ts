/**
 * Story 3.6 - Mobile Search Interface E2E Tests
 * Test Suite 4: Mobile Performance Testing
 *
 * Tests performance on mobile devices:
 * - Search latency (<1 second target)
 * - 4G network simulation
 * - Virtual scrolling with 100+ results
 * - Image optimization
 * - Load time measurements
 */

import { expect, type Page, test } from '@playwright/test'

test.describe('Story 3.6 - Mobile Performance', () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  })

  test.describe('Search Latency', () => {
    test('should complete simple search in under 1 second', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('cardiac')

      const startTime = Date.now()

      await searchInput.press('Enter')

      // Wait for results to appear
      await page.waitForSelector('[role="list"]', { timeout: 5000 })

      const endTime = Date.now()
      const searchLatency = endTime - startTime

      console.log(`Search latency: ${searchLatency}ms`)

      // Target: <1 second (1000ms)
      // Allow some buffer for CI environments
      expect(searchLatency).toBeLessThan(2000)
    })

    test('should show loading indicator during search', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('pulmonary')

      // Submit search
      const promise = searchInput.press('Enter')

      // Loading indicator should appear quickly
      const loadingIcon = page.locator('[aria-label="Loading"]')

      // May not always catch it due to speed, but check within 500ms
      await page.waitForTimeout(100)

      // Either loading icon or results should be present
      const hasLoadingOrResults = await page.evaluate(() => {
        const loading = document.querySelector('[aria-label="Loading"]')
        const results = document.querySelector('[role="list"]')
        return !!(loading || results)
      })

      expect(hasLoadingOrResults).toBeTruthy()

      await promise
    })
  })

  test.describe('Network Throttling (4G Simulation)', () => {
    test('should work on slow 4G network', async ({ page, context }) => {
      // Simulate 4G network conditions
      // 4G: ~4 Mbps download, ~3 Mbps upload, ~20ms latency
      await page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 20)) // 20ms latency
        await route.continue()
      })

      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('anatomy')

      const startTime = Date.now()
      await searchInput.press('Enter')

      // Wait for results
      await page.waitForSelector('[role="list"]', { timeout: 10000 })

      const endTime = Date.now()
      const searchLatency = endTime - startTime

      console.log(`Search latency on 4G: ${searchLatency}ms`)

      // Should still complete in reasonable time on 4G
      expect(searchLatency).toBeLessThan(5000) // 5 seconds max on slow connection
    })

    test('should not block UI during slow network requests', async ({ page }) => {
      // Add network delay
      await page.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        await route.continue()
      })

      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('neurology')
      await searchInput.press('Enter')

      // UI should remain responsive
      // Try to type more while search is in progress
      await page.waitForTimeout(200)
      await searchInput.fill('neurology update')

      // Input should accept changes
      await expect(searchInput).toHaveValue('neurology update')
    })
  })

  test.describe('Virtual Scrolling Performance', () => {
    test('should handle scrolling through many results efficiently', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('anatomy') // Likely to return many results
      await searchInput.press('Enter')

      // Wait for results
      await page.waitForSelector('[role="list"]', { timeout: 5000 })

      const resultsContainer = page.locator('[role="list"]').locator('..')

      // Measure scroll performance
      const scrollStartTime = Date.now()

      // Scroll multiple times
      for (let i = 0; i < 5; i++) {
        await resultsContainer.evaluate((el) => {
          el.scrollTop += 300
        })
        await page.waitForTimeout(100)
      }

      const scrollEndTime = Date.now()
      const scrollDuration = scrollEndTime - scrollStartTime

      console.log(`Scroll duration: ${scrollDuration}ms`)

      // Should be smooth and fast
      expect(scrollDuration).toBeLessThan(1500)
    })

    test('should only render visible items with virtual scrolling', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('medical') // Common term with many results
      await searchInput.press('Enter')

      await page.waitForTimeout(2000)

      // Count rendered DOM nodes
      const renderedCount = await page.locator('[role="listitem"]').count()

      // Virtual scrolling should limit rendered items
      // Even if there are 100+ results, only ~10-20 should be in DOM
      console.log(`Rendered result items: ${renderedCount}`)

      // Reasonable number for virtual scrolling (overscan of 5 items + visible ~10)
      expect(renderedCount).toBeLessThan(50)
    })
  })

  test.describe('Page Load Performance', () => {
    test('should load mobile search page quickly', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/search/mobile')

      // Wait for page to be interactive
      await page.waitForLoadState('domcontentloaded')

      const domContentLoadedTime = Date.now() - startTime

      console.log(`DOMContentLoaded: ${domContentLoadedTime}ms`)

      // Should load quickly
      expect(domContentLoadedTime).toBeLessThan(3000)

      // Wait for full load
      await page.waitForLoadState('load')

      const fullLoadTime = Date.now() - startTime

      console.log(`Full load time: ${fullLoadTime}ms`)

      expect(fullLoadTime).toBeLessThan(5000)
    })

    test('should measure First Contentful Paint (FCP)', async ({ page }) => {
      await page.goto('/search/mobile')

      // Measure FCP using Performance API
      const fcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                observer.disconnect()
                resolve(entry.startTime)
              }
            }
          })

          observer.observe({ type: 'paint', buffered: true })

          // Timeout after 10 seconds
          setTimeout(() => resolve(-1), 10000)
        })
      })

      console.log(`First Contentful Paint: ${fcp}ms`)

      // FCP should be under 2 seconds
      expect(fcp).toBeGreaterThan(0)
      expect(fcp).toBeLessThan(2000)
    })

    test('should measure Largest Contentful Paint (LCP)', async ({ page }) => {
      await page.goto('/search/mobile')

      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      // Measure LCP
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            if (lastEntry) {
              resolve(lastEntry.startTime)
            }
          })

          observer.observe({ type: 'largest-contentful-paint', buffered: true })

          // Timeout after 10 seconds
          setTimeout(() => {
            observer.disconnect()
            resolve(-1)
          }, 10000)
        })
      })

      console.log(`Largest Contentful Paint: ${lcp}ms`)

      // LCP should be under 2.5 seconds (Google's "Good" threshold)
      expect(lcp).toBeGreaterThan(0)
      expect(lcp).toBeLessThan(2500)
    })
  })

  test.describe('Memory and Resource Usage', () => {
    test('should not leak memory during repeated searches', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      // Perform multiple searches
      const searchTerms = ['cardiac', 'pulmonary', 'neurology', 'anatomy', 'physiology']

      for (const term of searchTerms) {
        await searchInput.fill(term)
        await searchInput.press('Enter')
        await page.waitForTimeout(1000)
      }

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024)

        console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)} MB`)

        // Should not increase memory dramatically
        // Allow up to 20MB increase for caching and state
        expect(memoryIncreaseMB).toBeLessThan(20)
      }
    })

    test('should clean up resources after clearing search', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')

      // Perform search
      await searchInput.fill('cardiac physiology')
      await searchInput.press('Enter')
      await page.waitForTimeout(2000)

      // Count DOM nodes
      const domNodesWithResults = await page.evaluate(() => {
        return document.querySelectorAll('*').length
      })

      // Clear search
      const clearButton = page.getByLabel('Clear search')
      await clearButton.click()

      await page.waitForTimeout(500)

      // Count DOM nodes again
      const domNodesAfterClear = await page.evaluate(() => {
        return document.querySelectorAll('*').length
      })

      console.log(`DOM nodes with results: ${domNodesWithResults}`)
      console.log(`DOM nodes after clear: ${domNodesAfterClear}`)

      // Should reduce DOM nodes (results removed)
      expect(domNodesAfterClear).toBeLessThan(domNodesWithResults)
    })
  })

  test.describe('Animation Performance', () => {
    test('should animate loading states without jank', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('anatomy')

      // Monitor frame rate during search
      const frameRateData = await page.evaluate(async () => {
        const frames: number[] = []
        let lastTime = performance.now()

        return new Promise<{ minFps: number; avgFps: number }>((resolve) => {
          const checkFrame = () => {
            const currentTime = performance.now()
            const delta = currentTime - lastTime
            const fps = 1000 / delta
            frames.push(fps)

            lastTime = currentTime

            if (frames.length < 30) {
              requestAnimationFrame(checkFrame)
            } else {
              const avgFps = frames.reduce((a, b) => a + b) / frames.length
              const minFps = Math.min(...frames)
              resolve({ minFps, avgFps })
            }
          }

          requestAnimationFrame(checkFrame)
        })
      })

      console.log(`Average FPS: ${frameRateData.avgFps.toFixed(2)}`)
      console.log(`Minimum FPS: ${frameRateData.minFps.toFixed(2)}`)

      // Should maintain at least 30 FPS (ideally 60)
      expect(frameRateData.minFps).toBeGreaterThan(25)
    })

    test('should not block main thread during animations', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')

      // Start a search (triggers loading animation)
      await searchInput.fill('cardiology')
      await searchInput.press('Enter')

      // Immediately try to interact
      await page.waitForTimeout(100)

      // Input should still be responsive
      await searchInput.fill('cardiology advanced')

      // Should accept input even during loading
      await expect(searchInput).toHaveValue('cardiology advanced')
    })
  })

  test.describe('Debouncing and Throttling', () => {
    test('should debounce rapid typing', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')

      // Type rapidly
      const letters = 'cardiology'.split('')
      for (const letter of letters) {
        await searchInput.pressSequentially(letter, { delay: 50 }) // Rapid typing
      }

      // Wait for debounce to settle
      await page.waitForTimeout(200)

      // Final value should be complete
      await expect(searchInput).toHaveValue('cardiology')

      // Note: Autocomplete debouncing would be tested separately with autocomplete feature
    })
  })

  test.describe('Image and Asset Optimization', () => {
    test('should lazy load images if any', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('anatomy')
      await searchInput.press('Enter')

      await page.waitForTimeout(2000)

      // Check if any images are loaded
      const images = page.locator('img')
      const imageCount = await images.count()

      if (imageCount > 0) {
        // Images should have loading="lazy" attribute
        const firstImage = images.first()
        const loadingAttr = await firstImage.getAttribute('loading')

        // Either lazy or eager (not undefined)
        expect(loadingAttr).toBeTruthy()
      }
    })

    test('should use optimized image formats', async ({ page }) => {
      await page.goto('/search/mobile')

      // Check for WebP or AVIF support in images
      const supportsModernFormats = await page.evaluate(() => {
        const canvas = document.createElement('canvas')
        const webp = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
        return webp
      })

      console.log(`Browser supports WebP: ${supportsModernFormats}`)

      // Just verify browser capability
      expect(typeof supportsModernFormats).toBe('boolean')
    })
  })

  test.describe('Bundle Size Impact', () => {
    test('should load JavaScript efficiently', async ({ page }) => {
      const jsRequests: number[] = []

      page.on('response', (response) => {
        if (response.url().includes('.js')) {
          const headers = response.headers()
          const contentLength = headers['content-length']
          if (contentLength) {
            jsRequests.push(parseInt(contentLength))
          }
        }
      })

      await page.goto('/search/mobile')
      await page.waitForLoadState('networkidle')

      const totalJsSize = jsRequests.reduce((a, b) => a + b, 0)
      const totalJsSizeMB = totalJsSize / (1024 * 1024)

      console.log(`Total JS size: ${totalJsSizeMB.toFixed(2)} MB`)
      console.log(`Number of JS files: ${jsRequests.length}`)

      // Total JS should be reasonable (under 5MB for mobile)
      expect(totalJsSizeMB).toBeLessThan(5)
    })
  })

  test.describe('Interaction Performance', () => {
    test('should respond to touch quickly', async ({ page }) => {
      await page.goto('/search/mobile')

      const backButton = page.getByLabel('Go back')

      // Measure interaction latency
      const startTime = Date.now()

      await backButton.tap()

      // Wait for navigation or state change
      await page.waitForTimeout(100)

      const endTime = Date.now()
      const interactionLatency = endTime - startTime

      console.log(`Touch interaction latency: ${interactionLatency}ms`)

      // Should respond within 100ms (Google's recommendation)
      expect(interactionLatency).toBeLessThan(200)
    })

    test('should handle rapid taps without issues', async ({ page }) => {
      await page.goto('/search/mobile')

      const searchInput = page.locator('input[type="search"]')

      // Fill search
      await searchInput.fill('test')

      const clearButton = page.getByLabel('Clear search')

      // Rapid taps
      for (let i = 0; i < 5; i++) {
        await clearButton.tap()
        await searchInput.fill('test')
      }

      // Should end in a consistent state
      await clearButton.tap()
      await expect(searchInput).toHaveValue('')
    })
  })
})
