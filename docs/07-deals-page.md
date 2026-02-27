# 07 — Deals Page: Design Specification

The Deals Page is the most visually dramatic category in the rotation. It must command attention, create urgency, and clearly communicate value to customers.

---

## Purpose & Goals

1. **Immediate attention**: The deals page should visually "jolt" viewers coming from a calm product category
2. **Clear value communication**: Customers must instantly understand what the deal is and how much they save
3. **Urgency cues**: Time limits, "limited quantity", countdown timers push impulse decisions
4. **Product recognition**: Show product images — customers need to recognize what they're buying

---

## Deal Types Supported

| Deal Type | Display Style | Example |
|-----------|--------------|---------|
| **BOGO** | "BUY 1 GET 1 FREE" badge over two product images | Buy 1 Pre-Roll, Get 1 Free |
| **Percentage Discount** | Large "% OFF" + strikethrough price | 30% OFF all Edibles |
| **Dollar Discount** | "$X OFF" + new price highlighted | $10 OFF any Vape |
| **Bundle Deal** | Products grouped under a single price | Joint Pack + Lighter = $25 |
| **Flash Sale** | Countdown timer prominently displayed | Flash Sale: 2 Hours Only |
| **First-Time Customer** | Badge + special text | First Visit? 20% Off Entire Order |
| **Daily Special** | Day-tagged (e.g., "Wax Wednesday") | Every Wednesday: Concentrates 20% Off |

---

## Visual Design System: "The Vault"

### Color Palette
| Element | Color | Hex |
|---------|-------|-----|
| Background | Burning Dark | `#150500` |
| Background Gradient | Ember Red | `#2e0800` |
| Deal Card Surface | Dark Glass | `rgba(255,40,0,0.05)` |
| Deal Card Border | Fire Glow | `rgba(255,100,0,0.3)` |
| Sale Badge | Flame Red | `#ff3300` |
| Price Highlight | Fire Gold | `#FFD700` |
| Strikethrough Price | Muted Grey | `#888888` |
| Text Primary | Bright Cream | `#fff5e6` |
| Text Secondary | Warm Grey | `#cc9966` |
| Countdown Timer | Urgent Red | `#ff4444` |
| Border Glow | Amber | `rgba(255,170,0,0.6)` |

### Particle System
```
Ember particles (50-80 particles):
  - Small orange/red dots (2-4px diameter)
  - Float upward from bottom of screen
  - Slight horizontal drift (noise-based)
  - Fade out as they rise
  - Color: HSL(20-30, 100%, 50-70%)
  - Speed: slow rise (2-5% of screen height per second)
  - Spawn rate: 3-4 new particles per frame
```

---

## Layout Options (Based on Deal Count)

### 1 Deal Active — "Full Bleed Hero"
```
┌────────────────────────────────────────────────────────┐
│  🔥 DEAL OF THE DAY                    [ENDS IN 02:47] │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │   [Product Image - Large]   BOGO PRE-ROLLS!      │  │
│  │                             ─────────────────    │  │
│  │                             BUY 1 GET 1 FREE     │  │
│  │                             ~~$14~~ → FREE!      │  │
│  │                             Save $14 per pack    │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 2–3 Deals Active — "Hero + Side Panel"
```
┌────────────────────────────────────────────────────────┐
│  ┌────────────────────┐  ┌─────────────────────────┐   │
│  │                    │  │ 🔥 Flash Sale           │   │
│  │  FEATURED DEAL     │  │ Raw Papers + Tips       │   │
│  │  (60% of screen)   │  │ ~~$8~~ → $4.99  [SAVE] │   │
│  │                    │  ├─────────────────────────┤   │
│  │                    │  │ 🎁 Bundle Deal          │   │
│  │                    │  │ Starter Kit             │   │
│  │                    │  │ $29.99 (Save $15)  [GO] │   │
│  └────────────────────┘  └─────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### 4–6 Deals Active — "Deal Grid"
```
┌────────────────────────────────────────────────────────┐
│  🔥 TODAY'S DEALS                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ BOGO     │  │ 30% OFF  │  │ BUNDLE   │             │
│  │ [image]  │  │ [image]  │  │ [image]  │             │
│  │ ~~$28~~  │  │ ~~$15~~  │  │ ~~$45~~  │             │
│  │ FREE 2nd │  │ $10.50   │  │ $29.99   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐                           │
│  │ $10 OFF  │  │ DAILY    │                           │
│  │ [image]  │  │ SPECIAL  │                           │
│  │ ~~$30~~  │  │ [image]  │                           │
│  │ $20      │  │ 20% OFF  │                           │
│  └──────────┘  └──────────┘                           │
└────────────────────────────────────────────────────────┘
```

