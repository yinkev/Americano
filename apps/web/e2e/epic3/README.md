# E2E Testing - Knowledge Graph Construction (Story 3.2)

## Overview

This directory contains comprehensive end-to-end (E2E) tests for the knowledge graph construction workflow in Epic 3. The tests validate the complete pipeline from PDF upload through graph visualization and interaction.

## Test Files

### `knowledge-graph.e2e.test.ts` (Primary Test Suite)
Complete E2E test suite with 10+ test cases covering:

- **PDF Upload & Processing**: Lecture upload, OCR, chunking
- **Concept Extraction**: ChatMock integration, batch processing, retry logic
- **Embedding Generation**: Gemini API integration, vector storage
- **Relationship Detection**: Co-occurrence queries, semantic similarity
- **Graph Visualization**: React Flow rendering, clustering, navigation
- **User Interactions**: Node selection, keyboard navigation, filtering
- **Performance**: Large-scale graph handling (1000+ concepts)
- **Mobile**: Responsive design validation
- **Error Handling**: Graceful failure recovery, retry mechanisms

## Test Coverage

### Knowledge Graph Construction - E2E

#### TC-001: PDF Upload Successfully
**Validates**: File upload, metadata creation, status transitions
- Creates sample PDF for testing
- Uploads lecture with metadata
- Verifies database record creation
- Checks progress tracking

**Expected Result**: Lecture appears in list within 5 seconds

#### TC-002: Content Chunks Created
**Validates**: PDF text extraction, semantic chunking, metadata
- Views upload details
- Verifies OCR processing
- Checks chunk count and metadata
- Validates chunk storage

**Expected Result**: Chunks displayed with page numbers and indices

#### TC-003: Concepts Extracted Correctly
**Validates**: ChatMock integration, batch processing, deduplication
- Triggers concept extraction via ChatMock
- Monitors batch processing
- Verifies concept schema (name, description, category)
- Checks retry logic on failures

**Expected Result**: 5-15 concepts extracted per chunk, all with valid schemas

#### TC-004: Embeddings Generated
**Validates**: Gemini embedding API, batch processing, vector storage
- Generates embeddings for concepts
- Validates embedding dimensions (1536)
- Checks database storage
- Monitors progress to 100%

**Expected Result**: All concepts have valid embeddings within 30 seconds

#### TC-005: Co-occurrence Relationships Detected
**Validates**: Optimized SQL query, relationship strength, type safety
- Runs co-occurrence detection
- Verifies query performance (<5 seconds)
- Checks relationship types (INTEGRATED)
- Validates Zod schema validation

**Expected Result**: Relationships detected and stored with strength scores

#### TC-006: Knowledge Graph Renders
**Validates**: React Flow initialization, node/edge rendering, styling
- Graph container loads
- Minimum 5 nodes rendered
- Edges connect related nodes
- Controls visible (zoom, pan, minimap)
- Legend and clusters displayed

**Expected Result**: Fully interactive graph with 50-200 nodes

#### TC-007: Node Interaction Works
**Validates**: Click handling, details panel, keyboard navigation
- Clicks node and selects it
- Details panel shows node information
- "Show Related" button works
- Keyboard shortcuts function (Escape, Enter, arrows)

**Expected Result**: All interactions respond correctly

#### TC-008: Performance with 1000 Concepts
**Validates**: Large dataset handling, clustering, responsiveness
- Graph builds in <30 seconds
- Clustering applied for 200+ nodes
- Graph remains interactive
- No memory issues

**Expected Result**: Graph renders with performance metrics logged

#### TC-009: Related Concepts Highlighted
**Validates**: Node highlighting, connected edges, selection persistence
- Node selection highlights related concepts
- Connected edges become prominent
- Highlighting persists until deselected

**Expected Result**: Clear visual feedback for relationships

#### TC-010: Mobile Responsiveness
**Validates**: Mobile viewport handling, touch interactions, layout adaptation
- Renders on iPhone SE viewport (375x667)
- Controls accessible on mobile
- Content fits screen width
- Touch interactions work

**Expected Result**: Graph fully functional on mobile devices

### Knowledge Graph - Error Handling

#### Error: Missing PDF
**Validates**: Graceful error handling for missing files
- Shows appropriate error message
- Doesn't crash application

#### Error: Concept Extraction Failure
**Validates**: Retry logic and transient error recovery
- Detects transient failures
- Retries with exponential backoff
- Eventually succeeds or shows permanent error

## Performance Targets

| Operation | Target | Current |
|-----------|--------|---------|
| PDF Upload | < 5s | TBD |
| Content Chunking | < 10s | TBD |
| Concept Extraction | < 15s (10 batches) | TBD |
| Embedding Generation | < 20s | TBD |
| Co-occurrence Detection | < 5s (optimized SQL) | TBD |
| Graph Rendering | < 2s (50 nodes) | TBD |
| Graph Building | < 30s (1000 concepts) | TBD |

## Running Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Ensure test database is set up
pnpm prisma db push
```

### Run All E2E Tests
```bash
# Run all Playwright tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run with visible browser (headed)
pnpm test:e2e:headed
```

### Run Specific Test Suite
```bash
# Run knowledge graph tests only
pnpm test:e2e -- knowledge-graph

# Run single test
pnpm test:e2e -- knowledge-graph -g "Should upload PDF"

# Run with specific browser
pnpm test:e2e -- knowledge-graph --project=chromium
```

### Debug Mode
```bash
# Run with detailed logging
DEBUG=pw:api pnpm test:e2e -- knowledge-graph

