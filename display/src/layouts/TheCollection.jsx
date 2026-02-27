/**
 * TheCollection.jsx — "The Collection" (Cartridges)
 *
 * Cards fan out from a deck using GSAP stagger.
 * Metallic gradient background.
 * Extract type badge is large and prominent.
 *
 * Props: { products, categoryTheme }
 */

import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import ProductCard from '../components/ProductCard';
import './TheCollection.css';

/* ── Fan layout: positions cards in a spread-out arc ─────────────────── */
function fanLayout(count, W, H) {
    if (count === 0) return [];

    // Single product: centered hero
    if (count === 1) {
        const cardW = Math.min(Math.floor(W * 0.2), 200);
        const cardH = cardW * 1.45;
        return [{
            x: (W - cardW) / 2,
            y: (H - cardH) / 2,
            rotate: 0,
            cardW,
            cardH,
            z: 1,
        }];
    }

    const cardW = Math.min(Math.max(Math.floor(W * 0.13), 110), 200);
    const cardH = cardW * 1.45;

    if (count <= 8) {
        // Pure fan arc
        const arcAngle = Math.min((count - 1) * 12, 80);
        const startAngle = -arcAngle / 2;
        const cx = W / 2;
        const cy = H * 0.62;
        return Array.from({ length: count }, (_, i) => {
            const angle = startAngle + (arcAngle / (count - 1)) * i;
            const rad = angle * (Math.PI / 180);
            const arcR = W * 0.28;
            return {
                x: cx + Math.sin(rad) * arcR - cardW / 2,
                y: cy - Math.cos(rad) * arcR * 0.3 - cardH / 2,
                rotate: angle,
                cardW,
                cardH,
                z: i,
            };
        });
    } else {
        // Multi-row grid when many products — ensure fit
        const cols = Math.ceil(Math.sqrt(count * (W / H)));
        const rows = Math.ceil(count / cols);
        const adjustedCardW = Math.min(cardW, Math.floor((W * 0.92) / cols - 16));
        const adjustedCardH = Math.min(adjustedCardW * 1.45, Math.floor((H * 0.9) / rows - 16));
        const colGap = (W - cols * adjustedCardW) / (cols + 1);
        const rowGap = Math.max((H - rows * adjustedCardH) / (rows + 1), 12);
        return Array.from({ length: count }, (_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            return {
                x: colGap + col * (adjustedCardW + colGap),
                y: rowGap + row * (adjustedCardH + rowGap),
                rotate: 0,
                cardW: adjustedCardW,
                cardH: adjustedCardH,
                z: 1,
            };
        });
    }
}

/* ── Extract badge component ─────────────────────────────────────────── */
function ExtractBadge({ product, accent }) {
    const label =
        product.extractType ||
        product.strainType ||
        product.category ||
        'Cartridge';
    return (
        <div className="collection-extract-badge" style={{ '--accent': accent }}>
            {label}
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function TheCollection({ products = [], categoryTheme }) {
    const accent = categoryTheme?.accent || '#c0c0c0';
    const W = window.innerWidth;
    const H = Math.floor(window.innerHeight * 0.84);

    const containerRef = useRef(null);
    const tweenRef = useRef(null);

    // Memoize positions to prevent infinite re-render from new object references
    const positions = useMemo(() => fanLayout(products.length, W, H), [products.length, W, H]);

    // GSAP fan-out stagger on mount
    useEffect(() => {
        if (!containerRef.current || !products.length) return;
        const cards = containerRef.current.querySelectorAll('.collection-card');
        if (!cards.length) return;

        // Kill any prior animation before starting a new one
        if (tweenRef.current) {
            tweenRef.current.kill();
            tweenRef.current = null;
        }

        // All cards start stacked at center
        gsap.set(cards, {
            opacity: 0,
            scale: 0.5,
            x: W / 2,
            y: H * 0.6,
            rotation: 0,
        });

        tweenRef.current = gsap.to(cards, {
            opacity: 1,
            scale: 1,
            x: (i) => positions[i]?.x ?? 0,
            y: (i) => positions[i]?.y ?? 0,
            rotation: (i) => positions[i]?.rotate ?? 0,
            duration: 0.9,
            stagger: 0.08,
            ease: 'back.out(1.4)',
            delay: 0.3,
        });

        return () => {
            if (tweenRef.current) {
                tweenRef.current.kill();
                tweenRef.current = null;
            }
        };
    }, [products, positions, W, H]);

    return (
        <div
            className="collection-scene"
            style={{ width: W, height: H, '--accent': accent }}
        >
            {/* Metallic gradient background layer */}
            <div className="collection-metal-bg" style={{ '--accent': accent }} />

            {/* Floating metallic dust particles */}
            <div className="collection-dust-overlay" />

            {/* Deck title */}
            <div className="collection-title" style={{ '--accent': accent }}>
                The Collection
            </div>

            {/* Cards container */}
            <div ref={containerRef} className="collection-cards">
                {products.map((product, i) => {
                    const pos = positions[i];
                    if (!pos) return null;
                    return (
                        <div
                            key={product.id}
                            className="collection-card"
                            style={{
                                position: 'absolute',
                                width: pos.cardW,
                                zIndex: pos.z + 10,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            <ExtractBadge product={product} accent={accent} />
                            <ProductCard product={product} size={pos.cardW} variant="standard" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
