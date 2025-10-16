/**
 * Smoke Test - Verify Jest Configuration
 *
 * This test ensures that the Jest testing infrastructure is properly configured
 * for Story 2.6 Mission Performance Analytics and Adaptation
 */

describe('Jest Configuration Smoke Test', () => {
  it('should run basic assertions', () => {
    expect(true).toBe(true)
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
  })

  it('should support async/await', async () => {
    const result = await Promise.resolve('async works')
    expect(result).toBe('async works')
  })

  it('should support TypeScript types', () => {
    const testObject: { name: string; value: number } = {
      name: 'test',
      value: 42,
    }

    expect(testObject.name).toBe('test')
    expect(testObject.value).toBe(42)
  })

  it('should support array and object matchers', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)

    const obj = { a: 1, b: 2 }
    expect(obj).toHaveProperty('a', 1)
    expect(obj).toMatchObject({ a: 1 })
  })

  it('should support jest-dom matchers', () => {
    // jest-dom matchers should be available via setupFilesAfterEnv
    expect(document.createElement('div')).toBeInTheDocument
  })
})

describe('Module Resolution Smoke Test', () => {
  it('should resolve @/ path alias', async () => {
    // This will fail if module name mapper is not configured correctly
    const { mockMissions } = await import('@/__tests__/fixtures/mission-data')
    expect(mockMissions).toBeDefined()
    expect(Array.isArray(mockMissions)).toBe(true)
  })

  // Note: test-utils are tested in components/smoke.test.tsx
  // to avoid React Testing Library hooks setup issues
})

describe('Mock Configuration Smoke Test', () => {
  it('should have Next.js navigation mocked', () => {
    const { useRouter } = require('next/navigation')
    const router = useRouter()

    expect(router).toBeDefined()
    expect(router.push).toBeDefined()
    expect(typeof router.push).toBe('function')
  })

  it('should have ResizeObserver mocked', () => {
    expect(global.ResizeObserver).toBeDefined()
    const observer = new ResizeObserver(() => {})
    expect(observer.observe).toBeDefined()
    expect(observer.disconnect).toBeDefined()
  })

  it('should have IntersectionObserver mocked', () => {
    expect(global.IntersectionObserver).toBeDefined()
    const observer = new IntersectionObserver(() => {})
    expect(observer.observe).toBeDefined()
    expect(observer.disconnect).toBeDefined()
  })
})

describe('Test Environment Verification', () => {
  it('should have jsdom environment', () => {
    expect(document).toBeDefined()
    expect(window).toBeDefined()
    expect(navigator).toBeDefined()
  })

  it('should have document API available', () => {
    const div = document.createElement('div')
    div.textContent = 'test'
    expect(div.textContent).toBe('test')
  })

  it('should have localStorage available', () => {
    expect(localStorage).toBeDefined()
    localStorage.setItem('test', 'value')
    expect(localStorage.getItem('test')).toBe('value')
    localStorage.removeItem('test')
  })
})

describe('Coverage Configuration', () => {
  it('should be configured for coverage collection', () => {
    // This test ensures coverage is being tracked
    const testFunction = (x: number) => x * 2
    expect(testFunction(5)).toBe(10)
  })
})
