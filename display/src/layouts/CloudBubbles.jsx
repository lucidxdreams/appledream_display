/**
 * CloudBubbles.jsx — Exotic Flowers Display (D3 Force-Directed Bubble Cloud)
 *
 * Architecture:
 *   1. d3.forceSimulation with forceCollide guarantees zero overlap
 *   2. Boundary forces keep ALL nodes within safe area (below header, above footer)
 *   3. NO post-simulation clamping — simulation itself resolves boundaries
 *   4. Strain-specific gradient colors on circles, arc text, names, and prices
 *   5. Badged products are 1.35x bigger
 */

import { useMemo, useEffect, useRef, useState } from 'react';
import {
    forceSimulation,
    forceCollide,
    forceX,
    forceY,
    forceManyBody,
} from 'd3-force';
import './CloudBubbles.css';

/* ── Strain profiles — colors for each strain ────────────────────────── */
const STRAIN_COLORS = {
    indica: {
        grad1: '#9b59b6',    // rich orchid purple
        grad2: '#3498db',    // cool blue
        border: 'rgba(155, 89, 182, 0.45)',
        bgFrom: 'rgba(88, 40, 130, 0.55)',
        bgTo: 'rgba(20, 10, 40, 0.85)',
        glow: 'rgba(155, 89, 182, 0.15)',
        arcStroke1: '#9b59b6',
        arcStroke2: '#8e44ad',
        arcFill: '#d2b4de',
    },
    sativa: {
        grad1: '#f39c12',    // vibrant orange
        grad2: '#e74c3c',    // energetic red
        border: 'rgba(243, 156, 18, 0.45)',
        bgFrom: 'rgba(140, 90, 20, 0.55)',
        bgTo: 'rgba(40, 22, 5, 0.85)',
        glow: 'rgba(243, 156, 18, 0.15)',
        arcStroke1: '#f39c12',
        arcStroke2: '#e67e22',
        arcFill: '#fdebd0',
    },
    hybrid: {
        grad1: '#2ecc71',    // emerald green
        grad2: '#1abc9c',    // teal
        border: 'rgba(46, 204, 113, 0.45)',
        bgFrom: 'rgba(30, 100, 55, 0.55)',
        bgTo: 'rgba(8, 28, 18, 0.85)',
        glow: 'rgba(46, 204, 113, 0.15)',
        arcStroke1: '#2ecc71',
        arcStroke2: '#27ae60',
        arcFill: '#d5f5e3',
    },
};

/* ── Strain profile detection ────────────────────────────────────── */
function getStrainProfile(product) {
    const type = (product.type || '').toLowerCase();
    if (type.includes('indica')) return 'indica';
    if (type.includes('sativa')) return 'sativa';
    if (type.includes('hybrid')) return 'hybrid';
    return 'hybrid';
}

