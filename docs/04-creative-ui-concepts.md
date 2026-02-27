# 04 — Creative UI Concepts & Design Language

Visual identity, animation concepts, and creative layout strategies for the Cannabis Advertising Display System.

---

## Brand Identity: "The Living Garden"

The display should feel like a **living organism** — products breathe, glow, and move as if they are alive. The aesthetic draws from:

- **The plant itself** — rich greens, forest depths, amber trichomes
- **Premium dispensary design** — dark luxury, gold accents, marble-like surfaces
- **Bioluminescence** — objects that glow from within, like fireflies or deep-sea life
- **Smoke and vapor** — wispy particle effects that drift upward

This creates an unforgettable, high-end atmosphere appropriate for a cannabis dispensary catering to enthusiast customers.

---

## Color System

### Base Palette

| Role | Color | Hex |
|------|-------|-----|
| Deep Background | Forest Night | `#080f09` |
| Surface Dark | Mossy Stone | `#0d1a10` |
| Surface Mid | Dark Canopy | `#132117` |
| Border Glow | Ember Green | `#2d5a27` |
| Primary Accent | Trichome Gold | `#c8a951` |
| Secondary Accent | Cannabis Green | `#4a7c59` |
| Highlight | Neon Lime | `#7CB518` |
| Text Primary | Pale Cream | `#f0ead6` |
| Text Secondary | Sage | `#9db89e` |
| Danger/Deal | Blazing Ember | `#e85c2b` |
| Deal Gold | Fire Gold | `#ffaa00` |

### Category-Specific Themes

| Category | Primary | Accent | Particle |
|----------|---------|--------|----------|
| Exotic Flowers | `#1a472a` | `#7CB518` | Emerald sparkles |
| Edibles | `#4a1a4f` | `#e85c9e` | Candy shimmer |
| Disposables/Vapes | `#0a0a2e` | `#5e81f4` | Electric blue arcs |
| Cartridges | `#1a1a1a` | `#c0c0c0` | Metallic dust |
| Pre-rolls | `#2e1a00` | `#c8a951` | Amber wisps |
| Deals | `#2e0000` | `#ff3300` | Fire/ember sparks |

---

## Typography Hierarchy

```
Display Heading (Category name):
  Font: Outfit Black (900)
  Size: 4-8vw (scales with screen)
  Treatment: Gradient text + glow shadow

Product Name:
  Font: Outfit Bold (700)
  Size: 1.5-3vw
  Treatment: White text, subtle text-shadow

THC% / Price (key stats):
  Font: Bebas Neue
  Size: 2-5vw
  Treatment: Trichome Gold (#c8a951), glow effect

Description / Terpenes:
  Font: Inter Regular (400)
  Size: 0.8-1.5vw
  Treatment: Sage (#9db89e), no decoration

Badge Labels:
  Font: Outfit SemiBold (600)
  Size: 0.7-1.2vw
  Treatment: Pill shape, category accent color
```

---

## Concept 1: "The Bud Universe" (Recommended — Flowers & Pre-Rolls)

**Concept**: Products float as **glowing orbs** in a dark space, each one a different size based on popularity or price. They slowly drift and orbit, bumping gently off each other using physics simulation (Matter.js). The sizes dynamically adjust so all products fill the screen.

### Visual Description
- Dark background with floating trichome particle field (like stars)
- Each product is a **circular card** with the product image as the center
- Cards have a glowing rim in the category accent color
- Cards drift with slight organic motion (sine wave path)
- On a 7-second cycle, each card subtly pulses and shows its full info overlay
- The largest card (featured product) anchors in the center

### Technical Approach
```javascript
// Matter.js bodies for each product
// Each body = a circle with radius proportional to featured status
// Renderer draws React product cards at the body position
// Bodies have low restitution (bounce) and slight gravity
// A central attractor force keeps cards from flying off screen
// CSS: backdrop-filter: blur() for card glass effect
```

### Layout Formula
```
screenArea = window.innerWidth * window.innerHeight
baseRadius = Math.sqrt(screenArea / (products.length * Math.PI * 2))
featuredRadius = baseRadius * 1.8
regularRadius = baseRadius * (0.7 to 1.2) // slight variation
```

---

## Concept 2: "Neural Constellation" (Recommended — Edibles & Cartridges)

**Concept**: Products are connected by glowing lines forming a **constellation or neural network**. Each node (product) is a hexagonal card. Lines between related products (same brand, same effect) glow and pulse.

