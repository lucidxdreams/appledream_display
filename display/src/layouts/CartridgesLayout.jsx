/**
 * CartridgesLayout.jsx — "Neural Constellation" (metallic variant)
 * 
 * Same constellation concept as Edibles, but with metallic/silver theme.
 */

import ProductCard from '../components/ProductCard';

function gridPosition(index, total, W, H) {
    const cols = Math.ceil(Math.sqrt(total * (W / H)));
    const rows = Math.ceil(total / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cellW = W / cols;
    const cellH = H / rows;
    return {
        x: cellW * col + cellW / 2,
        y: cellH * row + cellH / 2,
    };
}

export default function CartridgesLayout({ products = [] }) {
    const W = window.innerWidth;
    const H = window.innerHeight * 0.84;
    const hexSize = Math.min(
        Math.max(Math.floor(Math.min(W, H) / Math.max(Math.sqrt(products.length) * 1.5, 2.5)), 90),
        200
    );

    const positions = products.map((_, i) => gridPosition(i, products.length, W, H));

    const lines = [];
    products.forEach((_, i) => {
        const p1 = positions[i];
        if (!p1) return;
        products.forEach((_, j) => {
            if (j <= i) return;
            const p2 = positions[j];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (dist < hexSize * 2.5) {
                lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            }
        });
    });

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {lines.map((l, i) => (
                    <line
                        key={i}
                        x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                        stroke="var(--category-accent)"
                        strokeWidth="0.8"
                        strokeOpacity="0.25"
                    >
                        <animate
                            attributeName="stroke-opacity"
                            values="0.1;0.4;0.1"
                            dur={`${3 + (i % 3)}s`}
                            repeatCount="indefinite"
                        />
                    </line>
                ))}
            </svg>

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
                        <ProductCard product={product} size={hexSize} variant="hex" />
                    </div>
                );
            })}
        </div>
    );
}
