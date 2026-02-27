# 03 — Technology Stack & Dependencies

Recommended technology stack with specific versions and justifications for the Cannabis Advertising Display System.

---

## Architecture Decision: Monorepo

```
advertising_model/
├── display/        ← Frontend display (React + Vite) → deployed to GitHub Pages
├── admin/          ← Admin backend panel (React + Vite) → deployed to Firebase Hosting
├── docs/           ← This documentation
└── firebase.json   ← Firebase project config
```

---

## Display Frontend

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `^19.0.0` | UI framework |
| `react-dom` | `^19.0.0` | DOM rendering |
| `vite` | `^6.0.0` | Build tool / dev server |
| `@vitejs/plugin-react` | `^4.3.0` | React fast-refresh for Vite |

### Firebase (Database / Real-time Sync)

| Package | Version | Purpose |
|---------|---------|---------|
| `firebase` | `^11.0.0` | Firestore real-time listener, Auth, Storage |

### Animation & Visual Effects

| Package | Version | Purpose |
|---------|---------|---------|
| `gsap` | `^3.12.5` | Master timeline animations, category transitions, product entrance animations |
| `@gsap/react` | `^2.1.0` | React hooks for GSAP |
| `matter-js` | `^0.20.0` | Physics engine for product bubble collisions and floating behavior |
| `framer-motion` | `^11.0.0` | Declarative React animations for UI elements |

### Utility

| Package | Version | Purpose |
|---------|---------|---------|
| `react-router-dom` | `^7.0.0` | Route between display mode and admin mode |
| `zustand` | `^5.0.0` | Lightweight global state (active category, product data cache) |
| `dayjs` | `^1.11.13` | Lightweight date handling for deal countdowns |

---

## Admin Backend Panel

### Core Framework (Same as Display)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `^19.0.0` | UI framework |
| `vite` | `^6.0.0` | Build tool |
| `firebase` | `^11.0.0` | Firestore reads/writes, Auth, Storage |

### Admin UI Components

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | `^7.54.0` | Form management for product add/edit |
| `zod` | `^3.23.0` | Schema validation for product data |
| `@hookform/resolvers` | `^3.9.0` | Connects Zod with react-hook-form |
| `react-dropzone` | `^14.3.0` | Drag-and-drop image uploads to Firebase Storage |
| `react-hot-toast` | `^2.4.1` | Toast notifications for save/publish confirmations |
| `react-colorful` | `^5.6.1` | Color picker for category theme customization |

### Admin UI Icons & Design

| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | `^0.468.0` | Modern icon set (tabs, buttons, actions) |

---

## Firebase Backend Services

| Service | Usage |
|---------|-------|
| **Firestore** | Products, categories, deals, settings — real-time sync |
| **Firebase Storage** | Product images (JPEG/WebP upload) |
| **Firebase Auth** | Admin panel login (Email/Password) |
| **Firebase Hosting** | Admin panel deployment |
| **GitHub Pages** | Display frontend deployment (free, static) |

### Firestore Data Schema

```
/categories
  {id}: {
    name: string,        // "Exotic Flowers"
    slug: string,        // "exotic-flowers"
    active: boolean,     // true/false — shown in rotation
    order: number,       // display order
    duration: number,    // seconds to show this category
    theme: {
      primary: string,   // "#1a472a"
      accent: string,    // "#7CB518"
      background: string // "#0a1a0e"
    }
  }

/products/{categorySlug}/items
  {id}: {
    name: string,          // "Purple Punch #4"
    brand: string,
    image: string,         // Firebase Storage URL
    price: number,         // 12.99
    priceByWeight: {},     // { "1g": 12, "3.5g": 38, "7g": 70 }
    thc: number,           // 28.4 (percentage)
    cbd: number,           // 0.1
    type: string,          // "Indica" | "Sativa" | "Hybrid"
    terpenes: string[],    // ["Myrcene", "Caryophyllene"]
    description: string,   // short flavor/effect note
    badge: string,         // "New" | "Limited" | "Best Seller"
    inStock: boolean,
    featured: boolean,     // gets hero treatment
    createdAt: timestamp
  }

/deals
  {id}: {
    title: string,         // "🔥 BOGO Pre-Rolls Today!"
    description: string,
    type: string,          // "BOGO" | "Discount" | "Bundle" | "Flash"
    originalPrice: number,
    dealPrice: number,
    products: string[],    // product IDs included
    startTime: timestamp,
    endTime: timestamp,    // null = ongoing
    active: boolean,
    image: string          // optional
  }

/settings
  display: {
    transitionStyle: string,   // "fade" | "slide" | "particle"
    showClock: boolean,
    autoRotate: boolean,
    rotationOrder: string[]    // ordered list of active category IDs
  }
```

---

## Display Frontend — CSS & Fonts

```css
/* Google Fonts — loaded in index.html */
/* Primary: Outfit (headings) — modern, geometric, premium feel */
/* Secondary: Inter (body text) — clean, very legible at all sizes */
/* Accent: Bebas Neue (prices, THC%) — bold display font */
```

| Font | Import | Use |
|------|--------|-----|
| Outfit | `wght@300;400;600;700;900` | Category headers, product names |
| Inter | `wght@400;500;600` | Descriptions, terpenes, small info |
| Bebas Neue | `wght@400` | Prices, THC percentages, counters |

---

## Build & Deployment Setup

### GitHub Pages (Display)

```bash
# Install gh-pages
npm install -D gh-pages

# package.json scripts
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"

# vite.config.js
base: '/advertising-display/'  # matches GitHub repo name
```

### Firebase Hosting (Admin)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## Hardware Compatibility Notes

| Device | Browser | Setup |
|--------|---------|-------|
| Amazon Fire Stick 4K | Fully Kiosk Browser (sideloaded) | Set URL to GitHub Pages link, enable autostart |
| Amazon Fire Stick 4K | Amazon Silk Browser | Works but no autostart from boot |
| Any Smart TV | Built-in browser | Open GitHub Pages URL, F11 for fullscreen |
| PC/Mac (kiosk) | Chrome `--kiosk` flag | `chrome --kiosk https://yourname.github.io/advertising-display/` |
| Raspberry Pi 4 | Chromium kiosk mode | Most cost-effective always-on solution |

---

## Development Quick Start

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/advertising-model.git
cd advertising-model

# Install all deps
cd display && npm install
cd ../admin && npm install

# Set up .env files
cp display/.env.example display/.env.local
cp admin/.env.example admin/.env.local
# Fill in Firebase config values

# Run display dev server
cd display && npm run dev   # http://localhost:5173

# Run admin dev server
cd admin && npm run dev     # http://localhost:5174
```
