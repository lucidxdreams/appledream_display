---
description: Security review workflow covering OWASP Top 10, secret detection, input validation, auth/authz checks, and dependency security. Apply before any commit touching security-sensitive code.
---

# Security Review Skill (ECC)

## When to Apply

Apply this skill when:
- Writing or modifying authentication/authorization code
- Creating or modifying API endpoints
- Handling user input or file uploads
- Processing payments
- Integrating external services
- Before any production deployment

## Automated Scans (Run First)

```bash
# Dependency vulnerabilities
npm audit --audit-level=high

# Code pattern scanning
npx eslint . --plugin security

# Search for potentially hardcoded secrets
grep -rE "(api_key|apikey|secret|password|token|private_key)\s*=\s*['\"][^'\"]{8,}" \
  --include="*.ts" --include="*.js" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.git
```

## OWASP Top 10 Checklist

### A01: Injection
```typescript
// VULNERABLE
const query = `SELECT * FROM users WHERE email = '${email}'`;

// SECURE
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);
```

### A02: Broken Authentication
```typescript
// VULNERABLE
if (user.password === inputPassword) { ... }

// SECURE
const isValid = await bcrypt.compare(inputPassword, user.passwordHash);
```

### A03: Sensitive Data Exposure
```typescript
// VULNERABLE — logs password
logger.info('Login attempt', { email, password });

// SECURE — never log sensitive data
logger.info('Login attempt', { email });
```

### A05: Broken Access Control
```typescript
// VULNERABLE — no auth check
app.get('/admin/users', async (req, res) => {
  const users = await db.users.findAll();
  res.json(users);
});

// SECURE
app.get('/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  const users = await db.users.findAll();
  res.json(users);
});
```

### A07: XSS Prevention
```typescript
// VULNERABLE
element.innerHTML = userInput;

// SECURE
element.textContent = userInput;
// or: DOMPurify.sanitize(userInput)
```

### A10: SSRF Prevention
```typescript
// VULNERABLE
const response = await fetch(userProvidedUrl);

// SECURE
const ALLOWED_DOMAINS = ['api.example.com', 'cdn.example.com'];
const url = new URL(userProvidedUrl);
if (!ALLOWED_DOMAINS.includes(url.hostname)) {
  throw new Error('Domain not allowed');
}
const response = await fetch(userProvidedUrl);
```

## Environment Variable Pattern

```typescript
// config.ts — validate all secrets at startup
const config = {
  supabaseUrl: process.env.SUPABASE_URL ?? (() => { throw new Error('SUPABASE_URL required') })(),
  supabaseKey: process.env.SUPABASE_ANON_KEY ?? (() => { throw new Error('SUPABASE_ANON_KEY required') })(),
};
export default config;
```

## Rate Limiting Pattern

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts
  message: 'Too many login attempts, please try again later',
});

app.post('/auth/login', authLimiter, loginHandler);
```

## Security Review Report Template

```
SECURITY REVIEW: [PASS / FAIL]

CRITICAL:
- [file:line] [Issue] → [Fix]

HIGH:
- [file:line] [Issue] → [Fix]

MEDIUM:
- [file:line] [Issue]

Secrets found: [YES / NO — locations]
npm audit: [X vulnerabilities — HIGH: Y, CRITICAL: Z]

APPROVED FOR COMMIT: [YES / NO]
```
