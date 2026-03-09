/**
 * CartridgesLayout.jsx
 *
 * Rewritten to precisely mirror the successful vertical design of VapesLayout ("Neon Prism" style),
 * applying large images and robust grids, but retaining extra cartridge details (Extract Type, CBG, CBN, Effects).
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import './CartridgesLayout.css';

/* ── Math & Grid Logic (Identical to VapesLayout) ── */
function calculateGrid(count, W, H) {
    if (count === 0) return { cardW: 240, cardH: 340, cols: 0, rows: 0 };

    const paddingX = 40;
    const paddingY = 20;
    const gap = 20;

    const availW = W - (paddingX * 2);
    const availH = H - (paddingY * 2);

    let bestFit = { cardW: 240, cardH: 340, cols: 0, rows: 0, area: 0 };

    for (let c = 1; c <= count; c++) {
        const r = Math.ceil(count / c);
        const maxW_for_cols = (availW - gap * (c - 1)) / c;

        // Bounding limits
        const cardW = Math.max(Math.min(maxW_for_cols, 360), 200);

        // Target height aspect 1.7 (tall vertical card)
        const targetH = cardW * 1.7;
        const totalH_needed = r * targetH + gap * (r - 1);

        let finalH = targetH;
        let finalW = cardW;

        if (totalH_needed > availH) {
            finalH = Math.max((availH - gap * (r - 1)) / r, 260); // min height 260
        }

        const area = finalW * finalH * count;
        if (area > bestFit.area) {
            bestFit = { cardW: finalW, cardH: finalH, cols: c, rows: r, area };
        }
    }
    return bestFit;
}

/* ── Palettes (Mapped by Strain) ── */
const PALETTES = {
    indica: {
        '--pal-neon': '#a855f7',
        '--pal-neon-glow': 'rgba(168, 85, 247, 0.5)',
        '--pal-neon-dim': 'rgba(168, 85, 247, 0.15)',
        '--pal-grad1': '#a855f7',
        '--pal-grad2': '#e879f9',
        '--pal-border': 'rgba(168, 85, 247, 0.5)',
        '--pal-thc-bar': 'linear-gradient(90deg, #7c3aed, #c084fc)',
        '--pal-chip-bg': 'rgba(168, 85, 247, 0.2)',
        '--pal-chip-txt': '#d8b4fe',
    },
    sativa: {
        '--pal-neon': '#f59e0b',
        '--pal-neon-glow': 'rgba(245, 158, 11, 0.5)',
        '--pal-neon-dim': 'rgba(245, 158, 11, 0.15)',
        '--pal-grad1': '#f59e0b',
        '--pal-grad2': '#fbbf24',
        '--pal-border': 'rgba(245, 158, 11, 0.5)',
        '--pal-thc-bar': 'linear-gradient(90deg, #d97706, #fbbf24)',
        '--pal-chip-bg': 'rgba(245, 158, 11, 0.2)',
        '--pal-chip-txt': '#fde68a',
    },
    hybrid: {
        '--pal-neon': '#10b981',
        '--pal-neon-glow': 'rgba(16, 185, 129, 0.5)',
        '--pal-neon-dim': 'rgba(16, 185, 129, 0.15)',
        '--pal-grad1': '#10b981',
        '--pal-grad2': '#34d399',
        '--pal-border': 'rgba(16, 185, 129, 0.5)',
        '--pal-thc-bar': 'linear-gradient(90deg, #059669, #34d399)',
        '--pal-chip-bg': 'rgba(16, 185, 129, 0.2)',
        '--pal-chip-txt': '#a7f3d0',
    }
};

