/**
 * FlowersLayout.jsx — Iridescent Bubble Universe
 *
 * Architecture:
 *   • Two rendering layers:
 *     1. fl-goo-layer  — bubble shapes only, SVG goo filter creates metaball
 *        merge effect when neighbours touch (lava-lamp interaction)
 *     2. fl-text-layer — transparent containers with product info, no filter
 *   • Free-flow layout: phyllotaxis (golden-angle) initial spread +
 *     iterative bubble-repulsion simulation → organic, non-grid placement.
 *     Featured product (index 0) anchored at centre of safe area.
 *   • Dynamic safe-zone: measures header-overflow elements (clock/weather)
 *     so no bubble ever lands beneath them.
 *   • Slow organic blob animation (12–20 s) + gentle float (5–8 s)
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import './FlowersLayout.css';

/* ── Strain → CSS class ─────────────────────────────────────── */

function getStrainClass(product) {
    const s = ((product.type || '') + ' ' + (product.name || '')).toLowerCase();
    if (s.includes('sativa')) return 'fl-bubble--sativa';
    if (s.includes('indica')) return 'fl-bubble--indica';
    if (s.includes('hybrid')) return 'fl-bubble--hybrid';
    if (s.includes('cbd'))    return 'fl-bubble--cbd';
    return 'fl-bubble--default';
}

/* ── Layout math ────────────────────────────────────────────── */

const GAP = 24;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°

/* Measures how far header children (clock, weather) overflow into the container */
function getSafeTop(container) {
    if (!container) return 0;
    const ctop = container.getBoundingClientRect().top;
    let max = 0;
    ['.app-clock', '[class*="weather"]'].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            const b = el.getBoundingClientRect().bottom;
            if (b > ctop) max = Math.max(max, b - ctop);
        });
    });
    return max > 0 ? max + GAP : 0;
}

function calcRadius(count, W, H, safeTop) {
    if (count === 0 || W === 0 || H === 0) return 44;
    const usableH = H - (safeTop || 0);
    // Solve for pure bubble r given that effectiveR = r*1.035 + 12 (text arc padding)
    // and we want effectiveR to pack at factor 2.8 — leaves room for text + float drift
    const effR = Math.sqrt((W * usableH) / (Math.max(count, 1) * Math.PI * 2.8));
    const r    = (effR - 12) / 1.035;
    return Math.min(Math.max(r, 44), 240);
}

/* Real visual radius including text arc protrusion beyond the bubble circle.
   arcR = r + 6, pill outer edge = arcR + sw/2; add 6 px safety gap. */
function arcPad(ri) {
    const fs    = Math.max(ri * 2 * 0.082, 10);
    const svgFs = fs * 0.70;
    const sw    = svgFs * 0.60;
    return Math.ceil(6 + sw * 0.5 + 6);
}

function buildPositions(count, W, H, r, safeTop, products = []) {
    if (count === 0) return [];
    const safe = safeTop || 0;
    const PAD  = GAP;
    const top  = safe + PAD;   // upper boundary for bubble centres
    const bot  = H   - PAD;   // lower boundary
    const cx   = W / 2;
    const cy   = top + (bot - top) / 2;  // centre of safe zone

    // Phyllotaxis initial spread — golden angle, elliptical to fill rectangle
    const spreadX = W / 2 - PAD;
    const spreadY = (bot - top) / 2;
    const pos = [];
    for (let i = 0; i < count; i++) {
        const ri    = products[i]?.badge ? r * 1.3 : r;
        const effRi = ri + arcPad(ri);
        let x, y;
        if (i === 0) {
            x = cx; y = cy;          // first product anchored at safe-zone centre
        } else {
            const t     = i / count;
            const angle = i * GOLDEN_ANGLE;
            x = cx + Math.cos(angle) * Math.sqrt(t) * spreadX;
            y = cy + Math.sin(angle) * Math.sqrt(t) * spreadY;
        }
        pos.push({
            x: Math.max(effRi + PAD, Math.min(W - effRi - PAD, x)),
            y: Math.max(top + effRi, Math.min(bot - effRi,     y)),
            r: ri,
        });
    }

    // Repulsion: iteratively push overlapping pairs apart.
    // ALL bubbles are mobile — i=0 (featured) yields at 0.25× so it drifts
    // toward centre naturally without blocking resolution for others.
    for (let iter = 0; iter < 500; iter++) {
        let moved = false;
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const pi  = pos[i], pj = pos[j];
                const minD = (pi.r + arcPad(pi.r)) + (pj.r + arcPad(pj.r)) + GAP;
                const dx = pj.x - pi.x, dy = pj.y - pi.y;
                const d  = Math.sqrt(dx * dx + dy * dy) || 0.001;
                if (d < minD) {
                    const push = (minD - d) * 0.55;
                    const nx = dx / d, ny = dy / d;
                    const fi = i === 0 ? 0.25 : 0.5;  // featured drifts less
                    const fj = i === 0 ? 0.75 : 0.5;
                    pi.x -= nx * push * fi; pi.y -= ny * push * fi;
                    pj.x += nx * push * fj; pj.y += ny * push * fj;
                    moved = true;
                }
            }
        }
        // Clamp ALL bubbles including featured — effective radius keeps text on-screen
        for (let i = 0; i < count; i++) {
            const p    = pos[i];
            const effR = p.r + arcPad(p.r);
            p.x = Math.max(effR + PAD, Math.min(W - effR - PAD, p.x));
            p.y = Math.max(top + effR, Math.min(bot - effR,     p.y));
        }
        if (!moved) break;
    }

    return pos;
}