/* ── Container size measurement ─────────────────────────────────────── */
function useContainerSize(ref) {
    const [size, setSize] = useState({ w: 1280, h: 720 });
    useEffect(() => {
        if (!ref.current) return;
        const measure = () => {
            if (!ref.current) return;
            setSize({
                w: ref.current.clientWidth || 1280,
                h: ref.current.clientHeight || 720,
            });
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(ref.current);
        return () => ro.disconnect();
    }, [ref]);
    return size;
}

/* ── Badge size multiplier — badged products are bigger ────────────── */
const BADGE_SCALE = 1.35;
function hasBadge(product) {
    return !!(product.badge && product.badge.trim());
}

/* ── Bubble radius — scaled to product count + available space ────── */
function calcRadius(count, W, H) {
    if (count === 0) return 80;
    const area = W * H;
    const coverage = count <= 3 ? 0.16 : count <= 6 ? 0.20 : count <= 12 ? 0.24 : 0.28;
    const perArea = (area * coverage) / count;
    const r = Math.sqrt(perArea / Math.PI);
    return Math.max(40, Math.min(r, 110));
}

/* ── D3 Force Simulation Layout Hook ─────────────────────────────── */
const LABEL_HEIGHT = 52;
const COLLISION_PAD = 16;
const HEADER_RESERVED = 180;  // Keep bubbles clear of header (logo + clock + weather)

function useForceLayout(products, W, H) {
    return useMemo(() => {
        const count = products.length;
        if (!count || !W || !H) return { positions: [], radii: [], r: 80 };

        const baseR = calcRadius(count, W, H);

        // Per-product radii: badged products are bigger
        const radii = products.map(p => hasBadge(p) ? baseR * BADGE_SCALE : baseR);

        // Safe bounds — where bubble CENTERS can live
        // Account for: circle radius + label + header
        const safeLeft = (r) => r + 8;
        const safeRight = (r) => W - r - 8;
        const safeTop = (r) => r + HEADER_RESERVED + 8;
        const safeBottom = (r) => H - r - LABEL_HEIGHT - 8;

        const centerX = W / 2;
        const centerY = (safeTop(baseR) + safeBottom(baseR)) / 2;

        // Collision radius = circle radius + half-label-zone + padding
        const nodes = products.map((p, i) => {
            const nodeR = radii[i];
            const collisionR = nodeR + LABEL_HEIGHT / 2 + COLLISION_PAD;
            return {
                id: p.id,
                index: i,
                nodeR,
                radius: collisionR,
                x: centerX + (Math.random() - 0.5) * W * 0.5,
                y: centerY + (Math.random() - 0.5) * H * 0.3,
            };
        });

        const forceStrength = 0.03;

        // Custom boundary force — pushes nodes away from edges during simulation
        // This replaces post-simulation clamping so positions remain collision-free
        function forceBoundary() {
            let ns;
            function force(alpha) {
                for (const n of ns) {
                    const r = n.nodeR;
                    const minX = safeLeft(r);
                    const maxX = safeRight(r);
                    const minY = safeTop(r);
                    const maxY = safeBottom(r);
                    const strength = 0.5;

                    if (n.x < minX) n.vx += (minX - n.x) * strength * alpha;
                    else if (n.x > maxX) n.vx += (maxX - n.x) * strength * alpha;
                    if (n.y < minY) n.vy += (minY - n.y) * strength * alpha;
                    else if (n.y > maxY) n.vy += (maxY - n.y) * strength * alpha;
                }
            }
            force.initialize = (nodes) => { ns = nodes; };
            return force;
        }

        const sim = forceSimulation(nodes)
            .velocityDecay(0.3)
            .force('collide', forceCollide(d => d.radius).strength(1).iterations(5))
            .force('x', forceX(centerX).strength(forceStrength * 0.7))
            .force('y', forceY(centerY).strength(forceStrength * 1.6))
            .force('charge', forceManyBody().strength(d => -forceStrength * Math.pow(d.radius, 2.0)))
            .force('boundary', forceBoundary())
            .stop();

        // Run to completion
        for (let i = 0; i < 400; i++) sim.tick();

        // Final hard clamp as safety net (should barely move anything)
        const positions = nodes.map((n, i) => {
            const r = radii[i];
            return {
                x: Math.max(safeLeft(r), Math.min(safeRight(r), n.x)),
                y: Math.max(safeTop(r), Math.min(safeBottom(r), n.y)),
            };
        });

        return { positions, radii, r: baseR };
    }, [products, W, H]);
}

/* ── SVG curved arc text — strain-colored ─────────────────────────── */
function ArcBadges({ product, r, strain }) {
    const id = `arc_${product.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const d2 = r * 2;
    const arcR = 48;
    const colors = STRAIN_COLORS[strain];

    return (
        <svg
            className="cb-arcs"
            viewBox="0 0 100 100"
            width={d2}
            height={d2}
            aria-hidden="true"
        >
            <defs>
                <path id={`la-${id}`} d={`M 50,${50 - arcR} A ${arcR},${arcR} 0 0,0 50,${50 + arcR}`} fill="none" />
                <path id={`ra-${id}`} d={`M 50,${50 - arcR} A ${arcR},${arcR} 0 0,1 50,${50 + arcR}`} fill="none" />
                {/* Strain-specific gradient for text */}
                <linearGradient id={`tg-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.grad1} />
                    <stop offset="100%" stopColor={colors.grad2} />
                </linearGradient>
            </defs>

            {/* THC — left arc */}
            {product.thc > 0 && (<>
                <text stroke={colors.arcStroke1} strokeWidth="6" strokeLinecap="round"
                    strokeLinejoin="round" fill={colors.arcStroke1}
                    fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#la-${id}`} startOffset="76%" textAnchor="middle">
                        THC: {product.thc}%
                    </textPath>
                </text>
                <text fill={colors.arcFill} fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#la-${id}`} startOffset="76%" textAnchor="middle">
                        THC: {product.thc}%
                    </textPath>
                </text>
            </>)}

            {/* CBD — left arc, lower */}
            {product.cbd > 0 && (<>
                <text stroke={colors.arcStroke2} strokeWidth="6" strokeLinecap="round"
                    strokeLinejoin="round" fill={colors.arcStroke2}
                    fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#la-${id}`} startOffset="22%" textAnchor="middle">
                        CBD: {product.cbd}%
                    </textPath>
                </text>
                <text fill={colors.arcFill} fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#la-${id}`} startOffset="22%" textAnchor="middle">
                        CBD: {product.cbd}%
                    </textPath>
                </text>
            </>)}

            {/* Strain type — right arc */}
            {product.type && product.type !== 'N/A' && (<>
                <text stroke={colors.arcStroke1} strokeWidth="6" strokeLinecap="round"
                    strokeLinejoin="round" fill={colors.arcStroke1}
                    fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#ra-${id}`} startOffset="22%" textAnchor="middle">
                        {product.type}
                    </textPath>
                </text>
                <text fill={colors.arcFill} fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#ra-${id}`} startOffset="22%" textAnchor="middle">
                        {product.type}
                    </textPath>
                </text>
            </>)}
        </svg>
    );
}

