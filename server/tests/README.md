# Testing Guide for WPL Server

## Overview

This server uses **Vitest** for testing with an in-memory SQLite database for fast, isolated tests. Tests are organized into unit tests, integration tests, and end-to-end tests.

## Installation

Install test dependencies:

```bash
npm install
```

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with UI dashboard
npm run test:ui

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run in watch mode
npm run test:watch
```

## Test Structure

```
tests/
├── setup.js                    # Global test configuration
├── helpers/
│   ├── test-db.js              # In-memory database utilities
│   └── fixtures.js             # Test data factories
├── unit/                       # Unit tests (individual functions)
├── integration/                # Integration tests (API routes)
│   └── routes/
│       ├── transactions.test.js
│       ├── reservations.test.js
│       └── patrons.test.js
└── e2e/                        # End-to-end tests (full flows)
```

## Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import {
  createTestApp,
  createTestDB,
  closeTestDB,
} from '../../helpers/test-db.js';
import { seedDatabase } from '../../helpers/fixtures.js';

describe('My Feature', () => {
  let app;
  let db;
  let testData;

  beforeEach(async () => {
    db = await createTestDB();
    app = await createTestApp(db);
    testData = await seedDatabase(db);
  });

  afterEach(async () => {
    await closeTestDB(db);
  });

  it('should do something', async () => {
    const response = await request(app).get('/api/v1/endpoint').expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### Using Test Fixtures

```javascript
// Use seeded data
const patronId = testData.patrons.patron1.id;

// Or create custom test data
import { createTestPatron, createTestCopy } from '../../helpers/fixtures.js';

const patron = await createTestPatron(db, { balance: 10.0 });
const copy = await createTestCopy(db, { status: 'Available' });
```

## Test Coverage Goals

- **Minimum**: 70% coverage across all categories
- **Target**: 80%+ coverage
- **Critical Paths**: 90%+ coverage (checkout, checkin, reservations)

## Current Test Status

✅ **Completed (Step 1-3)**:

- Vitest configuration
- Test helpers (in-memory DB, fixtures)
- Critical path tests:
  - Checkout flow
  - Checkin flow
  - Reservation creation and queue management
  - Patron CRUD operations

🔄 **In Progress**:

- Additional route tests
- Edge case coverage
- Validation tests

## Test Best Practices

1. **Isolated Tests**: Each test gets a fresh database
2. **Descriptive Names**: Use clear, behavior-driven test names
3. **AAA Pattern**: Arrange, Act, Assert
4. **Test Data**: Use fixtures for consistency
5. **Assertions**: Be specific about what you're testing
6. **Async/Await**: Always use async/await for database operations

## Example Test Patterns

### Testing API Endpoints

```javascript
it('should return 404 for non-existent resource', async () => {
  await request(app).get('/api/v1/patrons/99999').expect(404);
});
```

### Testing Business Logic

```javascript
it('should create waiting reservation when copy has existing reservation', async () => {
  // First reservation
  await request(app).post('/api/v1/reservations').send({ ... });

  // Second reservation should be waiting
  const response = await request(app)
    .post('/api/v1/reservations')
    .send({ ... });

  expect(response.body.data.status).toBe('waiting');
  expect(response.body.data.queue_position).toBe(2);
});
```

### Testing Validation

```javascript
it('should reject invalid data', async () => {
  const response = await request(app)
    .post('/api/v1/patrons')
    .send({}) // Missing required fields
    .expect(400);

  expect(response.body.error).toBeDefined();
});
```

## Debugging Tests

### Run a single test file

```bash
npx vitest run tests/integration/routes/transactions.test.js
```

### Run a specific test

```bash
npx vitest run -t "should successfully checkout an available copy"
```

### Use test.only for focused testing

```javascript
it.only('should test this specific thing', async () => {
  // Only this test will run
});
```

## CI/CD Integration

Tests run automatically in CI with:

```bash
npm run test:run
```

Coverage reports are generated and can be viewed in `coverage/` directory.

## Troubleshooting

### Tests timing out

Increase timeout in test:

```javascript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Database issues

Ensure each test properly closes the database:

```javascript
afterEach(async () => {
  await closeTestDB(db);
});
```

### Port conflicts

Tests use random ports to avoid conflicts. If you see EADDRINUSE errors, check for hanging processes.

## Next Steps

1. Add more route tests (library items, branches, reports)
2. Test error handling and edge cases
3. Add performance tests for complex queries
4. Set up CI/CD pipeline with automated testing
5. Add mutation testing to verify test quality

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [SQLite Testing Best Practices](https://www.sqlite.org/testing.html)
