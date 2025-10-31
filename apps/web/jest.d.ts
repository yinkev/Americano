/// <reference types="@testing-library/jest-dom" />

// Ensure Testing Library matchers are available when importing `expect` from '@jest/globals'.
// Jest 30's `@jest/globals` re-exports `expect` typed from the `expect` package,
// which does not receive the global `jest.Matchers` augmentation. We add a local
// module augmentation for `expect.Matchers` so TypeScript recognizes matchers like
// `toBeInTheDocument`, `toHaveValue`, etc. in files that use `import { expect } from '@jest/globals'`.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

type StringContaining = ReturnType<typeof import('expect').stringContaining>

declare module 'expect' {
  // R = return type, T = subject under test
  interface Matchers<R = void, T = {}>
    extends TestingLibraryMatchers<StringContaining, R> {}
}
