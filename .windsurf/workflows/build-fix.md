---
description: Incrementally fix build and type errors with minimal, safe changes. One error at a time — no architectural changes.
---

# /build-fix — Build Error Resolution Workflow

Apply the **ecc-agent-build-error-resolver** persona for this workflow.

## Steps

### Step 1: Detect Build System

| Indicator | Build Command |
|-----------|---------------|
| `package.json` with `build` script | `npm run build` or `pnpm build` |
| `tsconfig.json` (TypeScript only) | `npx tsc --noEmit` |
| `Cargo.toml` | `cargo build 2>&1` |
| `pom.xml` | `mvn compile` |
| `go.mod` | `go build ./...` |
| `pyproject.toml` | `python -m compileall -q .` or `mypy .` |

### Step 2: Collect All Errors

```bash
npx tsc --noEmit --pretty --incremental false
npm run build 2>&1
```

1. Capture all errors
2. Group by file path
3. Sort by dependency order (fix imports/types before logic errors)
4. Count total for progress tracking

### Step 3: Fix Loop (One Error at a Time)

For each error:
1. Read the file — see 10 lines around the error
2. Diagnose — identify root cause
3. Fix minimally — smallest change that resolves the error
4. Re-run build — verify error gone, no new errors introduced
5. Move to next error

### Step 4: Guardrails — Stop and Ask If:

- A fix introduces more errors than it resolves
- The same error persists after 3 attempts (likely a deeper issue)
- The fix requires architectural changes
- Build errors stem from missing dependencies (`npm install` needed)

### Step 5: Summary

```
Build Fix Summary
─────────────────────────────
Fixed:     X errors (with file paths)
Remaining: Y errors (if any)
New errors introduced: 0
─────────────────────────────
Build: [PASS / FAIL]
```

## Recovery Strategies

| Situation | Action |
|-----------|--------|
| Missing module/import | Check if package installed; suggest install command |
| Type mismatch | Read both type definitions; fix the narrower type |
| Circular dependency | Identify cycle; suggest extraction |
| Version conflict | Check `package.json` for version constraints |
| Missing types | `npm install --save-dev @types/<package>` |

## Quick Recovery

```bash
# Clear all caches
rm -rf .next node_modules/.cache && npm run build

# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install
```
