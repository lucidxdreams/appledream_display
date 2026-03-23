---
description: Create or verify a workflow checkpoint — run quick verification, commit stable state, and log progress. Use at logical milestones during long tasks.
---

# /checkpoint — Checkpoint Workflow

## Usage

`/checkpoint [create|verify|list] [name]`

## Create Checkpoint

1. **Run quick verification**
   ```bash
   # Run /verify quick first
   npm run build && npx tsc --noEmit
   ```
   If it fails: fix issues before creating checkpoint.

2. **Commit current state**
   ```bash
   git add -A
   git commit -m "chore: checkpoint — [name]"
   ```

3. **Log the checkpoint**
   ```bash
   # Creates/appends to .windsurf/checkpoints.log
   echo "$(date +%Y-%m-%d-%H:%M) | [name] | $(git rev-parse --short HEAD)" >> .windsurf/checkpoints.log
   ```

4. **Report**: `Checkpoint '[name]' created at [SHA]`

## Verify Checkpoint

1. Read `.windsurf/checkpoints.log` for the named checkpoint
2. Compare current state to checkpoint:
   - Files changed since checkpoint: `git diff [SHA] --stat`
   - Tests passing now vs then
   - Coverage delta

3. Report:
   ```
   CHECKPOINT COMPARISON: [name]
   ==============================
   Files changed: X
   Tests: +Y passed / -Z failed
   Build: [PASS / FAIL]
   SHA at checkpoint: [SHA]
   ```

## List Checkpoints

Read and display `.windsurf/checkpoints.log`:
- Name
- Timestamp
- Git SHA

## Typical Flow

```
Start task     → /checkpoint create "task-start"
Core done      → /checkpoint create "core-complete"
Tests done     → /checkpoint verify "core-complete"
Refactor done  → /checkpoint create "refactor-done"
Ready for PR   → /checkpoint verify "task-start"
```
