# 08 — Development Roadmap

Phased build plan for the Cannabis Advertising Display System. Start with Phase 1, validate with real content, then iterate.

---

## Phase 1: Foundation & Core Display (Week 1–2)

**Goal**: A working display that rotates through categories and shows static product data.

### 1.1 Project Setup
- [ ] Initialize monorepo structure (`/display`, `/admin`, `/docs`)
- [ ] Bootstrap `/display` with Vite + React
- [ ] Bootstrap `/admin` with Vite + React
- [ ] Create Firebase project, enable Firestore, Auth, Storage, Hosting
- [ ] Set up `.env` files for both apps with Firebase config
- [ ] Configure GitHub repo and GitHub Pages for display
- [ ] Install all dependencies (see `03-tech-stack.md`)

### 1.2 Firebase Integration
- [ ] Create Firestore collections: `categories`, `products/{slug}/items`, `deals`, `settings`
- [ ] Seed Firestore with sample data for all 6 categories
- [ ] Write Firestore security rules (public read for display data, auth required for writes)
- [ ] Test real-time `onSnapshot` listener in display app

### 1.3 Display: Category Rotation Engine
- [ ] Build `RotationEngine` hook: cycles through active categories on timer
- [ ] Read category list and settings from Firestore in real-time
- [ ] Implement category transition: crossfade between category slides
- [ ] Show category name + duration indicator in header
- [ ] Category dot indicators in footer

### 1.4 Display: Product Layout Engine
- [ ] `ProductLayoutEngine`: takes N products, calculates optimal card sizes to fill screen
- [ ] Implement grid-based fallback layout that always fills the screen
- [ ] Handle 1, 3, 5, 8, 12+ products gracefully

### 1.5 Display: Basic Product Cards
- [ ] `ProductCard` component with image, name, price, THC%, type badge
- [ ] Glassmorphism card style (see `04-creative-ui-concepts.md`)
- [ ] Firebase Storage image loading with loading placeholder

**Phase 1 Deliverable**: Display rotates through categories, shows all products in a grid, updates in real time.

---

## Phase 2: Category-Specific Layouts & Animation (Week 3–4)

**Goal**: Each category has its own unique visual identity and creative layout.

### 2.1 Animation System
- [ ] Integrate GSAP into display app
- [ ] Build category entrance animation (products fly in per category)
- [ ] Build category exit animation (products collapse/fade out)
- [ ] Build Particle Engine using Canvas API (ambient particles for each category theme)

### 2.2 Exotic Flowers — "Bud Universe" (Matter.js)
- [ ] Integrate Matter.js physics engine
- [ ] Implement circular product cards as physics bodies
- [ ] Sizes proportional to featured status + THC %
- [ ] Central attractor force keeps cards on screen
- [ ] Trichome sparkle particle system (canvas-based)
- [ ] Card info pulse: cycle through product info layers every 7s

### 2.3 Edibles — "Neural Constellation"
- [ ] Hexagonal card layout using SVG/CSS clip-path
- [ ] D3-force layout for hexagon positioning
- [ ] SVG animated connecting lines between related products
- [ ] Candy shimmer particle background
- [ ] Colorful, warm palette applied to cards

### 2.4 Disposables & Vapes — "Neon Tech Grid"
- [ ] Vertical elongated card layout (echoing vape pen shape)
- [ ] Staggered diagonal arrangement
- [ ] Neon glow border on cards
- [ ] 3D Y-axis card rotation animation (CSS perspective transform)
- [ ] Electric particle field background

### 2.5 Cartridges — "The Collection"
- [ ] Horizontal shelf with depth perspective
- [ ] Cards fan out from deck like playing cards (GSAP timeline)
- [ ] Extract type labels large and prominent
- [ ] Metallic gradient background

### 2.6 Pre-Rolls — "The Smoke Shelf"
- [ ] 3D perspective shelf layout (2–3 floating shelves)
- [ ] Products displayed at slight diagonal angle
- [ ] Smoke/wisp CSS particle animations rising from cards
- [ ] Infused pre-roll glow badge system
- [ ] Camera pan animation using GSAP ScrollTrigger (horizontal pan)

**Phase 2 Deliverable**: All 5 product categories have their unique creative layouts and animations.

---

## Phase 3: Deals Page (Week 5)

**Goal**: Stunning, high-urgency deals page.

### 3.1 Deals Data
- [ ] Create deal schema in Firestore
- [ ] Seed with sample deals (BOGO, discount, bundle, flash)
- [ ] Real-time listener for deals data

### 3.2 Deals Layout Engine
- [ ] Detect deal count and select layout variant (1 / 2-3 / 4-6)
- [ ] Featured deal hero card (60% screen)
- [ ] Side panel deal cards
- [ ] Grid layout for 4-6 deals

### 3.3 Deals Animations
- [ ] "Vault Open" entrance animation (see `07-deals-page.md`)
- [ ] Ember particle system (upward floating embers)
- [ ] Deal card bounce entrance
- [ ] Countdown timer component (live ticking)
- [ ] Deal badge styles per deal type
- [ ] "No active deals" fallback state

