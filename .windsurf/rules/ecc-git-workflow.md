---
trigger: always_on
---

# Git Workflow (ECC)

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

## Branch Strategy

- `main` / `master` — production-ready code only
- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- `chore/<name>` — maintenance, deps, tooling
- `refactor/<name>` — code restructuring without behavior change

## Pre-Commit Checklist

Before committing:
- [ ] No hardcoded secrets
- [ ] Tests pass
- [ ] Build succeeds
- [ ] No console.log left in source
- [ ] No TODO/FIXME without issue reference
