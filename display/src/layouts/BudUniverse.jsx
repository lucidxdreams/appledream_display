/**
 * BudUniverse.jsx — "The Bud Universe" (Exotic Flowers)
 *
 * Matter.js physics engine runs in a Web Worker to offload the main thread.
 * Central attractor force keeps orbs on-screen. Trichome sparkle overlay.
 *
 * Props: { products, categoryTheme }
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import './BudUniverse.css';

/* ── Radius formula ───────────────────────────────────────────────────── */
function calcRadii(products, W, H) {
    const count = Math.max(products.length, 1);
    const screenArea = W * H;

    if (count === 1) {
        // Single hero fills ~35% of the shorter dimension
        return [Math.min(W, H) * 0.35];
    }

    const baseRadius = Math.sqrt(screenArea / (count * Math.PI * 2));
    // Tighter clamp for large counts so they fit
    const maxR = count >= 12 ? 130 : 200;
    const clamped = Math.min(Math.max(baseRadius, 50), maxR);

    return products.map((_, i) => {
        if (i === 0) return clamped * 1.6; // featured
        return clamped * (0.7 + Math.sin(i * 2.4) * 0.2 + 0.25);
    });
}

/* ── Sparkle particle system (DPR-aware, capped at 80) ────────────────── */
const MAX_SPARKLE_PARTICLES = 80;

function TrichomeSparkles({ accent = '#7CB518', W, H }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for perf
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const particles = Array.from({ length: Math.min(60, MAX_SPARKLE_PARTICLES) }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -Math.random() * 0.6 - 0.1,
            alpha: Math.random(),
            life: Math.random(),
            speed: Math.random() * 0.005 + 0.002,
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
                ctx.globalAlpha = p.alpha * 0.7;
                ctx.fillStyle = accent;
                ctx.shadowBlur = 6;
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
    const accent = categoryTheme?.accent || '#7CB518';
    const W = window.innerWidth;
    const H = Math.floor(window.innerHeight * 0.84);

    // Body positions synced from Matter.js Worker
    const [bodies, setBodies] = useState([]);
    const workerRef = useRef(null);

    const radii = useMemo(() => calcRadii(products, W, H), [products, W, H]);

    // Spawn & manage Web Worker
    useEffect(() => {
        if (!products.length) {
            setBodies([]);
            return;
        }

        const worker = new Worker(
            new URL('../workers/matterWorker.js', import.meta.url),
            { type: 'module' }
        );
        workerRef.current = worker;

        // Listen for position updates
        worker.onmessage = (e) => {
            if (e.data.type === 'positions') {
                setBodies(e.data.bodies);
            }
        };

        // Send init data to worker
        worker.postMessage({
            type: 'init',
            products: products.map((p) => ({ id: p.id })),
            W,
            H,
            radii,
        });

        return () => {
            worker.postMessage({ type: 'destroy' });
            // Give the worker a moment to clean up, then hard-terminate
            setTimeout(() => {
                try { worker.terminate(); } catch (_) { /* already closed */ }
            }, 100);
            workerRef.current = null;
        };
    }, [products, W, H, radii]);

    return (
        <div className="bud-universe" style={{ width: W, height: H }}>
            {/* Trichome sparkle particle field */}
            <TrichomeSparkles accent={accent} W={W} H={H} />

            {/* Ambient glow core */}
            <div
                className="bud-core-glow"
                style={{ '--accent': accent }}
            />

            {/* Physics-driven product orbs */}
            {bodies.map((b, i) => {
                const product = products[i];
                if (!product) return null;
                const diameter = b.r * 2;
                return (
                    <div
                        key={product.id}
                        className="bud-orb"
                        style={{
                            left: b.x,
                            top: b.y,
                            width: diameter,
                            height: diameter,
                            '--accent': accent,
                            '--delay': `${i * 0.2}s`,
                        }}
                    >
                        <ProductCard product={product} size={diameter} variant="circle" />
                    </div>
                );
            })}

            {/* Fallback static layout while Worker boots */}
            {bodies.length === 0 && products.map((product, i) => {
                const r = radii[i];
                const angle = (i / products.length) * Math.PI * 2;
                const ring = Math.floor(i / 6) + 1;
                const dist = i === 0 ? 0 : Math.min(ring * r * 1.5, Math.min(W / 2, H / 2) * 0.75);
                const x = W / 2 + Math.cos(angle) * dist;
                const y = H / 2 + Math.sin(angle) * dist;
                return (
                    <div
                        key={product.id}
                        className="bud-orb"
                        style={{
                            left: x,
                            top: y,
                            width: r * 2,
                            height: r * 2,
                            '--accent': accent,
                            '--delay': `${i * 0.2}s`,
                        }}
                    >
                        <ProductCard product={product} size={r * 2} variant="circle" />
                    </div>
                );
            })}
        </div>
    );
}
