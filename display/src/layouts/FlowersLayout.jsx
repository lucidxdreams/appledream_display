/**
 * FlowersLayout.jsx — "The Bud Universe"
 * 
 * Circle orbs floating in dark space.
 * Sizes scale dynamically to fill the screen.
 */

import ProductCard from '../components/ProductCard';

function calcRadius(count, screenW, screenH) {
    const area = screenW * screenH;
    const base = Math.sqrt(area / (Math.max(count, 1) * Math.PI * 2.5));
    return Math.min(Math.max(base, 60), 240);
}

function spiralPosition(index, total, cx, cy, radius) {
    if (total === 1) return { x: cx, y: cy };
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const ring = Math.floor(index / 8) + 1;
    const r = Math.min(ring * radius * 1.2, Math.min(cx, cy) * 0.85);
    return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
    };
}

export default function FlowersLayout({ products = [] }) {
    const W = window.innerWidth;
    const H = window.innerHeight * 0.84;
    const radius = calcRadius(products.length, W, H);
    const cx = W / 2;
    const cy = H / 2;

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {products.map((product, i) => {
                const pos = spiralPosition(i, products.length, cx, cy, radius);
                const isFeatured = i === 0;
                const size = isFeatured ? radius * 2 * 1.5 : radius * 2 * (0.8 + Math.random() * 0.3);
                return (
                    <div
                        key={product.id}
                        style={{
                            position: 'absolute',
                            left: pos.x,
                            top: pos.y,
                            transform: 'translate(-50%, -50%)',
                            animationDelay: `${i * 0.15}s`,
                        }}
                    >
                        <ProductCard product={product} size={size} variant="circle" />
                    </div>
                );
            })}
        </div>
    );
}
