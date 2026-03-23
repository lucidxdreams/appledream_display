---
description: Comprehensive security and quality review of uncommitted or recently changed code. Flags CRITICAL/HIGH/MEDIUM/LOW issues with file locations and suggested fixes.
---

# /code-review — Code Review Workflow

Apply the **ecc-agent-code-reviewer** persona for this workflow.

## Steps

1. **Get Changed Files**
   ```bash
   git diff --name-only HEAD
   ```

2. **For Each Changed File, Check:**

   ### Security Issues (CRITICAL — block commit)
   - Hardcoded credentials, API keys, tokens
   - SQL injection vulnerabilities (string-concatenated queries)
   - XSS vulnerabilities (`innerHTML = userInput`)
   - Missing input validation
   - `fetch(userProvidedUrl)` without domain whitelist
   - No auth check on protected routes
   - Plaintext password comparison

   ### Code Quality (HIGH — fix before merge)
   - Functions > 50 lines
   - Files > 800 lines
   - Nesting depth > 4 levels
   - Missing error handling in async operations
   - `console.log` left in source
   - TODO/FIXME without issue reference
   - Missing JSDoc/TSDoc for public APIs

   ### Framework Patterns (HIGH)
   - No direct state mutation (React)
   - `useEffect` dependency arrays correct
   - List keys are stable (not array index)
   - Images use `next/image` with dimensions
   - Async errors are caught

   ### Performance (MEDIUM)
   - N+1 query patterns
   - Unpaginated large data sets
   - Missing cache for expensive operations

   ### Best Practices (LOW)
   - Mutation patterns
   - New code missing tests
   - Missing accessibility attributes (aria-*, alt, role)

3. **Generate Report**

```
CODE REVIEW: [PASS / NEEDS CHANGES]

CRITICAL:
- [file:line] Issue → Suggested fix

HIGH:
- [file:line] Issue → Suggested fix

MEDIUM:
- [file:line] Issue

LOW:
- [file:line] Issue

APPROVED: [YES / NO]
```

## Rules

- **Block commit** if CRITICAL or HIGH issues found
- **Approve with notes** for MEDIUM/LOW only
- Never approve code with security vulnerabilities
