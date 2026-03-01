/**
 * BudUniverse.jsx — "The Bud Universe" (Exotic Flowers)
 *
 * Deterministic radial layout with gentle floating animation.
 * Central hero product with satellite products arranged in rings.
 * Trichome sparkle overlay.
 *
 * Props: { products, categoryTheme }
 */

import { useEffect, useRef, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import './BudUniverse.css';

/* ── Radius formula ───────────────────────────────────────────────────── */
function calcRadius(count, W, H) {
    if (count <= 1) return Math.min(W, H) * 0.22;
    if (count <= 3) return Math.min(W, H) * 0.14;
    if (count <= 6) return Math.min(W, H) * 0.11;
    if (count <= 10) return Math.min(W, H) * 0.09;
    if (count <= 15) return Math.min(W, H) * 0.07;
    // Smart scaling to fit 15+ continuously shrinking
    return Math.max(Math.min(W, H) / (count * 0.8), 30);
}

/* ── Deterministic positions in concentric rings ──────────────────────── */
function calcPositions(products, W, H) {
    const count = products.length;
    if (count === 0) return [];

    const cx = W / 2;
    const cy = H / 2;
    const baseR = calcRadius(count, W, H);

    if (count === 1) {
        return [{ x: cx, y: cy, r: baseR * 1.5 }];
    }

    const positions = [];

    // Hero product at center — slightly larger
    positions.push({ x: cx, y: cy, r: baseR * 1.3 });

    // Remaining products in concentric rings
    const remaining = count - 1;
    const ringCapacity = [6, 12, 18, 24]; // Smartly increased max items per ring
    let placed = 0;
    let ring = 0;

    while (placed < remaining) {
        const capacity = ring < ringCapacity.length ? ringCapacity[ring] : 30;
        const itemsInRing = Math.min(capacity, remaining - placed);
        const ringRadius = (ring + 1) * (baseR * 2.5); // Tighter rings to fit screen
        // Clamp ring radius to keep within bounds securely
        const maxRingR = Math.min(cx - baseR - 10, cy - baseR - 10);
        const clampedRingR = Math.min(ringRadius, maxRingR);

        for (let i = 0; i < itemsInRing; i++) {
            const angle = (i / itemsInRing) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * clampedRingR;
            const y = cy + Math.sin(angle) * clampedRingR;
            positions.push({
                x: Math.max(baseR + 5, Math.min(W - baseR - 5, x)),
                y: Math.max(baseR + 5, Math.min(H - baseR - 5, y)),
                r: baseR,
            });
            placed++;
        }
        ring++;
    }

    return positions;
}

/* ── Sparkle particle system (DPR-aware, capped at 40) ────────────────── */
const MAX_SPARKLE_PARTICLES = 40;

function TrichomeSparkles({ accent = '#6ab04c', W, H }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const particles = Array.from({ length: Math.min(35, MAX_SPARKLE_PARTICLES) }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.5 + 0.3,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -Math.random() * 0.4 - 0.1,
            alpha: Math.random(),
            life: Math.random(),
            speed: Math.random() * 0.004 + 0.002,
        }));

        function draw() {
            ctx.clearRect(0, 0, W, H);
            for (let k = 0; k < particles.length; k++) {
                const p = particles[k];
                p.life += p.speed;
                if (p.life > 1) {
                    p.life = 0;
                    p.x = Math.random() * W;
                    p.y = H + 10;
                    p.alpha = 0;
                }
                p.x += p.vx;
                p.y += p.vy;
                p.alpha = Math.sin(p.life * Math.PI);

                ctx.save();
                ctx.globalAlpha = p.alpha * 0.5;
                ctx.fillStyle = accent;
                ctx.shadowBlur = 4;
                ctx.shadowColor = accent;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            rafRef.current = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [accent, W, H]);

    return (
        <canvas
            ref={canvasRef}
            className="bud-sparkles"
            style={{ width: W, height: H }}
        />
    );
}

/* ── Main Component ───────────────────────────────────────────────────── */
export default function BudUniverse({ products = [], categoryTheme }) {
    const accent = categoryTheme?.accent || '#6ab04c';
    const W = window.innerWidth;
    const H = Math.floor(window.innerHeight * 0.84);

    const positions = useMemo(() => calcPositions(products, W, H), [products, W, H]);

    return (
        <div className="bud-universe" style={{ width: W, height: H }}>
            {/* Trichome sparkle particle field */}
            <TrichomeSparkles accent={accent} W={W} H={H} />

            {/* Ambient glow core */}
            <div
                className="bud-core-glow"
                style={{ '--accent': accent }}
            />

            {/* Product orbs in concentric rings */}
            {products.map((product, i) => {
                const pos = positions[i];
                if (!pos) return null;
                const diameter = pos.r * 2;
                return (
                    <div
                        key={product.id}
                        className="bud-orb"
                        style={{
                            left: pos.x,
                            top: pos.y,
                            width: diameter,
                            height: diameter,
                            '--accent': accent,
                            '--delay': `${i * 0.15}s`,
                            '--float-offset': `${(i % 3) * 2}px`,
                        }}
                    >
                        <ProductCard product={product} size={diameter} variant="circle" />
                    </div>
                );
            })}
        </div>
    );
}
