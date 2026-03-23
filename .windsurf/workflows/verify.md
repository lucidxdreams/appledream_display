---
description: Run comprehensive verification on the current codebase state — build, types, lint, tests, console.log audit, and git status. Use before PRs or commits.
---

# /verify — Verification Workflow

## Steps

Execute in this exact order:

1. **Build Check**
   ```bash
   npm run build
   # or: pnpm build / yarn build
   ```
   If it fails: report errors and STOP.

2. **Type Check**
   ```bash
   npx tsc --noEmit --pretty
   ```
   Report all errors with file:line references.

3. **Lint Check**
   ```bash
   npm run lint
   # or: npx eslint . --ext .ts,.tsx,.js,.jsx
   ```
   Report warnings and errors.

4. **Test Suite**
   ```bash
   npm test
   npm run test:coverage
   ```
   Report: pass/fail count, coverage percentage.

5. **Console.log Audit**
   ```bash
   grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
   ```
   Report locations of any remaining console.log statements.

6. **Git Status**
   ```bash
   git status
   git diff --stat HEAD
   ```
   Show uncommitted changes and files modified since last commit.

## Output Format

```
VERIFICATION: [PASS / FAIL]

Build:    [OK / FAIL — error summary]
Types:    [OK / X errors]
Lint:     [OK / X issues]
Tests:    [X/Y passed, Z% coverage]
Logs:     [OK / X console.logs at: file:line]
Git:      [X files changed, Y uncommitted]

Ready for PR: [YES / NO]

Issues to fix:
- [file:line] description
```

## Arguments

- `quick` — Only build + types (fast check)
- `full` — All checks (default)
- `pre-commit` — Build + types + lint + console.log audit
- `pre-pr` — Full checks including security scan
