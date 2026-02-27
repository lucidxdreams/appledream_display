/**
 * NeuralConstellation.jsx — "Neural Constellation" (Edibles)
 *
 * Hexagonal cards connected by glowing SVG lines.
 * Force-directed spring simulation spreads nodes organically.
 * Candy shimmer particle background.
 * Cards materialize from center on mount.
 *
 * Props: { products, categoryTheme }
 */

import { useEffect, useRef, useState } from 'react';
import ProductCard from '../components/ProductCard';
import './NeuralConstellation.css';

/* ── Force-directed layout (simple D3-like spring sim) ─────────────────── */
function useForceLayout(products, W, H) {
    const [positions, setPositions] = useState([]);
    const nodesRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!products.length) {
            setPositions([]);
            return;
        }

        const count = products.length;
        const cx = W / 2;
        const cy = H / 2;

        // Seed positions in a small cluster at center
        const nodes = products.map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const seed = 30;
            return {
                x: cx + Math.cos(angle) * seed,
                y: cy + Math.sin(angle) * seed,
                vx: 0,
                vy: 0,
            };
        });
        nodesRef.current = nodes;

        const hexSize = calcHexSize(count, W, H);
        const clampedSize = Math.min(Math.max(hexSize, 80), 190);
        const repulsionDist = clampedSize * 2.4;

        let tick = 0;
        const maxTicks = 220;

        function simulate() {
            if (tick >= maxTicks) {
                setPositions(nodes.map((n) => ({ x: n.x, y: n.y })));
                nodesRef.current = null; // allow GC
                return;
            }
            tick++;

            const alpha = Math.max(0.02, 1 - tick / maxTicks);

            // Repulsion between all pairs
            for (let i = 0; i < count; i++) {
                for (let j = i + 1; j < count; j++) {
                    const dx = nodes[j].x - nodes[i].x;
                    const dy = nodes[j].y - nodes[i].y;
                    const dist = Math.max(Math.hypot(dx, dy), 1);
                    if (dist < repulsionDist) {
                        const force = (alpha * 800) / (dist * dist);
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        nodes[i].vx -= fx;
                        nodes[i].vy -= fy;
                        nodes[j].vx += fx;
                        nodes[j].vy += fy;
                    }
                }
            }

            // Spring attraction toward center (weak)
            nodes.forEach((n) => {
                n.vx += (cx - n.x) * 0.004 * alpha;
                n.vy += (cy - n.y) * 0.004 * alpha;
            });

            // Damping + position update
            const margin = clampedSize * 0.7;
            nodes.forEach((n) => {
                n.vx *= 0.78;
                n.vy *= 0.78;
                n.x = Math.max(margin, Math.min(W - margin, n.x + n.vx));
                n.y = Math.max(margin, Math.min(H - margin, n.y + n.vy));
            });

            // Update React state every 10 ticks for smooth animation
            if (tick % 10 === 0 || tick === maxTicks) {
                setPositions(nodes.map((n) => ({ x: n.x, y: n.y })));
            }

            rafRef.current = requestAnimationFrame(simulate);
        }

        rafRef.current = requestAnimationFrame(simulate);

        return () => {
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            nodesRef.current = null; // release for GC
        };
    }, [products, W, H]);

    return positions;
}

/* ── Hex size helper ─────────────────────────────────────────────────── */
function calcHexSize(count, W, H) {
    if (count <= 1) return Math.min(W, H) * 0.38; // single large hero
    if (count <= 3) return Math.min(W, H) / 2.8;
    return Math.min(W, H) / Math.max(Math.sqrt(count) * 1.4, 2.5);
}

/* ── Candy shimmer particle canvas (DPR-aware, capped at 80) ────────── */
const MAX_SHIMMER_PARTICLES = 80;

