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
        const cardW = Math.min(Math.floor(W * 0.2), 180);
        const cardH = Math.min(cardW * 2.8, H * 0.75);
        return {
            cards: [{ x: (W - cardW) / 2, y: (H - cardH) / 2, col: 0, row: 0 }],
            cardW,
            cardH,
        };
    }

    const cols = Math.ceil(Math.sqrt(count * 0.6));
    const rows = Math.ceil(count / cols);

    // Calculate card width, then derive height; clamp height to fit screen
    let cardW = Math.min(Math.max(Math.floor((W * 0.88) / cols) - 24, 70), 160);
    let cardH = cardW * 2.8;

    // Ensure cards + gaps fit vertically (account for diagonal stagger)
    const staggerOffset = cardH * 0.2;
    const maxCardH = (H - (rows + 1) * 16 - staggerOffset) / rows;
    if (cardH > maxCardH) {
        cardH = Math.max(maxCardH, 100);
        cardW = Math.min(cardW, Math.floor(cardH / 2.8));
    }

    const colGap = (W - cols * cardW) / (cols + 1);
    const rowGap = Math.max((H - rows * cardH - staggerOffset) / (rows + 1), 12);

    return {
        cards: Array.from({ length: count }, (_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const diagonalShift = (col % 2 === 0 ? 0 : cardH * 0.2);
            return {
                x: colGap + col * (cardW + colGap),
                y: rowGap + row * (cardH + rowGap) + diagonalShift,
                col,
                row,
            };
        }),
        cardW,
        cardH,
    };
}

export default function NeonTechGrid({ products = [], categoryTheme }) {
    const accent = categoryTheme?.accent || '#5e81f4';
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
