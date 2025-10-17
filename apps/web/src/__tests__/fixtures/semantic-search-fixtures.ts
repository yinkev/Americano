/**
 * Semantic Search Test Fixtures
 * Story 3.1: Semantic Search Implementation
 *
 * Provides reusable mock data and fixtures for E2E testing
 * of the complete semantic search workflow.
 */

/**
 * Test User Fixture
 */
export const TEST_USER = {
  id: 'user-test-e2e-001',
  email: 'test-semantic-search@americano.dev',
  name: 'Test User',
  createdAt: new Date('2025-01-01'),
}

/**
 * Test Course Data
 */
export const TEST_COURSE = {
  id: 'course-cardio-101',
  name: 'Cardiology Fundamentals',
  description: 'Comprehensive cardiology course for medical students',
  code: 'CARDIO-101',
}

/**
 * Test Lecture Data
 */
export const TEST_LECTURE = {
  id: 'lecture-cardio-1',
  courseId: TEST_COURSE.id,
  title: 'Cardiac Function and Physiology',
  description: 'Overview of how the heart functions as a pump',
  status: 'completed',
  uploadedAt: new Date('2025-01-15'),
  duration: 3600, // 1 hour in seconds
}

/**
 * Query Test Cases - Valid Queries
 */
export const VALID_QUERIES = {
  // Medical terminology
  cardiac: 'How does the heart pump blood?',
  conduction: 'Explain the cardiac conduction system',
  acute: 'What is acute coronary syndrome?',
  pathophysiology: 'Describe the pathophysiology of myocardial infarction',

  // Detailed questions
  detailed:
    'What is the complete detailed explanation of the pathophysiology mechanism behind the development of acute coronary syndrome?',

  // Multiple terms
  complex: 'cardiac physiology and ventricular function',

  // With operators
  withOperators: 'cardiac AND conduction NOT arrhythmia',

  // Clinical scenarios
  clinical: 'A 65-year-old male presents with chest pain and dyspnea. What could this indicate?',

  // Simple searches
  simple: 'heart',

  // Specific topics
  ecg: 'ECG interpretation',
  echocardiogram: 'Echocardiography findings',
  hemodynamics: 'Cardiac hemodynamics',
}

/**
 * Query Test Cases - Invalid Queries
 */
export const INVALID_QUERIES = {
  // Empty/whitespace
  empty: '',
  whitespace: '   ',
  tab: '\t\t\t',
  newline: '\n\n',

  // Too short
  singleChar: 'a',
  twoChars: 'ab',

  // Special characters only
  specialOnly: '!@#$%^&*()',
  numbers: '1234567890',
}

/**
 * Mock Search Results
 */
export const MOCK_SEARCH_RESULTS = [
  {
    id: 'chunk-001',
    type: 'chunk' as const,
    title: 'Cardiac Function and Physiology',
    snippet: 'The heart pumps blood throughout the body using a series of coordinated contractions...',
    similarity: 0.96,
    relevanceScore: 0.94,
    metadata: {
      courseId: TEST_COURSE.id,
      courseName: TEST_COURSE.name,
      lectureId: TEST_LECTURE.id,
      lectureTitle: TEST_LECTURE.title,
      pageNumber: 1,
      uploadDate: TEST_LECTURE.uploadedAt,
    },
  },
  {
    id: 'chunk-002',
    type: 'chunk' as const,
    title: 'Cardiac Function and Physiology',
    snippet: 'The cardiac cycle consists of systole and diastole, alternating contractions and relaxations...',
    similarity: 0.92,
    relevanceScore: 0.89,
    metadata: {
      courseId: TEST_COURSE.id,
      courseName: TEST_COURSE.name,
      lectureId: TEST_LECTURE.id,
      lectureTitle: TEST_LECTURE.title,
      pageNumber: 2,
      uploadDate: TEST_LECTURE.uploadedAt,
    },
  },
  {
    id: 'chunk-003',
    type: 'chunk' as const,
    title: 'Cardiac Function and Physiology',
    snippet: 'The conduction system includes the SA node, AV node, and Purkinje fibers...',
    similarity: 0.88,
    relevanceScore: 0.85,
    metadata: {
      courseId: TEST_COURSE.id,
      courseName: TEST_COURSE.name,
      lectureId: TEST_LECTURE.id,
      lectureTitle: TEST_LECTURE.title,
      pageNumber: 3,
      uploadDate: TEST_LECTURE.uploadedAt,
    },
  },
  {
    id: 'chunk-004',
    type: 'chunk' as const,
    title: 'Cardiac Function and Physiology',
    snippet: 'The autonomic nervous system regulates heart rate through the sympathetic and parasympathetic divisions...',
    similarity: 0.85,
    relevanceScore: 0.81,
    metadata: {
      courseId: TEST_COURSE.id,
      courseName: TEST_COURSE.name,
      lectureId: TEST_LECTURE.id,
      lectureTitle: TEST_LECTURE.title,
      pageNumber: 4,
      uploadDate: TEST_LECTURE.uploadedAt,
    },
  },
  {
    id: 'chunk-005',
    type: 'chunk' as const,
    title: 'Cardiac Function and Physiology',
    snippet: 'Cardiac output is calculated as heart rate multiplied by stroke volume...',
    similarity: 0.82,
    relevanceScore: 0.78,
    metadata: {
      courseId: TEST_COURSE.id,
      courseName: TEST_COURSE.name,
      lectureId: TEST_LECTURE.id,
      lectureTitle: TEST_LECTURE.title,
      pageNumber: 5,
      uploadDate: TEST_LECTURE.uploadedAt,
    },
  },
]