**Phase 3 Deliverable**: Deals page complete with all animations and deal types.

---

## Phase 4: Admin Panel (Week 6–7)

**Goal**: Staff can manage all content from a clean web interface.

### 4.1 Authentication
- [ ] Login page with Firebase Auth (email/password)
- [ ] Protected routes (redirect to login if not authenticated)
- [ ] Logout button

### 4.2 Dashboard
- [ ] Summary stats (category count, product count, active deals)
- [ ] "Push to Display" button
- [ ] Recent activity feed
- [ ] Active category quick view

### 4.3 Category Management
- [ ] Category list with active/inactive toggle
- [ ] Drag-to-reorder using `@dnd-kit`
- [ ] Per-category settings: duration, theme colors
- [ ] Real-time writes to Firestore

### 4.4 Product Management
- [ ] Product list per category (table with thumbnail, name, price, stock toggle)
- [ ] Add product form (all fields from `06-backend-admin.md`)
- [ ] Edit product form (pre-filled from Firestore)
- [ ] Delete with confirmation
- [ ] Image upload with compression (firebase storage)
- [ ] In-stock quick toggle on list

### 4.5 Deals Management
- [ ] Deals list with active toggle
- [ ] Create deal form (all fields from `07-deals-page.md`)
- [ ] Edit / delete deals
- [ ] DateTimePicker for start/end times
- [ ] Automatic expiry based on endTime

### 4.6 Settings Page
- [ ] Display rotation speed global override
- [ ] Transition style selector (fade / slide / particle)
- [ ] Show/hide clock on display
- [ ] Auto-rotate toggle

**Phase 4 Deliverable**: Complete admin panel with all CRUD operations.

---

## Phase 5: Deployment & Polish (Week 8)

**Goal**: Production-ready, deployed, tested on real hardware.

### 5.1 GitHub Pages Deployment
- [ ] Configure `vite.config.js` with correct `base` path
- [ ] Set up `gh-pages` deploy script
- [ ] Set up GitHub Actions for auto-deploy on push
- [ ] Test display URL in multiple browsers

### 5.2 Firebase Hosting Deployment
- [ ] `firebase init hosting` for admin panel
- [ ] Deploy admin to `*.web.app` URL
- [ ] Test admin panel on mobile (for staff convenience)

### 5.3 Fire Stick Testing
- [ ] Enable developer options on test Fire Stick
- [ ] Sideload Fully Kiosk Browser
- [ ] Configure with display GitHub Pages URL
- [ ] Test all category animations at 60fps
- [ ] Test real-time updates (add product in admin → appears on display)
- [ ] Test overnight reliability (no crashes after 8+ hours)

### 5.4 Performance Optimization
- [ ] All product images compressed to WebP ≤ 200KB
- [ ] Matter.js runs in Web Worker (offload from main thread)
- [ ] Canvas particle system uses `requestAnimationFrame` correctly
- [ ] Lazy-load off-screen category data
- [ ] Test on Fire Stick: target >= 45fps sustained

### 5.5 Final Polish
- [ ] Add store logo to display header
- [ ] Add store name to display footer
- [ ] Fine-tune animation timing based on real-world feedback
- [ ] Add keyboard shortcut to bypass rotation (for admin demo mode)
- [ ] Write README.md with setup instructions

---

## Future Enhancements (Post v1.0)

| Feature | Priority | Notes |
|---------|----------|-------|
| POS Integration (Flowhub, Dutchie, Treez) | High | Auto-sync inventory, remove sold-out items |
| Multi-location support | Medium | One admin, multiple display locations |
| Weather widget | Low | Show local weather on display |
| Social media ticker | Low | Display Instagram feed |
| QR code on screen | Medium | Customers scan to see menu on phone |
| Analytics | Medium | Count how long each category is viewed, which deals appear most |
| AI-generated descriptions | Medium | Auto-generate product descriptions from strain data |
| Split-screen mode | Low | Two sections with different categories simultaneously |
| Customer-facing kiosk mode | Medium | Interactive version for customers to browse |
| Video support | Low | Play short product videos in product cards |

---

## Estimated Timeline Summary

| Phase | Duration | Outcome |
|-------|----------|---------|
| Phase 1: Foundation | 2 weeks | Live rotating display with real data |
| Phase 2: Creative Layouts | 2 weeks | All categories have unique animations |
| Phase 3: Deals Page | 1 week | Deals page complete |
| Phase 4: Admin Panel | 2 weeks | Full CRUD admin panel |
| Phase 5: Deploy & Polish | 1 week | Production-ready on Fire Stick |
| **Total** | **~8 weeks** | **Complete v1.0 System** |

---

## Success Metrics

- ✅ Display rotates 24/7 without crashes
- ✅ Product changes appear on display within 5 seconds of saving in admin
- ✅ All animations run at ≥ 45fps on Amazon Fire Stick 4K
- ✅ Staff can add/edit products in < 2 minutes without training
- ✅ All category pages fill the entire screen at all product counts
- ✅ Deals page visually stands out from other categories
