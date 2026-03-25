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
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, MeshDistortMaterial, Float } from '@react-three/drei';
import { Vector3, AdditiveBlending, CanvasTexture } from 'three';
import './FlowersLayout.css';

/* ── Strain → WebGL glass tint colour ───────────────────────── */

const STRAIN_TINT = {
    sativa: '#bbff44',
    indica: '#8844ff',
    hybrid: '#ff6644',
    cbd:    '#44ddff',
    default:'#99ffcc',
};

function getStrainTint(product) {
    const s = ((product.type || '') + ' ' + (product.name || '')).toLowerCase();
    if (s.includes('sativa')) return STRAIN_TINT.sativa;
    if (s.includes('indica')) return STRAIN_TINT.indica;
    if (s.includes('hybrid')) return STRAIN_TINT.hybrid;
    if (s.includes('cbd'))    return STRAIN_TINT.cbd;
    return STRAIN_TINT.default;
}

/* ── Radial glow texture — cached per strain colour ─────────── */

const _glowCache = new Map();
function getGlowTexture(hexColor) {
    if (_glowCache.has(hexColor)) return _glowCache.get(hexColor);
    const size = 256;
    const cv   = document.createElement('canvas');
    cv.width   = cv.height = size;
    const ctx  = cv.getContext('2d');
    const c    = size / 2;
    const rv   = parseInt(hexColor.slice(1, 3), 16);
    const gv   = parseInt(hexColor.slice(3, 5), 16);
    const bv   = parseInt(hexColor.slice(5, 7), 16);
    // transparent centre → opaque at bubble edge → transparent at sprite edge
    // sprite scale = r*2.10; bubble fills r/(r*1.05)=0.952 of sprite half → stop at 0.95
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0,    `rgba(${rv},${gv},${bv},0)`);
    grad.addColorStop(0.95, `rgba(${rv},${gv},${bv},1)`);
    grad.addColorStop(1,    `rgba(${rv},${gv},${bv},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new CanvasTexture(cv);
    _glowCache.set(hexColor, tex);
    return tex;
}

/* ── 3D glass-sphere scene (inside R3F Canvas) ───────────────── */

function Scene({ positions, products, slotRefs }) {
    const { camera, size } = useThree();
    const groupRefs = useRef([]);
    const vec       = useRef(new Vector3());

    useFrame(() => {
        for (let i = 0; i < positions.length; i++) {
            const group = groupRefs.current[i];
            const slot  = slotRefs.current[i];
            if (!group || !slot) continue;
            group.getWorldPosition(vec.current);
            vec.current.project(camera);
            const x = (vec.current.x  + 1) / 2 * size.width;
            const y = (-vec.current.y + 1) / 2 * size.height;
            slot.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
        }
    });

    return (
        <>
            <Environment preset="city" />
            {positions.map((pos, i) => {
                const product = products[i];
                if (!product || !pos) return null;
                const x     = pos.x - size.width  / 2;
                const y     = size.height / 2 - pos.y;
                const speed = 1.2 + (i * 0.17) % 0.9;
                return (
                    <Float
                        key={`f-${product.id}`}
                        speed={speed}
                        rotationIntensity={0}
                        floatIntensity={0.5}
                    >
                        <group
                            ref={el => { groupRefs.current[i] = el; }}
                            position={[x, y, 0]}
                        >
                            <sprite scale={[pos.r * 2.10, pos.r * 2.10, 1]}>
                                <spriteMaterial
                                    map={getGlowTexture(getStrainTint(product))}
                                    transparent
                                    depthWrite={false}
                                    blending={AdditiveBlending}
                                />
                            </sprite>
                            <mesh scale={pos.r}>
                                <sphereGeometry args={[1, 32, 32]} />
                                <MeshDistortMaterial
                                    color={getStrainTint(product)}
                                    distort={0.20}
                                    speed={2}
                                    transmission={1}
                                    thickness={0.4}
                                    roughness={0}
                                    iridescence={1}
                                    iridescenceIOR={1.2}
                                    iridescenceThicknessRange={[0, 1200]}
                                    clearcoat={1}
                                    clearcoatRoughness={0}
                                    envMapIntensity={1.2}
                                />
                            </mesh>
                        </group>
                    </Float>
                );
            })}
        </>
    );
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
        thcBg:          '#3d1200',   cbdBg:     '#320e00',
        strainBg:       '#6b2a00',   lblBg:     '#220a00',
        textFill:       '#fff0c0',   priceFill: '#ffe040',
        strainTextFill: '#ffcc00',
        badgeBg:        '#0a2200',   badgeGrad1:'#aaff00',  badgeGrad2:'#55cc00',
    },
    indica: {
        thcBg:          '#1e0038',   cbdBg:     '#18002e',
        strainBg:       '#2e0055',   lblBg:     '#0e0020',
        textFill:       '#e8c8ff',   priceFill: '#d080ff',
        strainTextFill: '#cc44ff',
        badgeBg:        '#12002e',   badgeGrad1:'#dd44ff',  badgeGrad2:'#8800cc',
    },
    hybrid: {
        thcBg:          '#3d0020',   cbdBg:     '#300018',
        strainBg:       '#500022',   lblBg:     '#1e000f',
        textFill:       '#ffcce8',   priceFill: '#ff80c0',
        strainTextFill: '#ff44aa',
        badgeBg:        '#2e0c00',   badgeGrad1:'#ff6622',  badgeGrad2:'#ff2266',
    },
    cbd: {
        thcBg:          '#004858',   cbdBg:     '#003845',
        strainBg:       '#001e5c',   lblBg:     '#002535',
        textFill:       '#b0ecff',   priceFill: '#60d8f0',
        strainTextFill: '#22ccff',
        badgeBg:        '#001428',   badgeGrad1:'#00ddff',  badgeGrad2:'#0088cc',
    },
    default: {
        thcBg:          '#1a5200',   cbdBg:     '#245800',
        strainBg:       '#1c4800',   lblBg:     '#0d3500',
        textFill:       '#d0ff90',   priceFill: '#a8f040',
        strainTextFill: '#88ff22',
        badgeBg:        '#001408',   badgeGrad1:'#44ff88',  badgeGrad2:'#00bb55',
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
    const strArcR  = arcR - 4;                         // strain arc: hugs the bubble edge
    const lblSw      = lblFs * 0.60;
    const badgeArcR  = strArcR + 14;
    const badgeFs    = svgFs * 1.65;
    const badgeSw    = badgeFs * 0.65;
    const strain     = getStrainLabel(product);
    const pal        = getStrainPalette(product);
    const badge      = product.badge;

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
                    {product.thc  != null && <path id={`thc-${uid}`}  d={arcPath(293, 44)} />}
                    {product.cbd  != null && <path id={`cbd-${uid}`}  d={arcPath(332, 38)} />}
                    {strain               && <path id={`str-${uid}`}  d={arcPath( 48, 52, false, strArcR)} />}
                    {badge                && <path id={`bdg-${uid}`}  d={arcPath( 48, 72, false, badgeArcR)} />}
                    {badge && (
                        <linearGradient id={`bdg-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%"   stopColor={pal.badgeGrad1} />
                            <stop offset="50%"  stopColor={pal.badgeGrad2} />
                            <stop offset="100%" stopColor={pal.badgeGrad1} />
                        </linearGradient>
                    )}
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
                {badge && (
                    <text
                        fontSize={badgeFs} fontWeight="900"
                        fontFamily="var(--font-display, sans-serif)"
                        dominantBaseline="central"
                        fill="none"
                        stroke={pal.badgeBg} strokeWidth={badgeSw}
                        strokeLinejoin="round" strokeLinecap="round"
                    >
                        <textPath href={`#bdg-${uid}`} startOffset="50%" textAnchor="middle">
                            {String(badge).toUpperCase()}
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
                        fill={pal.strainTextFill || pal.textFill}
                    >
                        <textPath href={`#str-${uid}`} startOffset="50%" textAnchor="middle">
                            {strain.toUpperCase()}
                        </textPath>
                    </text>
                )}
                {badge && (
                    <text
                        fontSize={badgeFs} fontWeight="900"
                        fontFamily="var(--font-display, sans-serif)"
                        dominantBaseline="central"
                        fill={`url(#bdg-grad-${uid})`}
                    >
                        <textPath href={`#bdg-${uid}`} startOffset="50%" textAnchor="middle">
                            {String(badge).toUpperCase()}
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
    const slotRefs     = useRef([]);
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

            {/* ── Back layer: WebGL glass spheres ───────────────── */}
            <Canvas
                orthographic
                camera={{ zoom: 1, position: [0, 0, 100], near: 0.1, far: 200 }}
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                gl={{ alpha: true, antialias: true }}
            >
                <Scene positions={positions} products={products} slotRefs={slotRefs} />
            </Canvas>

            {/* ── Front layer: always on top of canvas, positions driven by useFrame ─ */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {positions.map((pos, i) => {
                    const product  = products[i];
                    if (!product || !pos) return null;
                    const diameter = pos.r * 2;
                    return (
                        <div
                            key={`txt-${product.id}`}
                            ref={el => { slotRefs.current[i] = el; }}
                            style={{
                                position:      'absolute',
                                width:         diameter,
                                height:        diameter,
                                top:           0,
                                left:          0,
                                transform:     `translate(calc(${pos.x}px - 50%), calc(${pos.y}px - 50%))`,
                                pointerEvents: 'none',
                                userSelect:    'none',
                                willChange:    'transform',
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