---

## Deals Page Entry Animation ("The Vault Open")

```
Duration: 1.8 seconds total

0.0s: Screen is black
0.2s: Concentric rings expand from center (ember color)
0.5s: Screen fills with ember particles
0.7s: "🔥 DEALS" text slams in from top (GSAP elastic ease)
0.9s: Deal cards "fall" into position from above with bounce
1.2s: Countdown timers start ticking
1.5s: Glow borders on cards animate on
1.8s: Ambient particle system takes over (continuous)
```

```javascript
// GSAP Vault Open Timeline
const tl = gsap.timeline();
tl.from('.vault-rings', { scale: 0, opacity: 0, duration: 0.5, ease: 'power4.out' })
  .to('.particle-system', { opacity: 1, duration: 0.3 }, '-=0.2')
  .from('.deals-header', { y: -100, opacity: 0, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.1')
  .from('.deal-card', {
    y: -200,
    opacity: 0,
    stagger: 0.15,
    duration: 0.5,
    ease: 'bounce.out'
  }, '-=0.2')
  .from('.countdown-timer', { scale: 0, duration: 0.3, ease: 'elastic.out(1, 0.3)' }, '-=0.1');
```

---

## Deal Card Component

### Visual Structure
```
┌─────────────────────────────────┐
│ [DEAL TYPE BADGE]      [TIMER]  │  ← badge top-left, timer top-right
│                                 │
│         [Product Image]         │  ← center, ~40% of card height
│                                 │
│  [Product Name]                 │  ← bold, readable
│  ~~Original Price~~             │  ← grey strikethrough
│  [Deal Price / Savings]         │  ← gold, very large
│                                 │
│  [Description / Details]        │  ← small, secondary
└─────────────────────────────────┘
```

### Deal Badge Styles by Type
| Type | Badge | Color |
|------|-------|-------|
| BOGO | 🔁 BOGO | `#ff3300` |
| Discount % | XX% OFF | `#ff6600` |
| Dollar Discount | $X OFF | `#ff9900` |
| Bundle | 📦 BUNDLE | `#9900ff` |
| Flash Sale | ⚡ FLASH | `#0066ff` |
| Daily Special | 📅 TODAY | `#00aa44` |

---

## Countdown Timer Component

For time-limited deals, a live countdown timer displays:

```javascript
// CountdownTimer component
const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endTime));
  
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(endTime);
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        // Deal expired — remove from display
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);
  
  return (
    <div className="countdown">
      <span className="unit">{timeLeft.hours}h</span>
      <span className="unit">{timeLeft.minutes}m</span>
      <span className="unit">{timeLeft.seconds}s</span>
    </div>
  );
};
```

Timer styling: Red pulsing digits, Bebas Neue font, animated colon blink between units.

---

## "No Active Deals" Fallback

When there are no active deals:
- Show "Coming Soon" animated placeholder
- Display store's loyalty program teaser
- Show a beautiful cannabis abstract animation loop
- OR automatically skip the Deals category in the rotation (configurable in settings)

---

## Best Practices Applied to This Design

1. **Urgency language**: "Today Only," "Limited Qty," countdown timers
2. **Unmissable savings**: Strikethrough + new price is the most eye-catching element
3. **Product imagery**: Shown even on deal cards for recognition
4. **No health claims**: Deals are about price/value, never about effects
5. **Daily rotation**: Backend supports scheduling different deals for each weekday
6. **Clear hierarchy**: Deal type → Product Name → Savings → Details
