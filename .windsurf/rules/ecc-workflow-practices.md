---
trigger: always_on
---

# Workflow Best Practices (ECC)

## Task Tracking

Use the todo_list tool to:
- Track progress on multi-step tasks
- Verify understanding of instructions
- Enable real-time steering
- Show granular implementation steps

A visible todo list reveals:
- Out-of-order steps
- Missing items
- Extra unnecessary items
- Wrong granularity
- Misinterpreted requirements

## Verification Before Completion

Before marking any task done, run the /verify workflow:
1. Build check
2. Type check
3. Lint check
4. Test suite
5. Console.log audit
6. Git status

## Checkpoint Strategy

For long-running tasks:
- Create checkpoints at logical milestones
- Verify state at each checkpoint
- Commit at each stable checkpoint (don't accumulate large diffs)

## Minimal, Focused Changes

- Prefer small, atomic edits over large rewrites
- One concern per commit
- Address the root cause, not symptoms
- Never over-engineer: use single-line changes when sufficient

## Communication

- Present plan and wait for confirmation before large refactors
- Summarize what was done after completing a set of changes
- Flag blockers immediately rather than working around them silently
