---
description: Test-Driven Development workflow with Red-Green-Refactor cycle, edge case coverage, mocking patterns, and coverage enforcement. Use when implementing new features or fixing bugs.
---

# TDD Workflow Skill (ECC)

## When to Apply

Apply this skill when:
- Implementing any new function, component, or feature
- Fixing a bug (write a failing test first that reproduces the bug)
- Refactoring code (tests act as safety net)

## The Red-Green-Refactor Cycle

```
RED    → Write a failing test
GREEN  → Write minimal code to pass
REFACTOR → Clean up while keeping tests green
```

Never skip the RED phase. If your test passes immediately without implementation, it's not testing the right thing.

## Step-by-Step

### 1. RED: Write the Failing Test

```typescript
// tests/cart.test.ts
describe('addItemToCart', () => {
  it('adds item to empty cart', () => {
    const cart = { items: [], total: 0 };
    const item = { id: '1', name: 'Widget', price: 9.99 };

    const result = addItemToCart(cart, item);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(item);
    expect(result.total).toBe(9.99);
  });
});
```

Run: `npm test` — MUST see FAIL.

### 2. GREEN: Minimal Implementation

```typescript
// src/cart.ts
export function addItemToCart(cart: Cart, item: Item): Cart {
  return {
    items: [...cart.items, item],
    total: cart.total + item.price,
  };
}
```

Run: `npm test` — MUST see PASS.

### 3. REFACTOR: Clean Up

```typescript
// Add input validation, better types, edge case handling
export function addItemToCart(cart: Cart, item: Item): Cart {
  if (!item.price || item.price < 0) {
    throw new Error(`Invalid item price: ${item.price}`);
  }
  return {
    items: [...cart.items, item],
    total: Number((cart.total + item.price).toFixed(2)), // prevent float issues
  };
}
```

Run: `npm test` — still PASS.

## Edge Cases — Always Test These

```typescript
describe('addItemToCart edge cases', () => {
  it('handles zero-price items', () => { ... });
  it('handles negative price (throws)', () => { ... });
  it('handles duplicate items', () => { ... });
  it('preserves existing items', () => { ... });
  it('does not mutate original cart', () => {
    const original = { items: [], total: 0 };
    addItemToCart(original, item);
    expect(original.items).toHaveLength(0); // immutability check
  });
});
```

## Mocking External Dependencies

```typescript
// WRONG — tests hit real Firebase
const user = await auth.createUser(data);

// CORRECT — mock the external dependency
jest.mock('../firebase', () => ({
  auth: {
    createUser: jest.fn().mockResolvedValue({ uid: 'test-uid' }),
  },
}));
```

## Coverage Verification

```bash
npm run test:coverage
# Check output for:
# Statements: ≥80%
# Branches:   ≥80%
# Functions:  ≥80%
# Lines:      ≥80%
```

## Bug Fix TDD

When fixing a bug, always write a failing test that reproduces the bug first:

```typescript
it('does not crash when user has no email (bug #123)', () => {
  const user = { id: '1', name: 'Test', email: null };
  expect(() => formatUserDisplay(user)).not.toThrow();
  expect(formatUserDisplay(user)).toBe('Test');
});
```

This ensures the bug stays fixed and won't regress.