function CandyShimmer({ accent, W, H }) {
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

        const colors = [accent, '#ff8fd4', '#fff', '#e85c9e', '#ffb3d9'];
        const particles = Array.from({ length: Math.min(50, MAX_SHIMMER_PARTICLES) }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 3 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: Math.random(),
            speed: Math.random() * 0.004 + 0.002,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -Math.random() * 0.5 - 0.2,
        }));

        function draw() {
            ctx.clearRect(0, 0, W, H);
            for (let k = 0; k < particles.length; k++) {
                const p = particles[k];
                p.life += p.speed;
                if (p.life > 1) {
                    p.life = 0;
                    p.x = Math.random() * W;
                    p.y = H + 5;
                }
                p.x += p.vx;
                p.y += p.vy;
                const alpha = Math.sin(p.life * Math.PI) * 0.6;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
                // Diamond shape
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
                ctx.restore();
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
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, width: W, height: H }}
        />
    );
}

/* ── Main Component ───────────────────────────────────────────────────── */
export default function NeuralConstellation({ products = [], categoryTheme }) {
    const accent = categoryTheme?.accent || '#e85c9e';
    const W = window.innerWidth;
    const H = Math.floor(window.innerHeight * 0.84);

    const positions = useForceLayout(products, W, H);

    const hexSize = calcHexSize(products.length, W, H);
    const clampedSize = Math.min(Math.max(hexSize, 80), 190);

    // Build connection lines — graceful degradation for < 2 products
    const lines = [];
    if (products.length >= 2) {
        products.forEach((_, i) => {
            const p1 = positions[i];
            if (!p1) return;
            const sorted = products
                .map((_, j) => ({ j, dist: Math.hypot((positions[j]?.x ?? 0) - p1.x, (positions[j]?.y ?? 0) - p1.y) }))
                .filter(({ j }) => j !== i)
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 3);
            sorted.forEach(({ j }) => {
                if (j > i) lines.push({ x1: p1.x, y1: p1.y, x2: positions[j]?.x ?? 0, y2: positions[j]?.y ?? 0, key: `${i}-${j}` });
            });
        });
    }

    return (
        <div className="neural-scene" style={{ width: W, height: H, '--accent': accent }}>
            {/* Candy shimmer background */}
            <CandyShimmer accent={accent} W={W} H={H} />

            {/* SVG constellation lines */}
            <svg
                className="neural-svg"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
                viewBox={`0 0 ${W} ${H}`}
            >
                <defs>
                    <filter id="neural-glow">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={accent} stopOpacity="0" />
                        <stop offset="50%" stopColor={accent} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={accent} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {lines.map((l, i) => (
                    <line
                        key={l.key}
                        x1={l.x1} y1={l.y1}
                        x2={l.x2} y2={l.y2}
                        stroke={accent}
                        strokeWidth="1.2"
                        strokeOpacity="0.3"
                        filter="url(#neural-glow)"
                    >
                        <animate
                            attributeName="stroke-opacity"
                            values="0.1;0.55;0.1"
                            dur={`${2 + (i % 5) * 0.7}s`}
                            repeatCount="indefinite"
                        />
                    </line>
                ))}

                {/* Flowing light dots along lines */}
                {lines.slice(0, 8).map((l, i) => (
                    <circle key={`dot-${l.key}`} r="3" fill={accent} opacity="0.8" filter="url(#neural-glow)">
                        <animateMotion
                            dur={`${3 + i * 0.5}s`}
                            repeatCount="indefinite"
                            path={`M${l.x1},${l.y1} L${l.x2},${l.y2}`}
                        />
                    </circle>
                ))}
            </svg>

            {/* Hex product cards — materialize with scale animation */}
            {products.map((product, i) => {
                const pos = positions[i];
                const isVisible = !!pos;
                return (
                    <div
                        key={product.id}
                        className={`neural-node ${isVisible ? 'neural-node--in' : ''}`}
                        style={{
                            position: 'absolute',
                            left: pos?.x ?? W / 2,
                            top: pos?.y ?? H / 2,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 2,
                            transitionDelay: `${i * 0.06}s`,
                        }}
                    >
                        <ProductCard product={product} size={clampedSize} variant="hex" />
                    </div>
                );
            })}
        </div>
    );
}