/* ── Strain colour palettes — pills sync with bubble gradient ── */

const STRAIN_PALETTES = {
    sativa: {
        /* Deep brown pill on amber-orange sphere; warm cream text + gold price */
        thcBg:     '#3d1200',   cbdBg:     '#320e00',
        strainBg:  '#451500',   lblBg:     '#220a00',
        textFill:  '#fff0c0',   priceFill: '#ffe040',
    },
    indica: {
        /* Deep purple pill on royal-violet sphere; soft lavender text + lilac price */
        thcBg:     '#1e0038',   cbdBg:     '#18002e',
        strainBg:  '#240044',   lblBg:     '#0e0020',
        textFill:  '#e8c8ff',   priceFill: '#d080ff',
    },
    hybrid: {
        /* Deep maroon pill on hot-pink sphere; rose-white text + bright pink price */
        thcBg:     '#3d0020',   cbdBg:     '#300018',
        strainBg:  '#460026',   lblBg:     '#1e000f',
        textFill:  '#ffcce8',   priceFill: '#ff80c0',
    },
    cbd: {
        thcBg:     '#004858',   cbdBg:     '#003845',
        strainBg:  '#005568',   lblBg:     '#002535',
        textFill:  '#b0ecff',   priceFill: '#60d8f0',
    },
    default: {
        thcBg:     '#1a5200',   cbdBg:     '#245800',
        strainBg:  '#1e5c00',   lblBg:     '#0d3500',
        textFill:  '#d0ff90',   priceFill: '#a8f040',
    },
};

function getStrainPalette(product) {
    const label = (getStrainLabel(product) || '').toLowerCase();
    if (label.includes('sativa')) return STRAIN_PALETTES.sativa;
    if (label.includes('indica')) return STRAIN_PALETTES.indica;
    if (label.includes('hybrid')) return STRAIN_PALETTES.hybrid;
    if (label.includes('cbd'))    return STRAIN_PALETTES.cbd;
    return STRAIN_PALETTES.default;
}

/* ── Bubble info — all zones visible simultaneously ─────────── */

function fmt(p) { return p == null ? '' : `$${Number(p).toFixed(2)}`; }

function getStrainLabel(product) {
    if (product.type && product.type !== 'N/A') return product.type;
    const n = (product.name || '').toLowerCase();
    if (n.includes('sativa'))  return 'Sativa';
    if (n.includes('indica'))  return 'Indica';
    if (n.includes('hybrid'))  return 'Hybrid';
    if (n.includes('cbd'))     return 'CBD';
    return null;
}

