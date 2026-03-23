---
trigger: always_on
---

# Testing Requirements (ECC)

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** — Individual functions, utilities, components
2. **Integration Tests** — API endpoints, database operations
3. **E2E Tests** — Critical user flows

## Test-Driven Development

MANDATORY workflow:
1. Write test first (RED)
2. Run test — it should FAIL
3. Write minimal implementation (GREEN)
4. Run test — it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

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
- Asserting too little (passing tests that verify nothing)
- Not mocking external dependencies

## Troubleshooting Test Failures

1. Check test isolation first
2. Verify mocks are correct
3. Fix implementation, not tests (unless tests are wrong)
4. Apply tdd-guide persona when writing new features (see ecc-agent-tdd-guide rule)