function getStrain(product) {
    const t = (product.type || '').toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

/* ── Single Cartridge Card ── */
function CartridgeCard({ product, index, cardW, cardH }) {
    const strain = getStrain(product);
    const pal = PALETTES[strain];

    const thc = Number(product.thc || 0);
    const cbd = Number(product.cbd || 0);
    const cbg = Number(product.cbg || 0);
    const cbn = Number(product.cbn || 0);

    // Safety to limit chips 
    const effects = (product.effects || []).slice(0, 3);
    const price = Number(product.price || 0).toFixed(2);
    const cartSize = product.cartSize || '';
    const extractType = product.extractType || '';
    const isNew = (product.badge || '').toLowerCase() === 'new';

    // Vary the float animation slightly so they don't sync
    const floatV = (index % 3) + 1;

    // Scale image area dynamically - significantly larger as requested
    const imgH = cardH * 0.50;
    const imgW = cardW * 0.85;

    return (
        <div
            className={`cg-card cg-card--in cg-float-${floatV}`}
            style={{
                width: cardW,
                height: cardH,
                '--entrance-del': `${index * 0.08}s`,
                '--float-del': `${index * 0.2}s`,
                ...pal
            }}
        >
            <div className="cg-top-line" />

            <div className="cg-header">
                <div className="cg-strain-label">{product.type || 'HYBRID'}</div>
                <div className="cg-badges">
                    {cartSize && <div className="cg-size-badge">{cartSize}</div>}
                    {extractType && <div className="cg-extract-badge">{extractType}</div>}
                    {isNew && <div className="cg-badge--hot">NEW</div>}
                </div>
            </div>

            <div className="cg-img-wrap" style={{ width: imgW, height: imgH }}>
                <div className="cg-img-glow" />
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="cg-img" loading="lazy" />
                ) : (
                    <span className="cg-empty" style={{ fontSize: '2em' }}>💧</span>
                )}
            </div>

            <div style={{ flex: 1, minHeight: 4 }} />

            <div className="cg-brand">{product.brand || 'Premium Extract'}</div>
            <div className="cg-name" style={{
                fontSize: cardW < 240 ? '1em' : '1.1em',
                WebkitLineClamp: cardH < 280 ? 1 : 2,
                marginBottom: 12
            }}>
                {product.name}
            </div>

            {/* Cannabinoid Bars */}
            <div className="cg-c-bars">
                <div className="cg-c-row">
                    <div className="cg-c-labels">
                        <span className="cg-c-label">THC</span>
                        <span className="cg-c-val">{thc}%</span>
                    </div>
                    <div className="cg-c-track">
                        <div className="cg-c-fill" style={{ width: `${Math.min(thc, 100)}%` }} />
                    </div>
                </div>

                {cbd > 0 && (
                    <div className="cg-c-row" style={{ marginTop: 4 }}>
                        <div className="cg-c-labels">
                            <span className="cg-c-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6em' }}>CBD</span>
                            <span className="cg-c-val" style={{ color: '#93c5fd', fontSize: '0.75em', textShadow: 'none' }}>{cbd}%</span>
                        </div>
                        <div className="cg-c-track" style={{ height: 3 }}>
                            <div className="cg-c-fill minor" style={{ width: `${Math.min(cbd * 2, 100)}%` }} />
                        </div>
                    </div>
                )}

                {/* CBG/CBN row if applicable, shown only if taller layout */}
                {(cbg > 0 || cbn > 0) && cardH > 320 && (
                    <div className="cg-c-minor-row" style={{ marginTop: 4 }}>
                        {cbg > 0 && (
                            <div className="cg-c-minor-item">
                                <span className="cg-c-label" style={{ marginRight: 6 }}>CBG</span>
                                <span className="cg-c-val">{cbg}%</span>
                            </div>
                        )}
                        {cbn > 0 && (
                            <div className="cg-c-minor-item" style={{ textAlign: 'right' }}>
                                <span className="cg-c-label" style={{ marginRight: 6 }}>CBN</span>
                                <span className="cg-c-val">{cbn}%</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Effects and Price */}
            {effects.length > 0 && cardH > 280 && (
                <div className="cg-effects">
                    {effects.map(e => (
                        <div key={e} className="cg-chip">{e}</div>
                    ))}
                </div>
            )}

            <div className="cg-price">${price}</div>
        </div>
    );
}

/* ── Main Layout Component ── */
export default function CartridgesLayout({ products = [] }) {
    const containerRef = useRef(null);
    const [dim, setDim] = useState({ w: window.innerWidth, h: window.innerHeight * 0.84 });

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                if (width > 0 && height > 0) {
                    setDim({ w: width, h: height });
                }
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const { cardW, cardH, cols } = useMemo(
        () => calculateGrid(products.length || 1, dim.w, dim.h),
        [products.length, dim.w, dim.h]
    );

    return (
        <div className="cg-scene" ref={containerRef}>
            <div className="cg-bg" />
            <div className="cg-bloom cg-bloom--1" />
            <div className="cg-bloom cg-bloom--2" />

            <div
                className="cg-grid"
                style={{
                    '--cols': cols || 1,
                    // If height is cramped, dynamically reduce gap so it fits securely
                    '--gap': dim.h < 600 ? '12px' : '20px',
                    '--pad': dim.h < 600 ? '12px 20px' : '20px 40px'
                }}
            >
                {products.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1 / -1' }}>Waiting for products…</div>
                ) : (
                    products.map((p, i) => (
                        <CartridgeCard
                            key={p.id}
                            product={p}
                            index={i}
                            cardW={cardW}
                            cardH={cardH}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
