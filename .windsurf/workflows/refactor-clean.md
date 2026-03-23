---
description: Safely identify and remove dead code, unused exports, and duplicate logic with test verification at every step.
---

# /refactor-clean — Dead Code Cleanup Workflow

Apply the **ecc-agent-refactor-cleaner** persona for this workflow.

## Steps

### Step 1: Detect Dead Code

Run analysis tools based on project type:

```bash
npx knip          # Unused files, exports, dependencies (JS/TS)
npx depcheck      # Unused npm dependencies
npx ts-prune      # Unused TypeScript exports
```

If tools unavailable, use grep to find exports with zero imports manually.

### Step 2: Categorize Findings

| Tier | Examples | Action |
|------|----------|--------|
| **SAFE** | Unused utilities, test helpers, internal functions | Delete with confidence |
| **CAUTION** | Components, API routes, middleware | Verify no dynamic imports or external consumers |
| **DANGER** | Config files, entry points, type definitions | Investigate before touching |

### Step 3: Safe Deletion Loop (SAFE items only)

For each SAFE item:
1. Run full test suite — establish baseline (all green)
2. Delete the dead code
3. Re-run test suite — verify nothing broke
4. If tests fail → immediately revert (`git checkout -- <file>`) and skip
5. If tests pass → move to next item

### Step 4: Handle CAUTION Items

Before deleting:
- Search for dynamic imports: `import()`, `require()`, `__import__`
- Search for string references: route names, component names in configs
- Check if exported from a public package API

### Step 5: Consolidate Duplicates

After removing dead code:
- Near-duplicate functions (>80% similar) — merge into one
- Redundant type definitions — consolidate
- Wrapper functions that add no value — inline

### Step 6: Summary Report

```
Dead Code Cleanup
─────────────────────────────
Deleted:   X unused functions
           Y unused files
           Z unused dependencies
Skipped:   N items (tests failed / uncertain)
Saved:     ~NNN lines removed
─────────────────────────────
All tests passing ✓
```

## Rules

- Never delete without running tests first
- One deletion at a time — atomic changes
- Skip if uncertain
- Don't refactor while cleaning — separate concerns
- Never run during active feature development or before deploys
