# Cannabis Dispensary Advertising Display

A full-screen digital signage system for cannabis dispensaries — real-time product display with an admin backend.

![System Architecture](docs/01-overview.md)

---

## System Overview

| Component | Technology | Hosting |
|-----------|-----------|---------|
| **Display** | React + Vite + GSAP | GitHub Pages |
| **Admin Panel** | React + Vite + React Hook Form | Firebase Hosting |
| **Database** | Cloud Firestore | Firebase (free tier) |
| **Auth** | Firebase Authentication | Firebase |
| **Storage** | Firebase Storage | Firebase (free tier) |

---

## Features

### Display (Public-Facing)
- **Auto-rotating category pages** — Exotic Flowers, Edibles, Vapes, Cartridges, Pre-rolls, Deals
- **5 creative animated layouts** — physics-based product cards, particle effects, neon grids
- **Real-time sync** — Firestore `onSnapshot` listeners update the display instantly
- **Deals page** — dynamic layouts for 1, 3, or 5 active deals with countdown timers
- **Fire Stick / kiosk compatible** — runs in fullscreen on any browser

### Admin Panel (Staff-Facing)
- **Product management** — add, edit, delete products with image upload
- **Category control** — activate/deactivate categories, set display duration
- **Deal management** — create time-limited deals with countdown timers
- **Push to Display** — force the display to restart its rotation immediately
- **Audit logging** — every admin action is logged to Firestore
- **Drag-and-drop** product ordering

---

## Tech Stack

- **React 19** + **Vite 7** (both apps)
- **GSAP 3** + **Framer Motion** (display animations)
- **Matter.js** (physics-based layouts)
- **Firebase SDK 12** (Firestore, Auth, Storage)
- **Zustand** (display state management)
- **React Hook Form** + **Zod** (admin form validation)
- **Lucide React** (admin icons)

---

## Project Structure

```
├── display/          # Public display frontend (GitHub Pages)
│   ├── src/
│   │   ├── layouts/  # 5 creative product layout components
│   │   ├── components/
│   │   ├── hooks/
│   │   └── firebase.js
│   └── vite.config.js
│
├── admin/            # Staff admin panel (Firebase Hosting)
│   ├── src/
│   │   ├── pages/    # Dashboard, Products, Categories, Deals, Settings
│   │   ├── components/
│   │   ├── contexts/
│   │   └── firebase.js
│   └── vite.config.js
│
├── docs/             # Design docs & specifications
├── scripts/          # Firestore seed script
├── firebase.json     # Firebase Hosting + Firestore config
├── firestore.rules   # Security rules
└── storage.rules     # Storage security rules
```

---

## Quick Start

See **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for the complete step-by-step deployment guide.

### Local Development

```bash
# Display app (http://localhost:5173)
cd display && npm install && npm run dev

# Admin app (http://localhost:5174)
cd admin && npm install && npm run dev
```

Both apps require a `.env.local` file with Firebase credentials — see `SETUP_GUIDE.md`.

---

## Live URLs

| App | URL |
|-----|-----|
| Display | `https://lucidxdreams.github.io/appledream_display/` |
| Admin | `https://YOUR_PROJECT_ID.web.app` |

---

## Documentation

| Doc | Contents |
|-----|----------|
| [01 — Overview](docs/01-overview.md) | System architecture & data flow |
| [02 — Best Practices](docs/02-cannabis-display-best-practices.md) | Cannabis display design principles |
| [03 — Tech Stack](docs/03-tech-stack.md) | Technology decisions & rationale |
| [04 — Creative UI](docs/04-creative-ui-concepts.md) | Layout animation specifications |
| [05 — Hosting](docs/05-hosting-deployment.md) | Deployment & Fire Stick setup |
| [06 — Admin](docs/06-backend-admin.md) | Admin panel architecture |
| [07 — Deals](docs/07-deals-page.md) | Deals page design spec |
| [08 — Roadmap](docs/08-development-roadmap.md) | Development phases |

---

## License

Private — all rights reserved.