# Run with trace generation
pnpm test:e2e -- knowledge-graph --trace on

# Run with headed browser for visual debugging
pnpm test:e2e:headed -- knowledge-graph
```

## Test Configuration

### Playwright Config (`playwright.config.ts`)
- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 (CI only)
- **Workers**: 1 (CI), unlimited (local)
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

### Test Timeouts
- Global: 30 seconds
- Element wait: 5-30 seconds (varies by operation)
- Graph render: 60 seconds (large datasets)
- Extraction: 120 seconds (with retries)

## Test Data & Fixtures

### Mock Data
Located in `e2e/fixtures/test-helpers.ts`:
- `MOCK_DATASETS.smallSet()`: 3 concepts for quick tests
- `MOCK_DATASETS.mediumSet()`: 8 concepts for standard tests
- Large datasets: Generated dynamically for performance tests

### Sample Files
- `e2e/fixtures/sample-lecture.pdf`: Minimal PDF for testing

### Helper Functions
```typescript
import {
  waitForGraphRender,          // Wait for graph with min nodes
  clickNodeByLabel,            // Click specific node
  getEdgeCount,                // Count visible edges
  verifyGraphControls,         // Check control buttons
  zoomGraphIn/Out,             // Zoom operations
  getSelectedNodeInfo,         // Get selected node details
  measureGraphBuildTime,       // Performance measurement
} from './fixtures/test-helpers'
```

## Mocking Strategy

### External Services
- **ChatMock API**: Responses mocked in `MOCK_RESPONSES.chatMockConcepts`
- **Gemini Embeddings**: Generated with random vectors (1536 dims)
- **Database**: Uses test database with Prisma seed data

### Interception
```typescript
// Mock concept extraction
await mockChatMockApi(page)

// Mock embedding generation
await mockGeminiApi(page)
```

## Reporting & Analytics

### Test Reports
- **HTML Report**: `test-results/report.html`
- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/junit.xml`

### Performance Metrics
Tests automatically log:
- Build time (ms)
- Node count
- Edge count
- Cluster count
- Performance status (PASS/FAIL)

### Screenshots & Videos
- On failure: Screenshots and videos saved to `test-results/`
- Trace files: For failed tests (can be opened in Playwright Inspector)

## Troubleshooting

### Common Issues

**Tests fail with timeout**
```bash
# Increase timeout for slower machines
PLAYWRIGHT_TIMEOUT=60000 pnpm test:e2e
```

**Graph doesn't render**
- Ensure `BASE_URL` is correct: `http://localhost:3000`
- Check React Flow CSS is imported
- Verify mock data has valid structure

**PDF upload fails**
- Ensure `e2e/fixtures/` directory exists
- Check file permissions for PDF creation
- Verify OCR service is running (if not mocked)

**Embeddings generation slow**
- Normal for first run (API calls)
- Subsequent runs should be faster (caching)
- Check Gemini API quota/limits

### Enable Debug Logs
```bash
# Playwright debug mode
DEBUG=pw:api pnpm test:e2e

# Verbose test output
pnpm test:e2e -- --reporter=verbose

# Save traces for analysis
pnpm test:e2e -- --trace on
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: pnpm test:e2e

- name: Upload Test Reports
  uses: actions/upload-artifact@v3
  with:
    name: e2e-test-results
    path: test-results/
```

### Parallel Execution
- Tests run in parallel across browsers
- Within-browser tests run sequentially
- Use `fullyParallel: true` in config for maximum parallelization

### Required Checks
- All test cases must pass
- Performance metrics must meet targets
- No memory leaks detected
- Cross-browser compatibility verified

## Best Practices

### Writing New Tests
1. **Descriptive Names**: `TC-XXX: Should [action] when [condition]`
2. **Setup & Cleanup**: Use `test.beforeEach()` and `test.afterEach()`
3. **Explicit Waits**: Use `waitFor()` instead of `waitForTimeout()`
4. **Assertions**: Multiple assertions per test for clarity
5. **Error Cases**: Include negative test cases

### Reliability
- Avoid hardcoded waits (use `waitFor()`)
- Retry transient failures (built-in to Playwright)
- Use data attributes for stable locators
- Mock external dependencies
- Clean test data between runs

### Performance
- Run in parallel (`fullyParallel: true`)
- Use CI-specific settings for speed
- Cache test data
- Profile slow tests

### Maintainability
- Keep test helpers DRY (in `test-helpers.ts`)
- Use meaningful assertions with clear error messages
- Document complex test logic
- Update tests when UI/API changes

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Story 3.2 Spec](../../docs/stories/story-3.2.md)
- [Knowledge Graph Architecture](../../docs/architecture/knowledge-graph-architecture.md)
- [API Documentation](../../docs/api/knowledge-graph-api.md)

## Contributing

When adding new E2E tests:
1. Follow naming convention: `TC-XXX: [Description]`
2. Add JSDoc comments explaining test purpose
3. Include performance assertions where relevant
4. Add fixtures/helpers to `test-helpers.ts`
5. Update this README with new test descriptions
6. Run full test suite locally before committing

```bash
# Full test run
pnpm test:all

# Check test coverage
pnpm test:coverage
```

## Contact & Support

For issues or questions:
- Slack: #automation-testing
- Email: test-automation@americano.dev
- Issues: [GitHub Issues](https://github.com/americano/americano/issues)

---

**Last Updated**: 2025-10-17
**Test Suite Version**: 1.0
**Playwright Version**: 1.56.0
