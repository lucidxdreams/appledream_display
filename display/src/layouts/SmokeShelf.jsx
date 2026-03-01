/**
 * SmokeShelf.jsx — "The Smoke Shelf" (Pre-rolls)
 *
 * CSS perspective 3D two floating shelf planes.
 * Products at slight diagonal angle.
 * CSS smoke particle animations drifting upward.
 * GSAP slow horizontal camera pan with yoyo.
 *
 * Props: { products, categoryTheme }
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import ProductCard from '../components/ProductCard';
import './SmokeShelf.css';

/* ── Smoke wisp sub-component ────────────────────────────────────────── */
function SmokeWisp({ index, accent }) {
    return (
        <div
            className="smoke-wisp"
            style={{
                '--delay': `${index * 0.7}s`,
                '--x-drift': `${(Math.random() - 0.5) * 25}px`,
                '--accent': accent,
                left: `${15 + (index % 5) * 18}%`,
            }}
        />
    );
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function SmokeShelf({ products = [], categoryTheme }) {
    const accent = categoryTheme?.accent || '#b8943e';
    const W = window.innerWidth;
    const H = Math.floor(window.innerHeight * 0.84);

    const wrapperRef = useRef(null);
    const panTweenRef = useRef(null);

    // Split products across 2 shelves
    const half = Math.ceil(products.length / 2);
    const shelf1 = products.slice(0, half);
    const shelf2 = products.slice(half);

    // SMARTSCALING: Ensure maxPerShelf forces a card width that fits ALL items into ONE viewport width.
    const maxPerShelf = Math.max(half, 1);
    const count = products.length;
    let cardW;

    // Fit to width without scrolling
    const availableWidth = W * 0.95; // 95% of screen
    const maxAllowedCardW = Math.max(availableWidth / maxPerShelf - 20, 50); // 20px gap

    if (count === 1) {
        cardW = Math.min(Math.floor(W * 0.22), 200);
    } else if (count <= 3) {
        cardW = Math.min(maxAllowedCardW, 170);
    } else {
        cardW = Math.min(maxAllowedCardW, 170);
    }

    // Total shelf content width is forced to be W or less
    const shelfContentW = maxPerShelf * (cardW + 20);
    const contentW = W;
    const needsPan = false; // We forced it to fit, so no panning needed

    // GSAP horizontal camera pan — disabled because we are smartly scaling to 1 page
    useEffect(() => {
        if (!wrapperRef.current) return;

        // Kill any prior tween before starting new one
        if (panTweenRef.current) {
            panTweenRef.current.kill();
            panTweenRef.current = null;
        }

        // Just center it
        gsap.set(wrapperRef.current, {
            x: 0,
        });

    }, [products, W, contentW]);

    return (
        <div
            className="smoke-scene"
            style={{ width: W, height: H, '--accent': accent }}
        >
            {/* Warm amber radial light */}
            <div className="smoke-ambient" style={{ '--accent': accent }} />

            {/* CSS 3D perspective wrapper that pans */}
            <div className="smoke-perspective-root">
                <div ref={wrapperRef} className="smoke-shelf-wrapper" style={{ width: contentW }}>

                    {/* Shelf 1 — closer plane (lower on screen) */}
                    <div className="smoke-shelf smoke-shelf--near" style={{ '--accent': accent }}>
                        <div className="smoke-shelf__plank" />
                        <div className={`smoke-shelf__products ${!needsPan ? 'smoke-shelf__products--centered' : ''}`}>
                            {shelf1.map((product, i) => (
                                <div
                                    key={product.id}
                                    className="smoke-slot"
                                    style={{ '--slot-i': i, '--accent': accent }}
                                >
                                    <ProductCard product={product} size={cardW} variant="vertical" />
                                    <SmokeWisp index={i} accent={accent} />
                                    <SmokeWisp index={i + 1} accent={accent} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shelf 2 — farther plane (higher on screen, smaller via perspective) */}
                    <div className="smoke-shelf smoke-shelf--far" style={{ '--accent': accent }}>
                        <div className="smoke-shelf__plank" />
                        <div className={`smoke-shelf__products ${!needsPan ? 'smoke-shelf__products--centered' : ''}`}>
                            {shelf2.map((product, i) => (
                                <div
                                    key={product.id}
                                    className="smoke-slot"
                                    style={{ '--slot-i': i, '--accent': accent }}
                                >
                                    <ProductCard product={product} size={Math.floor(cardW * 0.82)} variant="vertical" />
                                    <SmokeWisp index={i + 2} accent={accent} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Global smoke atmosphere (canvas-free rising wisps) */}
            <div className="smoke-atmosphere">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="smoke-atm-wisp" style={{ '--i': i, '--accent': accent }} />
                ))}
            </div>
        </div>
    );
}
