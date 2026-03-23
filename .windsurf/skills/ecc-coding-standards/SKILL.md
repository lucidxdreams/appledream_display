---
description: Coding standards and best practices for writing clean, maintainable, production-quality code. Covers immutability, file organization, error handling, input validation, and quality checklists.
---

# Coding Standards Skill (ECC)

## When to Apply

Apply this skill when:
- Starting a new file or module
- Reviewing code quality
- Onboarding to a new codebase
- Performing a code quality audit

## Core Standards

### Immutability

ALWAYS create new objects, NEVER mutate existing ones.

```typescript
// WRONG — mutates original
function addItem(cart: Cart, item: Item): void {
  cart.items.push(item); // mutation!
}

// CORRECT — returns new copy
function addItem(cart: Cart, item: Item): Cart {
  return { ...cart, items: [...cart.items, item] };
}
```

### File Size

- Ideal: 200–400 lines
- Maximum: 800 lines
- If a file exceeds 800 lines, extract into focused modules

### Function Size

- Maximum: 50 lines
- If a function exceeds 50 lines, decompose it

### Nesting Depth

- Maximum: 4 levels of nesting
- Use early returns to flatten nested conditions:

```typescript
// WRONG — deep nesting
function process(user: User | null) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        doWork(user);
      }
    }
  }
}

// CORRECT — early returns
function process(user: User | null) {
  if (!user) return;
  if (!user.isActive) return;
  if (!user.hasPermission) return;
  doWork(user);
}
```

### Error Handling

```typescript
// WRONG — silent error swallowing
try {
  await doSomething();
} catch (e) {
  // nothing
}

// CORRECT — explicit handling with context
try {
  await doSomething();
} catch (error) {
  logger.error('doSomething failed', { error, context: { userId } });
  throw new AppError('Operation failed', { cause: error });
}
```

### Input Validation

Always validate at system boundaries (API endpoints, form submissions, file imports):

```typescript
// Schema-based validation (Zod example)
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user', 'viewer']),
});

export async function createUser(input: unknown) {
  const validated = CreateUserSchema.parse(input); // throws on invalid
  return await db.users.create(validated);
}
```

## Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named (no abbreviations)
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Comprehensive error handling
- [ ] No hardcoded values (use constants or config)
- [ ] No mutation (immutable patterns used)
- [ ] Input validated at boundaries
- [ ] No `console.log` left in source

## Evidence of Effectiveness

These standards come from the ECC system, battle-tested over 10+ months of daily production use. They prevent: hidden side effects from mutation, debugging nightmares from large files, cascade failures from missing error handling, and security vulnerabilities from missing input validation.
