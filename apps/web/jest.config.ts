import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const baseConfig = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/__tests__/(.*)$': '<rootDir>/__tests__/$1',
  },
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
}

const config: Config = {
  ...baseConfig,
  testEnvironment: 'jsdom', // Default to jsdom for React components
  setupFiles: ['<rootDir>/jest.setup-polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)'],
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      setupFiles: ['<rootDir>/jest.setup-polyfills.ts'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)'],
      ...baseConfig,
    },
    {
      displayName: 'node-api',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup-node-api.ts'],
      testMatch: ['<rootDir>/__tests__/api/**/*.test.[jt]s?(x)'],
      ...baseConfig,
    },
  ],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'src/app/api/**/*.{ts,tsx}',
    'src/subsystems/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/api/test/**/*.{ts,tsx}', // Exclude test endpoints
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
    // Specific coverage requirements for proxy routes
    'src/app/api/analytics/**/*.ts': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 10000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
// We need to modify the config after Next.js processes it to handle MSW's ESM modules
export default async () => {
  const nextJestConfig = await createJestConfig(config)()

  // Override transformIgnorePatterns to allow MSW and its ESM dependencies to be transformed
  return {
    ...nextJestConfig,
    transformIgnorePatterns: [
      // Allow transformation of MSW and its ESM dependencies
      '/node_modules/(?!(?:msw|@mswjs|@bundled-es-modules|until-async|strict-event-emitter)/)',
    ],
  }
}
