# 🌿 Cannabis Dispensary Advertising Display System

A full-screen digital signage system for cannabis dispensaries — real-time product display with creative animated layouts, powered by an admin backend for staff content management.

---

## What is this?

Two connected apps working together:

| Component | What it does | Tech | Deployment |
|-----------|-------------|------|------------|
| **Display** | Auto-rotating full-screen product showcase | React + GSAP + Matter.js | GitHub Pages |
| **Admin Panel** | Staff manage products, deals & categories | React + React Hook Form | Firebase Hosting |

Staff update products in the **Admin Panel** → changes appear on the **Display** in under 5 seconds via Firestore real-time sync.

### Display Features
- 🌸 **6 category pages** — Exotic Flowers, Edibles, Vapes, Cartridges, Pre-rolls, Deals
- ✨ **5 creative animated layouts** — physics-based orbs, neural constellations, neon grids, card fans, 3D smoke shelves
- 🔥 **Deals page** — "Vault Open" entrance animation, countdown timers, 6 deal types with distinct styling
- 📡 **Real-time sync** — Firestore `onSnapshot` listeners update instantly
- 📺 **Fire Stick / kiosk compatible** — runs fullscreen on any browser

### Admin Features
- 📦 Product CRUD with image upload & compression
- 🏷️ Category management with drag-to-reorder
- 💰 Deal management with date/time pickers
- 🔒 Firebase Auth — login required for all writes
- 📋 Audit logging of all admin actions

---

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| **Node.js** | 20+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **Firebase CLI** | Latest | `npm install -g firebase-tools` |
| **GitHub Account** | — | For GitHub Pages deployment |
| **Firebase Project** | — | [console.firebase.google.com](https://console.firebase.google.com) |

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/advertising-model.git
cd advertising-model
```

### 2. Install dependencies

```bash
cd display && npm install
cd ../admin && npm install
cd ..
```

### 3. Create your Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project**
2. Enable these services:
   - **Firestore Database** (production mode)
   - **Authentication** → Email/Password
   - **Storage** (for product images)
   - **Hosting** (for admin panel)
3. Go to **Project Settings** → **General** → **Your apps** → **Add web app** → copy config values

### 4. Configure environment files

**Display app** — create `display/.env.local`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Admin app** — create `admin/.env.local` with the same variables.

### 5. Deploy Firestore security rules

```bash
firebase login
firebase deploy --only firestore:rules,storage
```

### 6. Seed sample data

```bash
cd scripts
node seed.mjs
```

### 7. Run locally

```bash
# Terminal 1 — Display (http://localhost:5173)
cd display && npm run dev

# Terminal 2 — Admin (http://localhost:5174)
cd admin && npm run dev
```

---

## Deployment

### Display → GitHub Pages

```bash
cd display

# Set the correct base path in vite.config.js:
# base: '/YOUR_REPO_NAME/'

npm run deploy
```

Then in GitHub → **Settings** → **Pages** → set branch to `gh-pages`, folder `/root`.

Live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Admin → Firebase Hosting

```bash
cd admin
npm run build
firebase deploy --only hosting
```

Live at: `https://YOUR_PROJECT_ID.web.app`

---

## Fire Stick Setup

For displaying on a TV via Amazon Fire Stick 4K, see the complete guide:

📖 **[docs/05-hosting-deployment.md](docs/05-hosting-deployment.md#part-3-amazon-fire-stick-setup)**

Quick summary:
1. Enable Developer Options on Fire Stick
2. Sideload **Fully Kiosk Browser** ($6.90 one-time)
3. Set Start URL to your GitHub Pages display URL
4. Enable autostart, fullscreen, stay awake
5. Plug in → TV on → display is live

---

## Architecture

For the full system architecture and data flow, see:

📖 **[docs/01-overview.md](docs/01-overview.md)**

```
┌─────────────────────────────────────────┐
│         ADMIN PANEL (React)             │
│  Add/Edit Products, Deals, Categories   │
└──────────────┬──────────────────────────┘
               │ Firestore writes
┌──────────────▼──────────────────────────┐
│        FIREBASE FIRESTORE               │
│  categories · products · deals · settings│
└──────────────┬──────────────────────────┘
               │ Real-time onSnapshot
┌──────────────▼──────────────────────────┐
│       DISPLAY FRONTEND (React)          │
│  Auto-rotating animated product layouts │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  TV / Fire Stick / Kiosk / Any Browser  │
└─────────────────────────────────────────┘
```

---

## Project Structure

```
advertising-model/
├── display/              # Public display app (GitHub Pages)
│   ├── src/
│   │   ├── layouts/      # 5 creative layouts + DealsLayout
│   │   ├── components/   # ProductCard, DealCard, particles, transitions
│   │   ├── hooks/        # useRotation (category cycling engine)
│   │   └── workers/      # Matter.js Web Worker (physics offload)
│   └── vite.config.js
│
├── admin/                # Staff admin panel (Firebase Hosting)
│   ├── src/
│   │   ├── pages/        # Dashboard, Products, Categories, Deals, Settings
│   │   ├── components/   # Layout, ProtectedRoute, shared UI
│   │   └── contexts/     # AuthContext (Firebase Auth)
│   └── vite.config.js
│
├── docs/                 # Design specifications & guides
├── scripts/              # Firestore seed script
├── firestore.rules       # Security rules (public read, auth write)
├── storage.rules         # Storage security rules
└── firebase.json         # Firebase project config
```

---

## Documentation

| Doc | Contents |
|-----|----------|
| [01 — Overview](docs/01-overview.md) | System architecture & data flow |
| [02 — Best Practices](docs/02-cannabis-display-best-practices.md) | Cannabis display design principles |
| [03 — Tech Stack](docs/03-tech-stack.md) | Technology decisions & Firestore schema |
| [04 — Creative UI](docs/04-creative-ui-concepts.md) | Layout animation specs & design language |
| [05 — Hosting](docs/05-hosting-deployment.md) | Deployment & Fire Stick setup guide |
| [06 — Admin](docs/06-backend-admin.md) | Admin panel architecture |
| [07 — Deals](docs/07-deals-page.md) | Deals page design spec |
| [08 — Roadmap](docs/08-development-roadmap.md) | Development phases & success metrics |

---

## Tech Stack

- **React 19** + **Vite 7** (both apps)
- **GSAP 3** (display animations & transitions)
- **Matter.js** (physics-based Bud Universe layout, runs in Web Worker)
- **Firebase SDK 12** (Firestore, Auth, Storage)
- **React Hook Form** + **Zod** (admin form validation)
- **Lucide React** (admin icons)
- **gh-pages** (display deployment)

---

## License

Private — all rights reserved.