### Visual Description
- Products as hexagonal cards with frosted glass texture
- SVG lines connecting cards, animating with flowing light particles
- Background: deep space with subtle nebula gradient
- Cards arranged using a force-directed graph layout (D3-like forces)
- When category loads, cards "materialize" spawning from center

### Why This Works for Edibles
- Edibles have many sub-categories (gummies, chocolate, beverages) — the network structure naturally groups them
- The constellation aesthetic is delightful and unexpected — customers stop to look

---

## Concept 3: "The Smoke Shelf" (Pre-rolls & Disposables)

**Concept**: Products appear on **floating shelves in 3D perspective** with smoke wisps rising from them. The camera slowly pans across the shelves, giving a cinematic feel.

### Visual Description
- 3D perspective-style shelf layout using CSS `perspective` and `transform`
- Products arranged on 2-3 "floating planks" at different depths
- Smoke particle CSS animations rising from each product position
- Camera auto-pans left and right slowly (CSS transform on wrapper)
- Warm amber lighting effect using radial gradient overlays

### GSAP Animation
```javascript
gsap.to('.shelf-wrapper', {
  x: '-100vw',
  duration: 20,
  ease: 'none',
  repeat: -1,
  yoyo: true
});
```

---

## Concept 4: "The Vault" (Deals Page Only)

**Concept**: Deals burst open like **a vault being unlocked** — dramatic, high-energy, urgent. Each deal card "slams" into position with a boom animation and glows red/orange.

### Visual Description
- Opening animation: concentric circles expanding from center (like ripples) then deals appear
- Background: dark red with ember particle system flowing upward
- Deal cards use a "torn paper" or "ripped label" aesthetic for prices
- Countdown timers are prominent — bold red digits ticking down
- "DEAL OF THE DAY" hero takes 60% of screen
- Remaining deals scroll horizontally in a ticker below

---

## Global Animation System

### Category Transitions (Between Slides)

```
1. Current category: products implode toward center → dissolve
2. Particle burst fills screen in new category's accent color
3. New category name flies in from off-screen (split-text animation)
4. New products materialize based on their layout concept
Total duration: ~1.5 seconds
```

### Product Card "Info Pulse"

Every 7 seconds, each card cycles through its info layers:
```
Layer 1: Product Image + Name + Price (default)
Layer 2: THC/CBD info + Strain Type (pulses in)
Layer 3: Terpenes/Effects (pulses in)
Layer 4 (flowers only): Lineage info
→ Back to Layer 1
```

### Ambient Effects (Always Running)

- **Particle field**: 40-80 tiny particles float upward at all times (category-themed color)
- **Glow pulse**: Category accent color pulses slowly on the background (2-4s cycle)
- **Shimmer**: Product card borders have an animated shimmer highlight

---

## Glassmorphism Product Cards

All product cards use the Glassmorphism style:

```css
.product-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}
```

The glow rim on card border uses the category accent color:
```css
.product-card::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    var(--category-accent) 0%,
    transparent 50%,
    var(--category-accent) 100%
  );
  opacity: 0.4;
  animation: border-rotate 4s linear infinite;
}
```

---

## Screen Composition (All Categories)

```
┌──────────────────────────────────────────────────────────┐
│ [Logo] [Category Name — Large]          [Time] [Temp?]  │  ← 8% height header
│──────────────────────────────────────────────────────────│
│                                                          │
│                                                          │
│              PRODUCT LAYOUT AREA                         │  ← 84% height
│         (full-bleed, no padding waste)                   │
│                                                          │
│                                                          │
│──────────────────────────────────────────────────────────│
│  [Next Category Preview]      [Category Dot Indicators] │  ← 8% height footer
└──────────────────────────────────────────────────────────┘
```

---

## Performance Targets (Fire Stick Compatibility)

| Metric | Target | Strategy |
|--------|--------|----------|
| FPS | ≥ 45fps sustained | Use CSS transforms only (GPU layer) |
| JS Animation | ≤ 16ms frame time | Matter.js runs in Web Worker |
| Particle count | ≤ 80 per frame | Canvas-based particles, not DOM |
| Initial load | ≤ 4 seconds | Lazy-load images, Vite code splitting |
| Memory | ≤ 300MB | Product images compressed to WebP ≤ 200KB each |

---

## Accessibility (Display-mode)

This is a passive display, not interactive, so normal web accessibility rules are relaxed. However:
- Text contrast must be ≥ 4.5:1 for prices and product names (legible from distance)
- Font sizes must be readable from 10 feet (minimum 24px at 1080p)
- No seizure-inducing flash animations (flicker < 3Hz)
