/**
 * CartridgesLayout.jsx
 *
 * Rewritten to precisely mirror the successful vertical design of VapesLayout ("Neon Prism" style),
 * applying large images and robust grids, but retaining extra cartridge details (Extract Type, CBG, CBN, Effects).
 */

import { useState, useRef, useEffect } from 'react';
import { useFloatingLayout } from './useFloatingLayout';
import './CartridgesLayout.css';

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

            <div className="cg-img-wrap" style={{ width: imgW }}>
                <div className="cg-img-glow" />
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="cg-img" loading="lazy" />
                ) : (
                    <span className="cg-empty" style={{ fontSize: '2em' }}>💧</span>
                )}
            </div>

            <div style={{ flexShrink: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="cg-brand">{product.brand || 'Premium Extract'}</div>
            <div className="cg-name">
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

                    {(cbg > 0 || cbn > 0) && (
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
            {effects.length > 0 && (
                <div className="cg-effects">
                    {effects.map(e => (
                        <div key={e} className="cg-chip">{e}</div>
                    ))}
                </div>
            )}

            <div className="cg-price">${price}</div>
            </div>
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

    const { positions, cardW, cardH } = useFloatingLayout({
        products,
        containerW: dim.w,
        containerH: dim.h,
        baseCardW: 220,
        baseCardH: 300,
    });

    return (
        <div className="cg-scene" ref={containerRef}>
            <div className="cg-bg" />
            <div className="cg-bloom cg-bloom--1" />
            <div className="cg-bloom cg-bloom--2" />

            <div className="cg-floating-container">
                {products.map((p, i) => positions[i] ? (
                    <div
                        key={p.id}
                        className="cg-card-wrapper"
                        style={{
                            position: 'absolute',
                            left: positions[i].x - cardW / 2,
                            top: positions[i].y - cardH / 2,
                            width: cardW,
                            height: cardH,
                        }}
                    >
                        <CartridgeCard
                            product={p}
                            index={i}
                            cardW={cardW}
                            cardH={cardH}
                        />
                    </div>
                ) : null)}
            </div>
        </div>
    );
}