/**
 * Expected API Response Schema
 */
export const EXPECTED_SEARCH_RESPONSE = {
  success: true,
  data: {
    results: expect.any(Array),
    total: expect.any(Number),
    latency: expect.any(Number),
    query: expect.any(String),
    filters: expect.any(Object),
    pagination: {
      limit: expect.any(Number),
      offset: expect.any(Number),
      hasMore: expect.any(Boolean),
    },
    queryPlan: expect.any(Object),
    cached: expect.any(Boolean),
    cacheStats: expect.any(Object),
    performanceStats: {
      totalLatency: expect.any(Number),
      searchLatency: expect.any(Number),
      cacheEnabled: expect.any(Boolean),
    },
  },
}

/**
 * Expected Result Schema
 */
export const EXPECTED_RESULT_SCHEMA = {
  id: expect.any(String),
  type: expect.stringMatching(/^(lecture|chunk|concept|objective)$/),
  title: expect.any(String),
  snippet: expect.any(String),
  similarity: expect.any(Number),
  metadata: expect.any(Object),
}

/**
 * Filter Test Cases
 */
export const FILTER_TEST_CASES = {
  // Date range filter
  dateRangeRecent: {
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
  },

  dateRangeOld: {
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-03-31'),
    },
  },

  // Similarity threshold
  highSimilarity: {
    minSimilarity: 0.9,
  },

  mediumSimilarity: {
    minSimilarity: 0.7,
  },

  lowSimilarity: {
    minSimilarity: 0.5,
  },

  // Course filter
  specificCourse: {
    courseIds: [TEST_COURSE.id],
  },

  multipleCourses: {
    courseIds: ['course-cardio-101', 'course-anatomy-101', 'course-physio-101'],
  },

  // Content type filter
  chunkOnly: {
    contentTypes: ['chunk'],
  },

  lectureOnly: {
    contentTypes: ['lecture'],
  },

  mixed: {
    contentTypes: ['chunk', 'lecture', 'concept'],
  },

  // Combined filters
  complexFilter: {
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    minSimilarity: 0.75,
    courseIds: [TEST_COURSE.id],
    contentTypes: ['chunk', 'lecture'],
  },
}

/**
 * Pagination Test Cases
 */
export const PAGINATION_TEST_CASES = {
  firstPage: {
    limit: 20,
    offset: 0,
  },

  secondPage: {
    limit: 20,
    offset: 20,
  },

  thirdPage: {
    limit: 20,
    offset: 40,
  },

  smallLimit: {
    limit: 5,
    offset: 0,
  },

  largeLimit: {
    limit: 100,
    offset: 0,
  },

  deepOffset: {
    limit: 20,
    offset: 1000,
  },
}

/**
 * Performance Test Cases
 */
export const PERFORMANCE_TEST_CASES = {
  simple: {
    query: VALID_QUERIES.simple,
    expectedLatency: '<500ms',
  },

  medium: {
    query: VALID_QUERIES.complex,
    expectedLatency: '<750ms',
  },

  complex: {
    query: VALID_QUERIES.detailed,
    expectedLatency: '<1000ms',
  },

  largeResult: {
    query: 'common',
    limit: 100,
    expectedLatency: '<1500ms',
  },
}

