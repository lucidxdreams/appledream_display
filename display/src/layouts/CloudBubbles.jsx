/**
 * CloudBubbles.jsx — Exotic Flowers Display (D3 Force-Directed Bubble Cloud)
 *
 * Architecture (based on vallandingham.me/building_a_bubble_cloud.html):
 *   1. d3.forceSimulation with forceCollide guarantees zero overlap
 *   2. Asymmetric forceX / forceY — weak X (spread wide), stronger Y (center vertically)
 *   3. forceManyBody — organic repulsion proportional to radius²
 *   4. Simulation runs to completion synchronously — instant stable positions
 *   5. Each bubble: circle with product image, SVG arc badges, name+price below
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

/* ── Container size measurement ─────────────────────────────────────── */
function useContainerSize(ref) {
    const [size, setSize] = useState({ w: 1280, h: 720 });
    useEffect(() => {
        if (!ref.current) return;
        const measure = () => setSize({
            w: ref.current.clientWidth || 1280,
            h: ref.current.clientHeight || 720,
        });
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(ref.current);
        return () => ro.disconnect();
    }, [ref]);
    return size;
}

/* ── Bubble radius — scaled to product count + available space ────── */
function calcRadius(count, W, H) {
    if (count === 0) return 80;
    // Each bubble needs space for circle + label below
    // Solve: count * PI * r² ≈ area * coverage
    const area = W * H;
    const coverage = count <= 3 ? 0.18 : count <= 6 ? 0.22 : count <= 12 ? 0.26 : 0.30;
    const perArea = (area * coverage) / count;
    const r = Math.sqrt(perArea / Math.PI);
    // Clamp between reasonable bounds
    return Math.max(45, Math.min(r, 130));
}

/* ── D3 Force Simulation Layout Hook ─────────────────────────────── */
const LABEL_HEIGHT = 50;   // Space reserved for name + price below circle
const COLLISION_PAD = 10;  // Extra padding between bubbles

function useForceLayout(products, W, H) {
    return useMemo(() => {
        const count = products.length;
        if (!count || !W || !H) return { positions: [], r: 80 };

        const r = calcRadius(count, W, H);
        const centerX = W / 2;
        const centerY = H / 2;

        // Collision radius includes circle radius + half the label area + padding
        const collisionR = r + LABEL_HEIGHT / 2 + COLLISION_PAD;

        // Strength constants
        const forceStrength = 0.03;

        // Create nodes from products
        const nodes = products.map((p, i) => ({
            id: p.id,
            index: i,
            // Start positions: scatter in a wide rectangular region to help simulation
            x: centerX + (Math.random() - 0.5) * W * 0.6,
            y: centerY + (Math.random() - 0.5) * H * 0.4,
        }));

        // Build simulation with forces from the bubble cloud architecture:
        //   - forceCollide: HARD collision — quadtree-optimized, guarantees no overlap
        //   - forceX: weak pull towards center X — allows horizontal spread
        //   - forceY: stronger pull towards center Y — keeps vertically centered
        //   - forceManyBody: negative charge — organic repulsion
        const sim = forceSimulation(nodes)
            .velocityDecay(0.25)
            .force('collide', forceCollide(collisionR).strength(1).iterations(4))
            .force('x', forceX(centerX).strength(forceStrength * 0.8))
            .force('y', forceY(centerY).strength(forceStrength * 2.0))
            .force('charge', forceManyBody().strength(d => -forceStrength * Math.pow(collisionR, 2.0)))
            .stop();

        // Run simulation to completion synchronously — instant stable layout
        const numTicks = 300;
        for (let i = 0; i < numTicks; i++) {
            sim.tick();
        }

        // Clamp final positions to keep bubbles within the visible area
        const padX = r + 10;
        const padTop = r + 10;
        const padBottom = r + LABEL_HEIGHT + 10;

        const positions = nodes.map(n => ({
            x: Math.max(padX, Math.min(W - padX, n.x)),
            y: Math.max(padTop, Math.min(H - padBottom, n.y)),
        }));

        return { positions, r };
    }, [products, W, H]);
}

