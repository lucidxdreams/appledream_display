---
trigger: always_on
---

# Performance Optimization (ECC)

## Context Window Management

Avoid large-scale operations when context is near limit:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

Lower context sensitivity tasks (safe anytime):
- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

## Build Troubleshooting

If build fails:
1. Apply build-error-resolver persona (see ecc-agent-build-error-resolver rule)
2. Analyze error messages carefully
3. Fix incrementally, one error at a time
4. Verify after each fix

## Parallel Execution

ALWAYS use parallel execution for independent operations:

```
# GOOD: Parallel execution
Run 3 operations simultaneously:
1. Security analysis of auth module
2. Performance review of cache system
3. Type checking of utilities

# BAD: Sequential when unnecessary
First op 1, then op 2, then op 3
```

## Optimization Principles

- Measure before optimizing — don't guess at bottlenecks
- Optimize the critical path first
- Cache expensive computations
- Lazy-load non-critical resources
- Batch database queries (avoid N+1 patterns)
- Use pagination for large data sets