function ProductInfo({ product, diameter }) {
    const r        = diameter / 2;
    const fs       = Math.max(diameter * 0.082, 10);  // base CSS font-size
    const svgFs    = fs * 0.70;                        // SVG arc-tag font-size
    const sw       = svgFs * 0.60;                     // stroke-width → thick pill background
    const arcR     = r + 6;                            // arc radius: 6px outside circle edge
    const lblFs    = svgFs * 1.30;                     // title+price font: 30% larger than tags
    const lblArcR  = r - 7;                            // label arc: 7px inside bubble edge
    const strArcR  = arcR + 8;                         // strain arc: 8px further outside bubble
    const lblSw    = lblFs * 0.60;                     // pill stroke scaled to label font
    const strain   = getStrainLabel(product);
    const pal      = getStrainPalette(product);

    // Safe ID: strip non-alphanumeric characters
    const uid = String(product.id ?? product.name ?? Math.random())
        .replace(/[^a-zA-Z0-9]/g, '_');

    // Arc path centred at midDeg (CW from top) spanning spanDeg total.
    // reversed=true swaps start/end so text reads L→R on the bottom half.
    // arcRadius overrides arcR to place the arc at a custom radius.
    function arcPath(midDeg, spanDeg, reversed = false, arcRadius = arcR) {
        const toRad = (d) => (d - 90) * Math.PI / 180;
        const s = midDeg - spanDeg / 2;
        const e = midDeg + spanDeg / 2;
        const [a, b] = reversed ? [e, s] : [s, e];
        const x1 = (r + arcRadius * Math.cos(toRad(a))).toFixed(2);
        const y1 = (r + arcRadius * Math.sin(toRad(a))).toFixed(2);
        const x2 = (r + arcRadius * Math.cos(toRad(b))).toFixed(2);
        const y2 = (r + arcRadius * Math.sin(toRad(b))).toFixed(2);
        // reversed: swap endpoints + flip sweep to CCW so text reads L→R on bottom arcs
        const sweep = reversed ? 0 : 1;
        return `M${x1},${y1} A${arcRadius},${arcRadius} 0 0,${sweep} ${x2},${y2}`;
    }

    return (
        <div className="fl-info" style={{ fontSize: `${fs}px` }}>

            {/* Circular image layer */}
            <div className="fl-info__circle">
                {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="fl-info__img" />
                )}
            </div>

            {/* SVG curved arc tags — text follows bubble circumference */}
            <svg
                className="fl-info__svg"
                viewBox={`0 0 ${diameter} ${diameter}`}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* THC — 10 o'clock area, 293° centre; tight pair with CBD */}
                    {product.thc  != null && <path id={`thc-${uid}`}  d={arcPath(293, 44)} />}
                    {/* CBD — 11 o'clock area, 332° centre; just above THC */}
                    {product.cbd  != null && <path id={`cbd-${uid}`}  d={arcPath(332, 38)} />}
                    {/* Strain type — 1-2 o'clock, 48° centre */}
                    {strain               && <path id={`str-${uid}`}  d={arcPath( 48, 52, false, strArcR)} />}
                    {/* Title+price — lower-right, 135° centre, reversed arc → L→R reading */}
                    <path id={`lbl-${uid}`} d={arcPath(135, 130, true, lblArcR)} />
                </defs>

                {/* ── PASS 1: pill backgrounds (stroke only, no fill) ── */}
                {/* Rendering all backgrounds before any fill prevents    */}
                {/* one character's stroke from bleeding over the next.   */}
                {product.thc != null && (
                    <text
                        fontSize={svgFs} fontWeight="800"
                        fontFamily="var(--font-display, sans-serif)"
                        dominantBaseline="central"
                        fill="none"
                        stroke={pal.thcBg} strokeWidth={sw}
                        strokeLinejoin="round" strokeLinecap="round"
                    >
                        <textPath href={`#thc-${uid}`} startOffset="50%" textAnchor="middle">
                            THC: {product.thc}%
                        </textPath>
                    </text>
                )}
                {product.cbd != null && (
                    <text
                        fontSize={svgFs} fontWeight="800"
                        fontFamily="var(--font-display, sans-serif)"
                        dominantBaseline="central"
                        fill="none"
                        stroke={pal.cbdBg} strokeWidth={sw}
                        strokeLinejoin="round" strokeLinecap="round"
                    >
                        <textPath href={`#cbd-${uid}`} startOffset="50%" textAnchor="middle">
                            CBD: {product.cbd}%
                        </textPath>
                    </text>
                )}
                {strain && (
                    <text
                        fontSize={svgFs} fontWeight="800"
                        fontFamily="var(--font-display, sans-serif)"
                        dominantBaseline="central"
                        fill="none"
                        stroke={pal.strainBg} strokeWidth={sw}
                        strokeLinejoin="round" strokeLinecap="round"
                    >
                        <textPath href={`#str-${uid}`} startOffset="50%" textAnchor="middle">
                            {strain.toUpperCase()}
                        </textPath>
                    </text>
                )}

                {/* ── PASS 2: white text fills on top ───────────────── */}
                {product.thc != null && (
                    <text
                        fontSize={svgFs} fontWeight="800"
                        fontFamily="var(--font-display, sans-serif)"
                        dominantBaseline="central"
                        fill={pal.textFill}
                    >
                        <textPath href={`#thc-${uid}`} startOffset="50%" textAnchor="middle">
                            THC: {product.thc}%
                        </textPath>
                    </text>
                )}
                {product.cbd != null && (
                    <text
                        fontSize={svgFs} fontWeight="800"
                        fontFamily="var(--font-display, sans-serif)"
                        dominantBaseline="central"
                        fill={pal.textFill}
                    >
                        <textPath href={`#cbd-${uid}`} startOffset="50%" textAnchor="middle">
                            CBD: {product.cbd}%
                        </textPath>
                    </text>
                )}
                {strain && (
                    <text
                        fontSize={svgFs} fontWeight="800"
                        fontFamily="var(--font-display, sans-serif)"
                        dominantBaseline="central"
                        fill={pal.textFill}
                    >
                        <textPath href={`#str-${uid}`} startOffset="50%" textAnchor="middle">
                            {strain.toUpperCase()}
                        </textPath>
                    </text>
                )}

                {/* ── PASS 1 background: title+price pill ─────────── */}
                {/* reversed arc: L→R reading, upright glyphs, follows bottom arc */}
                <text
                    fontSize={lblFs} fontWeight="800"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                    dominantBaseline="central"
                    fill="none"
                    stroke={pal.lblBg} strokeWidth={lblSw}
                    strokeLinejoin="round" strokeLinecap="round"
                >
                    <textPath href={`#lbl-${uid}`} startOffset="50%" textAnchor="middle">
                        {product.name}
                        {product.price != null && (
                            <tspan dx={lblFs * 0.9} dy={svgFs * 0.35} fontSize={lblFs * 1.2} strokeWidth={lblFs * 0.78}>
                                {fmt(product.price)}
                            </tspan>
                        )}
                    </textPath>
                </text>

                {/* ── PASS 2 fill: title white, price gold ─────────── */}
                <text
                    fontSize={lblFs} fontWeight="800"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                    dominantBaseline="central"
                    fill="#ffffff"
                >
                    <textPath href={`#lbl-${uid}`} startOffset="50%" textAnchor="middle">
                        {product.name}
                        {product.price != null && (
                            <tspan dx={lblFs * 0.9} dy={svgFs * 0.35} fontSize={lblFs * 1.2} fill={pal.priceFill}>
                                {fmt(product.price)}
                            </tspan>
                        )}
                    </textPath>
                </text>
            </svg>
        </div>
    );
}

