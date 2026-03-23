---
description: Comprehensive verification loop to run before PRs and commits — build, types, lint, tests, console.log audit, and git status. Ensures code is production-ready.
---

# Verification Loop Skill (ECC)

## When to Apply

Apply this skill:
- Before creating a PR
- Before committing a significant change
- After completing a feature
- After a refactoring session
- When explicitly asked to verify

## Full Verification Sequence

Run ALL steps in this order. Stop and report if any CRITICAL step fails.

### Step 1: Build

```bash
npm run build
# or: pnpm build / yarn build / vite build
```

**CRITICAL** — if build fails, stop and fix before continuing.

### Step 2: Type Check

```bash
npx tsc --noEmit --pretty
```

Report all errors with `file:line` format.

### Step 3: Lint

```bash
npm run lint
# or: npx eslint . --ext .ts,.tsx,.js,.jsx
```

Report all warnings and errors.

### Step 4: Tests

```bash
npm test
npm run test:coverage
```

Report:
- Total tests: pass/fail
- Coverage: statements/branches/functions/lines (need ≥80%)

### Step 5: Console.log Audit

```bash
grep -rn "console\.log" src/ \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx"
```

Any hits should be reviewed — remove debug logs, replace with structured logging.

### Step 6: Git Status

```bash
git status
git diff --stat HEAD
```

Show uncommitted changes. Verify nothing unintentional is staged/unstaged.

## Verification Report Format

```
═══════════════════════════════════
VERIFICATION REPORT
═══════════════════════════════════
Build:    ✓ OK  |  ✗ FAILED
Types:    ✓ OK  |  ✗ X errors
Lint:     ✓ OK  |  ⚠ X warnings  |  ✗ X errors
Tests:    ✓ X/Y passed  |  Z% coverage
Logs:     ✓ None  |  ⚠ X found at: [files]
Git:      X files changed, Y untracked
═══════════════════════════════════
Ready for PR: YES / NO

Issues to address:
1. [file:line] description
2. [file:line] description
```

## Quick Mode (pre-commit)

For quick checks before a commit:

```bash
npm run build && npx tsc --noEmit && npm run lint
```

## Fix Priority

1. **Build errors** — Nothing else matters if build is broken
2. **Type errors** — Runtime type mismatches are bugs
3. **Test failures** — Regressions detected
4. **Lint errors** — Code quality issues
5. **Coverage gaps** — Missing test paths
6. **Console.logs** — Debug artifacts
