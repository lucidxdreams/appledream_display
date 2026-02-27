# Sonnet Build Prompts — Cannabis Advertising Display System

> Use these prompts in order. Complete each phase fully before moving to the next.
> All documentation is in `d:/advertising_model/docs/` — read it before starting.

---

## PHASE 1 — Project Setup & Firebase Foundation

```
You are building a cannabis dispensary advertising display system. Read all docs in d:/advertising_model/docs/ first.

Setup the following monorepo structure:
advertising_model/
├── display/   ← React + Vite (GitHub Pages)
├── admin/     ← React + Vite (Firebase Hosting)

TASKS:
1. Create both Vite + React apps with npm
2. Install all dependencies from docs/03-tech-stack.md in both apps
3. Create .env.example files for both apps with all Firebase config keys (empty values)
4. Create Firebase config module in both: src/firebase.js (reads from .env)
5. In Firestore, define the schema from docs/03-tech-stack.md — create a seed script (scripts/seed.js) that populates:
   - All 6 categories (Exotic Flowers, Edibles, Disposables/Vapes, Cartridges, Pre-rolls, Deals)
   - 3 sample products per category with realistic cannabis data
   - 2 sample deals
   - Default settings document
6. Write Firestore security rules (firestore.rules):
   - Public read on: /categories, /products/**, /deals, /settings
   - Auth required for all writes

Deliver: Both apps run with `npm run dev`. Seed script works.
```

---

## PHASE 2 — Display: Rotation Engine & Base Layout

```
Continue building the display app (d:/advertising_model/display/).
Read docs/01-overview.md and docs/04-creative-ui-concepts.md.

TASKS:
1. Build useRotation hook (src/hooks/useRotation.js):
   - Reads active categories from Firestore (onSnapshot)
   - Cycles through them using each category's duration setting
   - Exposes: { currentCategory, nextCategory, progress, jumpTo }
   - Listens to settings.lastPushed — on change, restart rotation

2. Build the main App shell (src/App.jsx):
   - Full-screen layout (100vw × 100vh, overflow hidden)
   - 8% header: logo left, category name center (large), clock right
   - 84% content area: renders current category's layout component
   - 8% footer: category progress dots, next category name preview
   - Background changes to the current category's theme colors (from docs/04)
   - Category dot indicators pulse/animate

3. Build ProductCard component (src/components/ProductCard.jsx):
   - Glassmorphism style (exactly as CSS in docs/04-creative-ui-concepts.md)
   - Animated glow rim using CSS --category-accent variable
   - Props: { product, size, variant: 'circle'|'hex'|'vertical'|'standard' }
   - Cycles info every 7s: Image+Name+Price → THC/CBD → Terpenes/Effects

4. Build ambient ParticleCanvas (src/components/ParticleCanvas.jsx):
   - Canvas-based, 50 particles max
   - Category-themed colors
   - requestAnimationFrame loop

5. Build category transition animation with GSAP:
   - Exit: products implode to center → dissolve (0.6s)
   - Enter: particle burst → category name flies in → products materialize (0.9s)

Deliver: Display rotates through all 6 categories with transitions, particle effects, and product cards.
```

---

## PHASE 3 — Category-Specific Creative Layouts

```
Build the 5 unique product layout components for the display. 
Read docs/04-creative-ui-concepts.md carefully — each concept is fully specified there.

TASKS:

1. BudUniverse.jsx (Exotic Flowers):
   - Matter.js physics engine
   - Circular ProductCards as physics bodies
   - Dynamic radius formula from docs/04
   - Central attractor force, gentle collisions
   - Trichome sparkle particle overlay

2. NeuralConstellation.jsx (Edibles):
   - Hexagonal ProductCards (CSS clip-path)
   - SVG animated lines connecting cards
   - Force-directed layout (simple D3-like spring simulation)
   - Candy shimmer particle background
   - Cards materialize from center on entry

3. NeonTechGrid.jsx (Disposables/Vapes):
   - Vertical elongated cards (echoing vape pen shape)
   - Staggered diagonal arrangement
   - Neon border glow
   - CSS 3D Y-axis rotation animation cycle

4. TheCollection.jsx (Cartridges):
   - Cards fan out from a deck (GSAP stagger)
   - Metallic gradient background
   - Extract type badge large and prominent

5. SmokeShelf.jsx (Pre-rolls):
   - CSS perspective 3D shelf (2 floating planes)
   - Products at slight diagonal angle
   - CSS smoke particle animations (keyframe, upward drift)
   - Camera pan: GSAP slow horizontal movement, yoyo

Each layout receives props: { products, categoryTheme }
Each must fill 100% of the content area regardless of product count (1 to 15 products).

Deliver: All 5 layouts working with sample data, screen-filling, animated.
```

