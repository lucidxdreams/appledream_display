---
description: Implement a feature or fix using strict Test-Driven Development (write tests first, then implementation). Enforces 80%+ coverage.
---

# /tdd — Test-Driven Development Workflow

Apply the **ecc-agent-tdd-guide** persona for this workflow.

## Steps

1. **Understand the requirement**
   - Identify the function/component/feature to implement
   - Define expected inputs and outputs

2. **Write Failing Test (RED)**
   - Write the test BEFORE any implementation
   - Cover: happy path, null/empty input, error paths, boundary values
   - Run the test — it MUST fail

   ```bash
   npm test -- --testPathPattern="<test-file>"
   ```

3. **Write Minimal Implementation (GREEN)**
   - Write only enough code to make the test pass
   - No extra logic, no premature optimization

4. **Run Test — Verify PASS**
   ```bash
   npm test -- --testPathPattern="<test-file>"
   ```

5. **Refactor (IMPROVE)**
   - Remove duplication
   - Improve naming
   - Optimize if needed
   - Tests must remain green throughout

6. **Add Edge Case Tests**
   - Null/undefined input
   - Empty arrays/strings
   - Invalid types
   - Boundary values
   - Error paths

7. **Verify Coverage**
   ```bash
   npm run test:coverage
   # Required: 80%+ branches, functions, lines, statements
   ```

8. **Repeat** for next function/component

## Anti-Patterns to Avoid

- Writing implementation before tests
- Tests that always pass (asserting too little)
- Tests that share state
- Not mocking external dependencies (Firebase, APIs, DBs)

## Success Criteria

- All tests green
- Coverage ≥ 80%
- No implementation detail testing (test behavior, not internals)