/**
 * Error Test Cases
 */
export const ERROR_TEST_CASES = {
  emptyQuery: {
    query: '',
    expectedStatus: 400,
    expectedError: 'VALIDATION_ERROR',
  },

  missingQuery: {
    expectedStatus: 400,
    expectedError: 'VALIDATION_ERROR',
  },

  invalidLimit: {
    query: 'test',
    limit: 'invalid',
    expectedStatus: 400,
  },

  negativeOffset: {
    query: 'test',
    offset: -1,
    expectedStatus: 400,
  },

  invalidUser: {
    email: 'nonexistent@example.com',
    query: 'test',
    expectedStatus: 404,
  },
}

/**
 * Concurrency Test Cases
 */
export const CONCURRENCY_TEST_CASES = {
  low: {
    concurrentRequests: 5,
    expectedSuccessRate: 0.95, // 95%
  },

  medium: {
    concurrentRequests: 50,
    expectedSuccessRate: 0.90, // 90%
  },

  high: {
    concurrentRequests: 100,
    expectedSuccessRate: 0.85, // 85% (some rate limit expected)
  },

  extreme: {
    concurrentRequests: 500,
    expectedSuccessRate: 0.70, // 70% (significant rate limiting)
  },
}

/**
 * Rate Limit Test Cases
 */
export const RATE_LIMIT_TEST_CASES = {
  withinLimit: {
    requestsPerMinute: 15,
    expectedStatus: 200,
  },

  atLimit: {
    requestsPerMinute: 20,
    expectedStatus: 200,
  },

  exceedsLimit: {
    requestsPerMinute: 25,
    expectedStatus: 429,
  },
}

/**
 * Accessibility Test Cases
 */
export const ACCESSIBILITY_TEST_CASES = {
  keyboardNavigation: {
    description: 'Search form should be navigable with keyboard',
    steps: ['Tab to search input', 'Type query', 'Press Enter'],
  },

  screenReader: {
    description: 'Results should have ARIA labels',
    requirements: ['aria-label', 'role attributes', 'aria-live regions'],
  },

  colorContrast: {
    description: 'UI elements should have sufficient color contrast',
    minimumContrast: 4.5,
  },
}

/**
 * Helper function to create search request
 */
export function createSearchRequest(
  query: string,
  options?: {
    limit?: number
    offset?: number
    filters?: Record<string, any>
  }
) {
  return {
    query,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    filters: options?.filters,
  }
}

/**
 * Helper function to create API headers
 */
export function createSearchHeaders(userEmail?: string) {
  return {
    'Content-Type': 'application/json',
    'X-User-Email': userEmail || TEST_USER.email,
  }
}

/**
 * Helper function to validate search response
 */
export function validateSearchResponse(response: any): boolean {
  if (!response?.success) return false
  if (!response?.data) return false
  if (!Array.isArray(response.data.results)) return false
  if (typeof response.data.total !== 'number') return false
  if (typeof response.data.latency !== 'number') return false
  return true
}

/**
 * Helper function to validate search result
 */
export function validateSearchResult(result: any): boolean {
  if (!result?.id) return false
  if (!result?.type) return false
  if (!result?.title) return false
  if (typeof result?.similarity !== 'number') return false
  if (result.similarity < 0 || result.similarity > 1) return false
  if (!result?.metadata) return false
  return true
}

/**
 * Helper function to extract performance metrics
 */
export function extractPerformanceMetrics(response: any) {
  return {
    totalLatency: response.data?.performanceStats?.totalLatency,
    searchLatency: response.data?.performanceStats?.searchLatency,
    cached: response.data?.cached,
    cacheStats: response.data?.cacheStats,
  }
}

/**
 * Helper function to simulate user search flow
 */
export async function simulateSearchFlow(
  query: string,
  userEmail?: string
): Promise<{
  query: string
  results: any[]
  latency: number
  cached: boolean
}> {
  const headers = createSearchHeaders(userEmail)
  const body = JSON.stringify(createSearchRequest(query))

  const response = await fetch('http://localhost:3000/api/search', {
    method: 'POST',
    headers,
    body,
  })

  const data = await response.json()

  return {
    query,
    results: data.data.results,
    latency: data.data.latency,
    cached: data.data.cached,
  }
}
