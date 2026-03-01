/**
 * NeonTechGrid.jsx — "Neon Tech Grid" (Disposables / Vapes)
 *
 * Vertical elongated cards echoing vape pen shape.
 * Staggered diagonal arrangement. Neon border glow.
 * CSS 3D Y-axis rotation animation cycle.
 *
 * Props: { products, categoryTheme }
 */

import ProductCard from '../components/ProductCard';
import './NeonTechGrid.css';

/* ── Layout algorithm ── staggered diagonal rows ─────────────────────── */
function buildGrid(count, W, H) {
    if (count === 0) return { cards: [], cardW: 120, cardH: 336 };

    // Single product: centered hero
    if (count === 1) {
        const cardW = Math.min(Math.floor(W * 0.18), 160);
        const cardH = Math.min(cardW * 2.5, H * 0.7);
        return {
            cards: [{ x: (W - cardW) / 2, y: (H - cardH) / 2, col: 0, row: 0 }],
            cardW,
            cardH,
        };
    }

    // Smart Scaling logic: aggressively scale down for 15+ to ensure they don't break viewport height.
    const cols = Math.ceil(Math.sqrt(count * 1.5)); // wider grid for many items
    const rows = Math.ceil(count / cols);

    // Calculate maximum card height to guarantee no vertical overflow
    const maxAllowedCardH = Math.floor(H / rows) - 20;

    let cardW = Math.min(Math.max(Math.floor((W * 0.95) / cols) - 10, 45), 140);
    let cardH = cardW * 2.5;

    // Enforce fitting
    if (cardH > maxAllowedCardH) {
        cardH = Math.max(maxAllowedCardH, 70);
        cardW = Math.min(cardW, Math.floor(cardH / 2.5));
    }

    const totalCardsW = cols * cardW;
    const colGap = Math.max((W - totalCardsW) / (cols + 1), 10);
    const staggerOffset = cardH * 0.10; // reduced stagger for tighter packing
    const totalCardsH = rows * cardH + staggerOffset;
    const rowGap = Math.max((H - totalCardsH) / (rows + 1), 10);

    return {
        cards: Array.from({ length: count }, (_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const diagonalShift = (col % 2 === 0 ? 0 : staggerOffset);
            const x = Math.max(colGap, colGap + col * (cardW + colGap));
            const y = Math.max(rowGap, rowGap + row * (cardH + rowGap) + diagonalShift);
            return {
                x: Math.min(x, W - cardW - 5),
                y: Math.min(y, H - cardH - 5),
                col,
                row,
            };
        }),
        cardW,
        cardH,
    };
}

export default function NeonTechGrid({ products = [], categoryTheme }) {
    const accent = categoryTheme?.accent || '#7c8cf8';
    const W = window.innerWidth;
    const H = Math.floor(window.innerHeight * 0.84);

    const { cards, cardW } = buildGrid(products.length || 1, W, H);

    return (
        <div
            className="neon-grid-scene"
            style={{ width: W, height: H, '--accent': accent }}
        >
            {/* Electric arc scanline overlay */}
            <div className="neon-scanlines" />

            {/* Corner neon decorations */}
            <div className="neon-corner neon-corner--tl" style={{ '--accent': accent }} />
            <div className="neon-corner neon-corner--br" style={{ '--accent': accent }} />

            {/* Product cards in diagonal grid */}
            {products.map((product, i) => {
                const pos = cards[i] || cards[0];
                if (!pos) return null;
                return (
                    <div
                        key={product.id}
                        className="neon-card-wrapper"
                        style={{
                            left: pos.x,
                            top: pos.y,
                            width: cardW,
                            '--accent': accent,
                            '--delay': `${i * 0.15}s`,
                            '--spin-delay': `${i * 0.8}s`,
                        }}
                    >
                        {/* Neon glow border frame */}
                        <div className="neon-border-glow" />
                        <div className="neon-rotate-stage">
                            <ProductCard product={product} size={cardW} variant="vertical" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