/* ── Main export ────────────────────────────────────────────── */

export default function FlowersLayout({ products = [] }) {
    const containerRef = useRef(null);
    const [dim, setDim] = useState({ W: 0, H: 0 });
    const [safeTop, setSafeTop] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            setDim({ W: el.clientWidth, H: el.clientHeight });
            setSafeTop(getSafeTop(el));
        };
        // Delay first measurement so header children have rendered
        const t = setTimeout(update, 120);
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => { clearTimeout(t); ro.disconnect(); };
    }, []);

    const { W, H } = dim;
    const r = useMemo(
        () => (W > 0 ? calcRadius(products.length, W, H, safeTop) : 0),
        [products.length, W, H, safeTop]
    );
    const badgeKey = products.map(p => p.badge ? '1' : '0').join('');
    const positions = useMemo(
        () => (W > 0 && r > 0 ? buildPositions(products.length, W, H, r, safeTop, products) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [products.length, W, H, r, safeTop, badgeKey]
    );

    return (
        <div className="fl-root" ref={containerRef}>

            {/* ── SVG goo filter definition ──────────────────── */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <filter id="fl-goo" x="-30%" y="-30%" width="160%" height="160%">
                        {/* Blur all bubble shapes together */}
                        <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
                        {/* Threshold alpha → hard goo edge; close bubbles merge */}
                        <feColorMatrix in="blur" mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
                            result="goo" />
                        {/* Restore original gradient colours inside the goo mask */}
                        <feComposite in="SourceGraphic" in2="goo" operator="in" />
                    </filter>
                    {/* Lighter goo for text pill labels — smaller blur keeps text crisp */}
                    <filter id="fl-text-goo" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                        <feColorMatrix in="blur" mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12"
                            result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="in" />
                    </filter>
                </defs>
            </svg>

            {/* ── Layer 1: bubble shapes with goo filter ──────── */}
            <div className="fl-goo-layer">
                {positions.map((pos, i) => {
                    const product  = products[i];
                    if (!product || !pos) return null;
                    const diameter = pos.r * 2;
                    const floatDur = 6 + (i * 1.3) % 5;           // 6–11 s, spread across primes
                    const floatDel = (i * 0.31).toFixed(2);
                    const blobDur  = 12 + (i % 5) * 2;
                    const blobDel  = -((i * 2.1) % blobDur).toFixed(2);
                    // 2D float waypoints — deterministic per index, unique path per bubble
                    const fx1 = ((i * 7  + 2) % 22) - 11;
                    const fy1 = ((i * 5  + 1) % 20) - 10;
                    const fx2 = ((i * 11 + 7) % 18) - 9;
                    const fy2 = ((i * 3  + 4) % 20) - 10;
                    const fx3 = ((i * 13 + 5) % 16) - 8;
                    const fy3 = ((i * 6  + 3) % 18) - 9;
                    return (
                        <div
                            key={`bg-${product.id}`}
                            className={`fl-bubble-bg ${getStrainClass(product)}`}
                            style={{
                                left:            pos.x,
                                top:             pos.y,
                                width:           diameter,
                                height:          diameter,
                                '--fl-dur':      `${floatDur}s`,
                                '--fl-del':      `${floatDel}s`,
                                '--fl-blob-dur': `${blobDur}s`,
                                '--fl-blob-del': `${blobDel}s`,
                                '--fl-x1': `${fx1}px`, '--fl-y1': `${fy1}px`,
                                '--fl-x2': `${fx2}px`, '--fl-y2': `${fy2}px`,
                                '--fl-x3': `${fx3}px`, '--fl-y3': `${fy3}px`,
                            }}
                        />
                    );
                })}
            </div>

            {/* ── Layer 2: product text with text-scale goo filter ─ */}
            <div className="fl-text-goo-layer">
                {positions.map((pos, i) => {
                    const product  = products[i];
                    if (!product || !pos) return null;
                    const diameter = pos.r * 2;
                    const floatDur = 6 + (i * 1.3) % 5;           // must match BG layer exactly
                    const floatDel = (i * 0.31).toFixed(2);
                    const fx1 = ((i * 7  + 2) % 22) - 11;
                    const fy1 = ((i * 5  + 1) % 20) - 10;
                    const fx2 = ((i * 11 + 7) % 18) - 9;
                    const fy2 = ((i * 3  + 4) % 20) - 10;
                    const fx3 = ((i * 13 + 5) % 16) - 8;
                    const fy3 = ((i * 6  + 3) % 18) - 9;
                    return (
                        <div
                            key={`txt-${product.id}`}
                            className="fl-bubble-slot"
                            style={{
                                left:       pos.x,
                                top:        pos.y,
                                width:      diameter,
                                height:     diameter,
                                '--fl-dur': `${floatDur}s`,
                                '--fl-del': `${floatDel}s`,
                                '--fl-x1': `${fx1}px`, '--fl-y1': `${fy1}px`,
                                '--fl-x2': `${fx2}px`, '--fl-y2': `${fy2}px`,
                                '--fl-x3': `${fx3}px`, '--fl-y3': `${fy3}px`,
                            }}
                        >
                            <ProductInfo product={product} diameter={diameter} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