/* ── SVG curved arc text for THC / CBD / Strain ─────────────────────
 *  Rendered as a SIBLING to the circle — never clipped by overflow:hidden */
function ArcBadges({ product, r }) {
    const id = `arc_${product.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const d2 = r * 2;
    const arcR = 48;

    return (
        <svg
            className="cb-arcs"
            viewBox="0 0 100 100"
            width={d2}
            height={d2}
            aria-hidden="true"
        >
            <defs>
                <path id={`la-${id}`} d={`M 50,${50 + arcR} A ${arcR},${arcR} 0 0,1 50,${50 - arcR}`} fill="none" />
                <path id={`ra-${id}`} d={`M 50,${50 - arcR} A ${arcR},${arcR} 0 0,1 50,${50 + arcR}`} fill="none" />
            </defs>

            {/* THC — left arc */}
            {product.thc > 0 && (<>
                <text stroke="#FF7043" strokeWidth="6" strokeLinecap="round"
                    strokeLinejoin="round" fill="#FF7043"
                    fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#la-${id}`} startOffset="24%" textAnchor="middle">
                        THC: {product.thc}%
                    </textPath>
                </text>
                <text fill="#ffffff" fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#la-${id}`} startOffset="24%" textAnchor="middle">
                        THC: {product.thc}%
                    </textPath>
                </text>
            </>)}

            {/* CBD — left arc, lower */}
            {product.cbd > 0 && (<>
                <text stroke="#FFC107" strokeWidth="6" strokeLinecap="round"
                    strokeLinejoin="round" fill="#FFC107"
                    fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#la-${id}`} startOffset="78%" textAnchor="middle">
                        CBD: {product.cbd}%
                    </textPath>
                </text>
                <text fill="#ffffff" fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#la-${id}`} startOffset="78%" textAnchor="middle">
                        CBD: {product.cbd}%
                    </textPath>
                </text>
            </>)}

            {/* Strain type — right arc */}
            {product.type && product.type !== 'N/A' && (<>
                <text stroke="#FF9800" strokeWidth="6" strokeLinecap="round"
                    strokeLinejoin="round" fill="#FF9800"
                    fontSize="5.5" fontWeight="900"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <textPath href={`#ra-${id}`} startOffset="22%" textAnchor="middle">
                        {product.type}
                    </textPath>
                </text>
                <text fill="#ffffff" fontSize="5.5" fontWeight="900"
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
    const isFeatured = !!product.featured;
    const isLimited = (product.badge || '').toLowerCase() === 'limited';
    const isNew = (product.badge || '').toLowerCase() === 'new';

    const nameSize = Math.max(11, Math.min(r * 0.16, 18));
    const priceSize = Math.max(12, Math.min(r * 0.18, 20));

    const entranceDelay = index * 0.08;
    const floatVariant = (index % 4) + 1;

    // Total height = circle (2r) + label area
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
            {/* Badge at top edge (12 o'clock) */}
            {product.badge && (
                <div className={`cb-badge ${isNew ? 'cb-badge--new' : 'cb-badge--hot'}`}>
                    {product.badge}
                </div>
            )}

            {/* Circle — overflow:hidden clips only the image */}
            <div
                className={`cb-circle ${isLimited ? 'cb-circle--gold' : ''}`}
                style={{ width: r * 2, height: r * 2 }}
            >
                <div className="cb-img-wrap">
                    {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.name} className="cb-img" />
                        : <span className="cb-emoji">🌿</span>
                    }
                </div>
            </div>

            {/* SVG arc text — SIBLING to the circle, never clipped */}
            <ArcBadges product={product} r={r} />

            {/* Product name + price BELOW the circle */}
            <div className="cb-label"
                style={{ '--name-sz': `${nameSize}px`, '--price-sz': `${priceSize}px` }}>
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
    const { positions, r } = useForceLayout(products, w, h);

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
                        r={r}
                        index={i}
                    />
                ) : null
            )}
        </div>
    );
}
