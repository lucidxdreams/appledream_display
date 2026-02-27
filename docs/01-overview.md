# 01 — System Overview & Architecture

## What Is This System?

The **Cannabis Advertising Display Model** is a web-based, full-screen digital signage application designed for large-screen displays inside a cannabis dispensary. It features:

- **Auto-rotating category pages** (Exotic Flowers, Edibles, Disposables/Vapes, Cartridges, Pre-rolls, Deals)
- **Smart product layout** that dynamically sizes and arranges all products to fill the entire screen
- **Creative animated UI** (physics-based, cannabis-aesthetic — trichome particles, ember glows, bubble product cards)
- **Real-time backend** where staff manage products, categories, and deals — with instant push-to-display
- **Fire Stick / big-screen compatible** — runs in any modern browser in fullscreen/kiosk mode

---

## System Components

```
┌────────────────────────────────────────────────────────────┐
│                   ADMIN BACKEND (React)                    │
│   • Add / Edit / Delete Products                           │
│   • Manage Categories (activate / deactivate)             │
│   • Create / manage Deals                                  │
│   • Push to Display button → updates Firestore             │
└────────────────────────┬───────────────────────────────────┘
                         │ Real-time Firestore sync
┌────────────────────────▼───────────────────────────────────┐
│              FIREBASE FIRESTORE (Database)                 │
│   • products/{categoryId}/items                            │
│   • categories (name, active, order, displayDuration)      │
│   • deals (title, description, originalPrice, dealPrice)   │
└────────────────────────┬───────────────────────────────────┘
                         │ Real-time listener (onSnapshot)
┌────────────────────────▼───────────────────────────────────┐
│           DISPLAY FRONT-END (React + Vite)                 │
│   • Auto-rotating category slideshow                       │
│   • Per-category animated product layout                   │
│   • Deals page: animated deal cards                        │
│   • Hosted on GitHub Pages (free, static)                  │
└────────────────────────────────────────────────────────────┘
                         │ Displayed on
┌────────────────────────▼───────────────────────────────────┐
│    DISPLAY HARDWARE (TV / Monitor / Amazon Fire Stick)     │
│   • Any TV with HDMI input                                 │
│   • Amazon Fire Stick running Fully Kiosk Browser          │
│   • OR any digital signage platform (ScreenCloud, Yodeck)  │
└────────────────────────────────────────────────────────────┘
```

---

## Data Flow

1. **Staff adds a product** in the Admin Panel (React + Firebase Auth)
2. Data is written to **Firestore** in real time
3. The Display front-end has a **persistent `onSnapshot` listener** — it detects the change immediately
4. The Display **re-renders** the relevant category slide without page reload
5. The **"Push to Display"** button optionally forces a full category refresh and sequence restart

---

## Categories & Page Rotation

| # | Category | Display Duration |
|---|----------|-----------------|
| 1 | Exotic Flowers | 20 seconds |
| 2 | Edibles | 15 seconds |
| 3 | Disposables / Vapes | 15 seconds |
| 4 | Cartridges | 15 seconds |
| 5 | Pre-rolls | 15 seconds |
| 6 | Deals | 25 seconds |

- Categories can be **activated or deactivated** from the backend
- Display duration per category is **configurable** from the backend
- The display loops through all active categories continuously
- Transition animations between categories are cinematic (fade + particle burst)

---

## Key Design Principles

1. **Full-Screen First** — every pixel of the display is used
2. **Dynamic Sizing** — products auto-scale to fill the screen regardless of count
3. **Cannabis Aesthetic** — dark backgrounds, emerald greens, amber/gold accents, particle effects
4. **Real-Time** — changes propagate to the display in milliseconds via Firestore
5. **Offline Resilient** — Firestore SDK caches last data; display continues even if internet drops briefly
6. **Fire Stick Optimized** — 60fps animations tested on low-power ARM hardware (using CSS transforms, not layout-triggering properties)
