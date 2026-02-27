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
                '--x-drift': `${(Math.random() - 0.5) * 30}px`,
                '--accent': accent,
                left: `${15 + (index % 5) * 18}%`,
            }}
        />
    );
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function SmokeShelf({ products = [], categoryTheme }) {
    const accent = categoryTheme?.accent || '#c8a951';
    const W = window.innerWidth;
    const H = Math.floor(window.innerHeight * 0.84);

    const wrapperRef = useRef(null);
    const panTweenRef = useRef(null);

    // Split products across 2 shelves
    const half = Math.ceil(products.length / 2);
    const shelf1 = products.slice(0, half);
    const shelf2 = products.slice(half);

    // Card size: fit to wider shelf, clamped for extremes
    const maxPerShelf = Math.max(half, 1);
    const count = products.length;
    let cardW;
    if (count === 1) {
        // Single hero: larger card
        cardW = Math.min(Math.floor(W * 0.25), 220);
    } else if (count <= 3) {
        cardW = Math.min(Math.floor((W * 1.2) / maxPerShelf) - 20, 190);
    } else {
        // Scale down for many products so they fit
        cardW = Math.min(
            Math.max(Math.floor((W * 1.6) / maxPerShelf) - 20, 80),
            190
        );
    }

    // Total shelf content width (wider than viewport to enable pan)
    const contentW = Math.max(W * 1.2, maxPerShelf * (cardW + 24));

    // GSAP horizontal camera pan — yoyo (stored in ref, killed on unmount)
    useEffect(() => {
        if (!wrapperRef.current || !products.length) return;

        const panDist = contentW - W;
        if (panDist <= 0) return;

        // Kill any prior tween before starting new one
        if (panTweenRef.current) {
            panTweenRef.current.kill();
            panTweenRef.current = null;
        }

        panTweenRef.current = gsap.to(wrapperRef.current, {
            x: -panDist,
            duration: 22,
            ease: 'none',
            repeat: -1,
            yoyo: true,
        });

        return () => {
            if (panTweenRef.current) {
                panTweenRef.current.kill();
                panTweenRef.current = null;
            }
        };
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
                        <div className="smoke-shelf__products">
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
                        <div className="smoke-shelf__products">
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
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="smoke-atm-wisp" style={{ '--i': i, '--accent': accent }} />
                ))}
            </div>
        </div>
    );
}
