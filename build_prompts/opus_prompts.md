# Opus Review Prompts — Cannabis Advertising Display System

> Use these prompts AFTER Sonnet completes each corresponding phase.
> Opus handles architectural decisions, performance audits, and professional polish.

---

## OPUS PROMPT 1 — Architecture & Firebase Review

> Run after Sonnet Phase 1 & 2

```
You are doing a professional code review of a cannabis advertising display system.
Read all docs in d:/advertising_model/docs/ and then audit the codebase.

Review and fix the following:

1. FIREBASE ARCHITECTURE:
   - Audit Firestore security rules (firestore.rules) — are public reads scoped correctly?
   - Is the onSnapshot listener properly unsubscribed on component unmount?
   - Is error handling in place for Firestore read failures (show last cached data, not crash)?
   - Is the seed script idempotent (safe to run multiple times)?

2. ROTATION ENGINE:
   - Review useRotation hook — is the timer cleanup airtight (no memory leaks)?
   - Does the "push to display" listener correctly restart without double-firing?
   - Is the category cycling resilient to 0 active categories (graceful fallback)?

3. PERFORMANCE BASELINE:
   - Are all animations using CSS transform/opacity only (no layout-triggering props like width/height)?
   - Is the ParticleCanvas using requestAnimationFrame correctly (cancel on unmount)?
   - Is there image lazy-loading for product images?

4. CODE QUALITY:
   - Are Firebase config values exclusively read from .env (never hardcoded)?
   - Are React keys well-assigned (not using array index for dynamic lists)?
   - Are there any obvious race conditions between the Firestore listener and rotation timer?

Fix any issues found. Write a brief audit report summarizing what was changed and why.
```

---

## OPUS PROMPT 2 — Physics & Animation Architecture

> Run after Sonnet Phase 3

```
Audit and harden the 5 creative layout components in d:/advertising_model/display/src/layouts/.
These run 24/7 on Amazon Fire Stick hardware — performance and stability are critical.

Review and fix:

1. MATTER.JS (BudUniverse — Flowers):
   - Is the Matter.js engine running in a Web Worker to offload the main thread?
   - If not, implement it: move engine to a Worker, use postMessage to sync body positions to React
   - Is the engine properly destroyed on component unmount (Engine.clear, World.clear, Runner.stop)?
   - Is the central attractor force preventing cards from clustering in corners?
   - Does the layout correctly handle 1 product (single large hero) and 12+ products?

2. FORCE LAYOUT (NeuralConstellation — Edibles):
   - Is the force simulation stopped on unmount?
   - Are SVG line positions updated without causing layout reflows?
   - Do SVG animated lines degrade gracefully if there are < 2 products?

3. GSAP (All layouts):
   - Are all GSAP tweens stored in refs and killed on unmount?
   - Are ScrollTrigger instances (if any) properly reverted?
   - Does the category transition animation correctly handle the case where the previous animation is still running?

4. CANVAS PARTICLE SYSTEMS:
   - Is the canvas pixel ratio set correctly for Retina/4K displays?
   - Is the particle array capped at 80 to prevent memory growth?
   - Is the animationFrameId canceled on unmount?

5. GENERAL:
   - Test every layout with 1, 3, 6, 10, and 15 products — does it always fill the screen?
   - Any layout that doesn't scale correctly: rewrite the sizing formula

Fix all issues. Target: stable 45+ fps on Fire Stick 4K after 8 hours of continuous run.
```

---

## OPUS PROMPT 3 — Admin Panel UX & Security Hardening

> Run after Sonnet Phase 5

```
Audit the admin panel (d:/advertising_model/admin/) for production readiness.

Review and fix:

1. SECURITY:
   - Is the Firebase Auth token checked on every protected route (not just on initial load)?
   - Does the app correctly handle token expiry (auto-logout or silent refresh)?
   - Are Firestore write operations validating input shape before writing (use Zod)?
   - Is image upload validating file type and size before sending to Firebase Storage?
   - Would a logged-out user ever see admin data in the UI, even briefly?

2. FORM ROBUSTNESS:
   - Does the product form handle image upload failure gracefully (don't save product without image url)?
   - Are all number fields (THC%, price) validated to be within realistic ranges?
   - Does the deal form correctly enforce that endTime > startTime?
   - Is the "delete product" flow removing the image from Firebase Storage as well?

3. REAL-TIME SYNC:
   - If two admins have the panel open simultaneously and both edit the same product, is there a last-write-wins strategy or optimistic locking?
   - Recommend and implement the best approach for this use case.

4. UX POLISH:
   - Does every destructive action (delete product, delete deal) have a confirmation dialog?
   - Are form submissions disabled while a save is in progress (prevent double-submit)?
   - Is the drag-to-reorder for categories saving the new order to Firestore atomically (batch write)?
   - Is there a visible "unsaved changes" indicator on edit forms?

5. AUDIT LOG:
   - Implement logging of admin actions to a Firestore /audit collection:
     { action, entity, entityId, user, timestamp }
   - Log: product created/updated/deleted, deal created/updated/deleted, category toggled, push-to-display pressed

Fix all issues found. The admin panel must be production-grade for daily dispensary staff use.
```

---

## OPUS PROMPT 4 — End-to-End QA & Professional Polish

> Run last — this is the final pass before delivery

```
Perform a full end-to-end professional review of the Cannabis Advertising Display System.
Read docs/08-development-roadmap.md success metrics — verify every one is met.

TASKS:

1. ARCHITECTURE REVIEW:
   - Is the monorepo structure clean and logical?
   - Are there shared utilities between display and admin that should be extracted to a /shared package?
   - Is the Firestore schema in docs/03-tech-stack.md faithfully implemented?

2. DISPLAY RELIABILITY (simulate 8-hour run):
   - Are there any setInterval or setTimeout calls that are not cleaned up?
   - Are there any event listeners added to window/document that are not removed?
   - Is there a global error boundary in the display app that prevents a full crash?
   - Implement: if a Firestore read fails after 3 retries, show a "Connection Lost" overlay but keep displaying last known data

3. VISUAL QA — verify against design specs in docs/04:
   - All category themes (background, accent colors) match the spec table
   - Typography: Outfit headings, Inter body, Bebas Neue prices — all loading from Google Fonts
   - Header is exactly 8% height, content area 84%, footer 8%
   - Glassmorphism card CSS matches the spec exactly
   - Product card info cycles every 7 seconds

4. DEALS PAGE FINAL CHECK:
   - Countdown timers are accurate (within 1 second of real time)
   - Expired deals are hidden from display automatically
   - "Vault Open" animation completes in 1.8 seconds as documented

5. README:
   - Write a comprehensive README.md at the project root covering:
     * What the system is
     * Prerequisites (Node 20+, Firebase CLI, GitHub account)
     * Setup steps (clone → .env → seed → dev)
     * Deploy steps (display → GitHub Pages, admin → Firebase)
     * Fire Stick setup instructions (point to docs/05)
     * Architecture overview (point to docs/01)

6. FINAL DELIVERABLE CHECKLIST:
   Confirm each item is true before finishing:
   [ ] Display runs at 45+ fps on resource-constrained hardware
   [ ] Admin saves propagate to display in < 5 seconds
   [ ] All 6 category pages fill the screen at all product counts
   [ ] Deals page distinguishes all 6 deal types visually
   [ ] Admin panel requires auth — no data exposed to unauthenticated users
   [ ] Zero console errors/warnings in production build of both apps
   [ ] Both apps deploy successfully (display → GitHub Pages, admin → Firebase Hosting)

Fix every item that doesn't pass. This is the final production-readiness audit.
```
