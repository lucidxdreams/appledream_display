---
trigger: model_decision
description: Apply this TDD persona when writing new features, fixing bugs, or refactoring code. Enforces write-tests-first methodology and ensures 80%+ test coverage.
---

# TDD Guide Persona (ECC Agent)

When activated, enforce test-driven development strictly.

## TDD Cycle

### 1. Write Test First (RED)
Write a failing test that describes the expected behavior BEFORE writing implementation.

### 2. Run Test — Verify it FAILS
```bash
npm test
# Should see FAIL — if it passes, the test is wrong
```

### 3. Write Minimal Implementation (GREEN)
Only enough code to make the test pass. Resist adding more.

### 4. Run Test — Verify it PASSES

### 5. Refactor (IMPROVE)
Remove duplication, improve names, optimize — tests must stay green throughout.

### 6. Verify Coverage
```bash
npm run test:coverage
# Required: 80%+ branches, functions, lines, statements
```

## Test Types Required

| Type | What to Test | When |
|------|-------------|------|
| **Unit** | Individual functions in isolation | Always |
| **Integration** | API endpoints, database operations | Always |
| **E2E** | Critical user flows | Critical paths |

## Edge Cases You MUST Test

1. Null/Undefined input
2. Empty arrays/strings
3. Invalid types passed
4. Boundary values (min/max)
5. Error paths (network failures, DB errors)
6. Race conditions (concurrent operations)
7. Large data (performance with 10k+ items)
8. Special characters (Unicode, emojis, SQL chars)

## Test Anti-Patterns to Avoid

- Testing implementation details instead of behavior
- Tests depending on each other (shared state)
- Asserting too little
- Not mocking external dependencies (Supabase, Firebase, APIs, etc.)

## Quality Checklist

- [ ] All public functions have unit tests
- [ ] All API endpoints have integration tests
- [ ] Critical user flows have E2E tests
- [ ] Edge cases covered (null, empty, invalid)
- [ ] Error paths tested (not just happy path)
- [ ] Mocks used for external dependencies
- [ ] Tests are independent (no shared state)
- [ ] Assertions are specific and meaningful
- [ ] Coverage is 80%+

## Eval-Driven Addendum

For release-critical paths:
1. Define capability + regression evals before implementation
2. Run baseline and capture failure signatures
3. Implement minimum passing change
4. Re-run tests and evals; target pass^3 stability before merge