---

## PHASE 4 — Deals Page

```
Build the Deals category layout. Read docs/07-deals-page.md fully.

TASKS:

1. DealsPage.jsx layout component:
   - Reads deals from Firestore (only active deals, end time not passed)
   - Selects layout variant based on deal count:
     * 1 deal → Full bleed hero (full screen)
     * 2-3 deals → Hero (60%) + side panel
     * 4-6 deals → Symmetrical grid
   - "No active deals" fallback state with animated placeholder

2. DealCard.jsx:
   - Deal type badge (BOGO / % OFF / $ OFF / BUNDLE / FLASH / DAILY)
   - Badge color by type (from docs/07)
   - Product image
   - Strikethrough original price + deal price in Bebas Neue gold
   - Savings callout ("Save $12 / 30% off")
   - CountdownTimer component (live ticking, only if endTime exists)

3. CountdownTimer.jsx:
   - Live seconds countdown using useEffect + setInterval
   - Bebas Neue font, pulsing red
   - Animates urgency when < 30 min remaining (color shifts to bright red + scale pulse)

4. "Vault Open" entrance animation (GSAP):
   - Concentric rings expand from center
   - Ember particles fill screen
   - "DEALS" header slams in (elastic ease)
   - Deal cards fall+bounce into position (stagger)
   Total: 1.8s as specified in docs/07

5. Ember particle system (Canvas, upward floating red/orange embers)

Deliver: Full deals page with all animations, countdown timers, all deal types rendering correctly.
```

---

## PHASE 5 — Admin Panel

```
Build the admin panel (d:/advertising_model/admin/).
Read docs/06-backend-admin.md fully.

TASKS:

1. Auth:
   - Login page (/login) with Firebase email/password auth
   - All other routes protected — redirect to /login if not authenticated
   - Logout button in nav

2. Dashboard (/dashboard):
   - Summary cards: total categories (active/total), total products (in-stock/total), active deals
   - "PUSH TO DISPLAY" button (writes lastPushed: serverTimestamp() to settings/display)
   - Active categories list in order with product counts
   - Show last pushed timestamp

3. Category Management (/categories):
   - Drag-to-reorder using @dnd-kit/sortable
   - Active/inactive toggle per category
   - Duration setting (slider or number input, 10-60s)
   - Theme primary + accent color pickers (react-colorful)
   - Changes write to Firestore in real-time

4. Product Management (/products/:categorySlug):
   - Table: thumbnail | name | price | THC% | inStock toggle | featured toggle | edit | delete
   - "Add Product" button → form (all fields from docs/06)
   - Image upload with drag-drop (react-dropzone → compress → Firebase Storage)
   - Edit form pre-filled from Firestore
   - Delete with confirmation dialog

5. Deal Management (/deals):
   - Deal list: title | type | price | active toggle | end time | edit | delete
   - Create/Edit deal form: all fields from docs/07
   - DateTimePicker for start/end
   - Active toggle

6. Settings (/settings):
   - Global rotation speed override
   - Transition style selector (fade / slide / particle)
   - Show clock toggle
   - Auto-rotate toggle

Admin UI: Dark theme (#0f0f0f bg), cannabis green (#4a7c59) accent, Inter font, lucide-react icons.
Use react-hot-toast for all success/error notifications.

Deliver: Full functional admin panel with all CRUD operations working against Firestore.
```

---

## PHASE 6 — Deployment

```
Deploy both apps. Read docs/05-hosting-deployment.md.

TASKS:

1. Display (GitHub Pages):
   - Set base in display/vite.config.js to match repo name
   - Add gh-pages deploy script to package.json
   - Create .github/workflows/deploy-display.yml for auto-deploy on push to main
   - Run npm run deploy, confirm live URL works

2. Admin (Firebase Hosting):
   - firebase init hosting in admin/
   - firebase deploy
   - Confirm admin URL is live and login works

3. Final checks:
   - Open display URL in browser → full screen → verify rotation works
   - Add a product in admin → verify it appears on display within 5 seconds
   - Press "Push to Display" → verify display restarts rotation
   - Test all 6 category pages
   - Test deals page with 1, 3, and 5 deals active

Deliver: Both apps live on their respective URLs. End-to-end real-time sync verified.
```
