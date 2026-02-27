/**
 * EdiblesLayout.jsx — "Neural Constellation"
 * 
 * Hexagonal cards connected by glowing SVG lines.
 * Force-like placement spreads cards across the screen.
 */

import ProductCard from '../components/ProductCard';

function gridPosition(index, total, W, H) {
    const cols = Math.ceil(Math.sqrt(total * (W / H)));
    const rows = Math.ceil(total / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cellW = W / cols;
    const cellH = H / rows;
    // Add slight jitter for organic feel
    const jitter = () => (Math.random() - 0.5) * cellW * 0.2;
    return {
        x: cellW * col + cellW / 2 + jitter(),
        y: cellH * row + cellH / 2 + jitter(),
    };
}

export default function EdiblesLayout({ products = [] }) {
    const W = window.innerWidth;
    const H = window.innerHeight * 0.84;
    const nodeSize = Math.min(W, H) / Math.max(Math.sqrt(products.length) * 1.4, 2.5);
    const clampedSize = Math.min(Math.max(nodeSize, 80), 190);

    const positions = products.map((_, i) => gridPosition(i, products.length, W, H));

    // Build connection lines (connect each node to nearest 2 neighbors)
    const lines = [];
    products.forEach((_, i) => {
        const p1 = positions[i];
        if (!p1) return;
        const sorted = products
            .map((_, j) => ({ j, dist: Math.hypot(positions[j]?.x - p1.x, positions[j]?.y - p1.y) }))
            .filter(({ j }) => j !== i)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);
        sorted.forEach(({ j }) => {
            if (j > i) {
                lines.push({ x1: p1.x, y1: p1.y, x2: positions[j].x, y2: positions[j].y });
            }
        });
    });

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* SVG constellation lines */}
            <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
            >
                <defs>
                    <filter id="glow-line">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {lines.map((l, i) => (
                    <line
                        key={i}
                        x1={l.x1} y1={l.y1}
                        x2={l.x2} y2={l.y2}
                        stroke="var(--category-accent)"
                        strokeWidth="1"
                        strokeOpacity="0.3"
                        filter="url(#glow-line)"
                    >
                        <animate
                            attributeName="stroke-opacity"
                            values="0.15;0.5;0.15"
                            dur={`${2 + (i % 4)}s`}
                            repeatCount="indefinite"
                        />
                    </line>
                ))}
            </svg>

            {/* Product hex cards */}
            {products.map((product, i) => {
                const pos = positions[i];
                if (!pos) return null;
                return (
                    <div
                        key={product.id}
                        style={{
                            position: 'absolute',
                            left: pos.x,
                            top: pos.y,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1,
                        }}
                    >
                        <ProductCard product={product} size={clampedSize} variant="hex" />
                    </div>
                );
            })}
        </div>
    );
}
