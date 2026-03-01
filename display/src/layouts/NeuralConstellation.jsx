/**
 * NeuralConstellation.jsx — "Neural Constellation" (Edibles)
 *
 * Hexagonal cards arranged in a deterministic honeycomb grid
 * connected by glowing SVG lines.
 * Candy shimmer particle background.
 * Cards materialize with staggered scale animation.
 *
 * Props: { products, categoryTheme }
 */

import { useEffect, useRef, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import './NeuralConstellation.css';

/* ── Hex size helper ─────────────────────────────────────────────────── */
function calcHexSize(count, W, H) {
    if (count <= 1) return Math.min(W, H) * 0.28;
    if (count <= 3) return Math.min(W, H) / 3.5;
    if (count <= 6) return Math.min(W, H) / 4.5;
    return Math.min(W, H) / Math.max(Math.sqrt(count) * 1.8, 3.0);
}

/* ── Deterministic honeycomb grid positions ───────────────────────────── */
function calcHoneycombPositions(count, W, H) {
    if (count === 0) return [];

    const hexSize = calcHexSize(count, W, H);
    const clampedSize = Math.min(Math.max(hexSize, 80), 160);
    const cx = W / 2;
    const cy = H / 2;

    if (count === 1) {
        return [{ x: cx, y: cy }];
    }

    // Calculate grid dimensions
    const spacingX = clampedSize * 1.5;
    const spacingY = clampedSize * 1.6;

    const positions = [];

    if (count <= 4) {
        // 2x2 centered grid
        const cols = 2;
        const rows = Math.ceil(count / cols);
        const totalW = (cols - 1) * spacingX;
        const totalH = (rows - 1) * spacingY;
        for (let i = 0; i < count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            positions.push({
                x: cx - totalW / 2 + col * spacingX,
                y: cy - totalH / 2 + row * spacingY,
            });
        }
    } else {
        // Honeycomb spiral: center + concentric hex rings
        positions.push({ x: cx, y: cy }); // center

        const ringDist = clampedSize * 2.2;
        let placed = 1;
        let ring = 1;

        while (placed < count) {
            const itemsInRing = ring * 6;
            const actualItems = Math.min(itemsInRing, count - placed);
            const r = ring * ringDist;
            // Clamp radius to fit within viewport
            const maxR = Math.min(cx - clampedSize, cy - clampedSize) * 0.85;
            const clampedR = Math.min(r, maxR);

            for (let i = 0; i < actualItems; i++) {
                const angle = (i / actualItems) * Math.PI * 2 - Math.PI / 6;
                const x = cx + Math.cos(angle) * clampedR;
                const y = cy + Math.sin(angle) * clampedR;
                positions.push({
                    x: Math.max(clampedSize, Math.min(W - clampedSize, x)),
                    y: Math.max(clampedSize, Math.min(H - clampedSize, y)),
                });
                placed++;
            }
            ring++;
        }
    }

    return positions;
}

/* ── Candy shimmer particle canvas (DPR-aware, capped at 40) ────────── */
const MAX_SHIMMER_PARTICLES = 40;

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

        const colors = [accent, '#e8a0b8', '#fff', '#c06c84', '#d4a0c0'];
        const particles = Array.from({ length: Math.min(30, MAX_SHIMMER_PARTICLES) }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 0.8,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: Math.random(),
            speed: Math.random() * 0.003 + 0.002,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -Math.random() * 0.4 - 0.15,
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
                const alpha = Math.sin(p.life * Math.PI) * 0.35;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 4;
                ctx.shadowColor = p.color;
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
    const accent = categoryTheme?.accent || '#c06c84';
    const W = window.innerWidth;
    const H = Math.floor(window.innerHeight * 0.84);

    const positions = useMemo(() => calcHoneycombPositions(products.length, W, H), [products.length, W, H]);

    const hexSize = calcHexSize(products.length, W, H);
    const clampedSize = Math.min(Math.max(hexSize, 80), 160);

    // Build connection lines between nearby nodes
    const lines = [];
    if (products.length >= 2) {
        products.forEach((_, i) => {
            const p1 = positions[i];
            if (!p1) return;
            const sorted = products
                .map((_, j) => ({ j, dist: Math.hypot((positions[j]?.x ?? 0) - p1.x, (positions[j]?.y ?? 0) - p1.y) }))
                .filter(({ j }) => j !== i)
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 2);
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
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {lines.map((l, i) => (
                    <line
                        key={l.key}
                        x1={l.x1} y1={l.y1}
                        x2={l.x2} y2={l.y2}
                        stroke={accent}
                        strokeWidth="1"
                        strokeOpacity="0.15"
                        filter="url(#neural-glow)"
                    >
                        <animate
                            attributeName="stroke-opacity"
                            values="0.08;0.3;0.08"
                            dur={`${2.5 + (i % 5) * 0.7}s`}
                            repeatCount="indefinite"
                        />
                    </line>
                ))}

                {lines.slice(0, 5).map((l, i) => (
                    <circle key={`dot-${l.key}`} r="2" fill={accent} opacity="0.5" filter="url(#neural-glow)">
                        <animateMotion
                            dur={`${3.5 + i * 0.5}s`}
                            repeatCount="indefinite"
                            path={`M${l.x1},${l.y1} L${l.x2},${l.y2}`}
                        />
                    </circle>
                ))}
            </svg>

            {/* Hex product cards */}
            {products.map((product, i) => {
                const pos = positions[i];
                if (!pos) return null;
                return (
                    <div
                        key={product.id}
                        className="neural-node neural-node--in"
                        style={{
                            position: 'absolute',
                            left: pos.x,
                            top: pos.y,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 2,
                            animationDelay: `${i * 0.1}s`,
                        }}
                    >
                        <ProductCard product={product} size={clampedSize} variant="hex" />
                    </div>
                );
            })}
        </div>
    );
}