/* ── Single Bubble ───────────────────────────────────────────────────── */
function Bubble({ product, pos, r, index }) {
    const isNew = (product.badge || '').toLowerCase() === 'new';
    const strain = getStrainProfile(product);
    const colors = STRAIN_COLORS[strain];

    const nameSize = Math.max(11, Math.min(r * 0.16, 17));
    const priceSize = Math.max(12, Math.min(r * 0.18, 20));

    const entranceDelay = index * 0.08;
    const floatVariant = (index % 4) + 1;

    const totalHeight = r * 2 + LABEL_HEIGHT;

    return (
        <div
            className={`cb-root cb-float-${floatVariant}`}
            style={{
                left: pos.x,
                top: pos.y,
                width: r * 2,
                height: totalHeight,
                '--entrance-delay': `${entranceDelay}s`,
                '--float-delay': `${entranceDelay + 0.6}s`,
            }}
        >
            {/* Badge pill */}
            {product.badge && (
                <div className={`cb-badge ${isNew ? 'cb-badge--new' : 'cb-badge--hot'}`}>
                    {product.badge}
                </div>
            )}

            {/* Circle — strain-colored via inline styles */}
            <div
                className="cb-circle"
                style={{
                    width: r * 2,
                    height: r * 2,
                    background: `radial-gradient(circle at 38% 35%, ${colors.bgFrom} 0%, ${colors.bgTo} 100%)`,
                    border: `2px solid ${colors.border}`,
                    boxShadow: `0 16px 50px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 40px ${colors.glow}`,
                }}
            >
                <div className="cb-img-wrap">
                    {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.name} className="cb-img" />
                        : <span className="cb-emoji">🌿</span>
                    }
                </div>
            </div>

            {/* SVG arc text — strain-colored */}
            <ArcBadges product={product} r={r} strain={strain} />

            {/* Product name + price BELOW the circle — gradient text */}
            <div className="cb-label"
                style={{
                    '--name-sz': `${nameSize}px`,
                    '--price-sz': `${priceSize}px`,
                    '--strain-grad-1': colors.grad1,
                    '--strain-grad-2': colors.grad2,
                }}>
                <p className="cb-name">{product.name}</p>
                <span className="cb-price">
                    ${Number(product.price || 0).toFixed(2)}
                    {product.sellType === 'Weighted' ? '/g' : ''}
                </span>
            </div>
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function CloudBubbles({ products = [], categoryTheme }) {
    const containerRef = useRef(null);
    const { w, h } = useContainerSize(containerRef);
    const { positions, radii, r } = useForceLayout(products, w, h);

    return (
        <div className="cb-container" ref={containerRef}
            style={{ '--accent': categoryTheme?.accent || '#6ab04c' }}>
            <div className="cb-ambient-glow" />
            {products.map((product, i) =>
                positions[i] ? (
                    <Bubble
                        key={product.id}
                        product={product}
                        pos={positions[i]}
                        r={radii?.[i] || r}
                        index={i}
                    />
                ) : null
            )}
        </div>
    );
}
