/**
 * CartridgesLayout.jsx
 *
 * Premium Cartridges display showing rich extract data.
 * Adopts the dynamic grid sizing (ResizeObserver + useMemo) from NeuralConstellation
 * to rigorously ensure all products fit within the available viewport without scrollbars.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import './CartridgesLayout.css';

/* ── Sizing Logic ── */
function calculateGrid(count, W, H) {
    if (count === 0) return { cardW: 240, cardH: 340, cols: 0, rows: 0 };

    const padding = 20; // grid padding
    const gap = 16;     // grid gap
    const availW = W - (padding * 2);
    const availH = H - (padding * 2);

    let bestFit = { cardW: 240, cardH: 340, cols: 0, rows: 0, area: 0 };

    for (let c = 1; c <= count; c++) {
        const r = Math.ceil(count / c);
        const maxW_for_cols = (availW - gap * (c - 1)) / c;
        const cardW = Math.max(Math.min(maxW_for_cols, 380), 160); // min 160, max 380

        const targetH = cardW * 1.35; // taller proportion for cart info
        const totalH_needed = r * targetH + gap * (r - 1);

        let finalH = targetH;
        let finalW = cardW;

        if (totalH_needed > availH) {
            finalH = Math.max((availH - gap * (r - 1)) / r, 220); // enforce min height 220
        }

        const area = finalW * finalH * count;
        if (area > bestFit.area) {
            bestFit = { cardW: finalW, cardH: finalH, cols: c, rows: r, area };
        }
    }
    return bestFit;
}

/* ── "Liquid Gold" Bubbles Background ── */
function LiquidCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        let w = canvas.clientWidth;
        let h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const bubbles = Array.from({ length: 40 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 25 + 5,
            vx: (Math.random() - 0.5) * 0.2, // very slow drift
            vy: -Math.random() * 0.4 - 0.1,  // slow rise (like thick oil)
            alpha: Math.random() * 0.15 + 0.05
        }));

        let animId;
        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            bubbles.forEach(b => {
                b.x += b.vx;
                b.y += b.vy;

                // wrap around
                if (b.y + b.r < 0) {
                    b.y = h + b.r;
                    b.x = Math.random() * w;
                }
                if (b.x > w + b.r) b.x = -b.r;
                if (b.x < -b.r) b.x = w + b.r;

                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                const g = ctx.createRadialGradient(b.x, b.y, b.r * 0.1, b.x, b.y, b.r);
                g.addColorStop(0, `rgba(225, 165, 40, ${b.alpha * 1.5})`);
                g.addColorStop(1, `rgba(225, 165, 40, 0)`);
                ctx.fillStyle = g;
                ctx.fill();
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        const handleResize = () => {
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%' }}
        />
    );
}

/* ── Cartridge Card ── */
function CartridgeCard({ product, width, minHeight, index }) {
    // Determine strain color fallback
    let typeColor = '#888';
    switch (product.type) {
        case 'Indica':
        case 'Indica Dom.': typeColor = '#6FB8D2'; break;
        case 'Sativa':
        case 'Sativa Dom.': typeColor = '#E3B062'; break;
        case 'Hybrid': typeColor = '#87C58A'; break;
        case 'CBD': typeColor = '#C188D4'; break;
    }

    const {
        brand, name, price, type, extractType, cartSize,
        thc, cbd, cbg, cbn, effects = [], notes, imageUrl
    } = product;

    const displayThc = Number(thc) || 0;
    const displayCbd = Number(cbd) || 0;
    const displayCbg = Number(cbg) || 0;
    const displayCbn = Number(cbn) || 0;

    return (
        <div
            className="cg-card"
            style={{
                width,
                minHeight,
                '--delay': `${index * 0.05}s`
            }}
        >
            <div className="cg-card-inner">
                {/* Image + Header */}
                <div className="cg-top-row">
                    <div className="cg-image-wrap">
                        {imageUrl ? (
                            <img src={imageUrl} alt={name} className="cg-img" loading="lazy" />
                        ) : null}
                    </div>
                    <div className="cg-header">
                        {brand && <div className="cg-brand">{brand}</div>}
                        <div className="cg-name">{name}</div>
                        {extractType && <div className="cg-type-badge">{extractType}</div>}
                        <div className="cg-price">${Number(price).toFixed(2)}</div>
                    </div>
                </div>

                {/* Tags */}
                <div className="cg-specs-row">
                    {type && <div className="cg-pill"><span className="cg-pill-highlight" style={{ color: typeColor }}>{type}</span></div>}
                    {cartSize && <div className="cg-pill">{cartSize}</div>}
                </div>

                <div className="cg-body">
                    {/* Cannabinoids Chart */}
                    <div className="cg-section-title">Cannabinoids</div>
                    <div className="cg-cannabinoids">
                        <div className="cg-c-row">
                            <div className="cg-c-labels"><span className="cg-c-name">THC</span><span className="cg-c-val">{displayThc}%</span></div>
                            <div className="cg-c-bar-bg"><div className="cg-c-bar-fill" style={{ width: `${Math.min(displayThc, 100)}%` }} /></div>
                        </div>
                        {displayCbd > 0 && (
                            <div className="cg-c-row">
                                <div className="cg-c-labels"><span className="cg-c-name">CBD</span><span className="cg-c-val">{displayCbd}%</span></div>
                                <div className="cg-c-bar-bg"><div className="cg-c-bar-fill minor" style={{ width: `${Math.min(displayCbd * 5, 100)}%` }} /></div>
                            </div>
                        )}
                        {displayCbg > 0 && (
                            <div className="cg-c-row">
                                <div className="cg-c-labels"><span className="cg-c-name">CBG</span><span className="cg-c-val">{displayCbg}%</span></div>
                                <div className="cg-c-bar-bg"><div className="cg-c-bar-fill minor" style={{ width: `${Math.min(displayCbg * 10, 100)}%` }} /></div>
                            </div>
                        )}
                        {displayCbn > 0 && (
                            <div className="cg-c-row">
                                <div className="cg-c-labels"><span className="cg-c-name">CBN</span><span className="cg-c-val">{displayCbn}%</span></div>
                                <div className="cg-c-bar-bg"><div className="cg-c-bar-fill minor" style={{ width: `${Math.min(displayCbn * 10, 100)}%` }} /></div>
                            </div>
                        )}
                    </div>

                    {/* Effects */}
                    {effects.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                            <div className="cg-section-title">Effects</div>
                            <div className="cg-effects">
                                {effects.map(e => <div key={e} className="cg-effect-chip">{e}</div>)}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {notes && <div className="cg-notes">{notes}</div>}
                </div>
            </div>
        </div>
    );
}

/* ── Main Layout Component ── */
export default function CartridgesLayout({ products = [], categoryTheme }) {
    const accent = categoryTheme?.accent || '#E6B325';
    const containerRef = useRef(null);
    const [dim, setDim] = useState({ w: window.innerWidth, h: window.innerHeight * 0.84 });

    // Ensure responsive layout measurement
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

    const isDense = cols >= 5 || cardH < 260; // if cards get very small, add a dense class to shrink fonts

    return (
        <div className="cg-scene" ref={containerRef} style={{ '--primary': accent }}>
            <div className="cg-ambient-glow" />
            <div className="cg-canvas-container">
                <LiquidCanvas />
            </div>

            <div
                className={`cg-grid ${isDense ? 'dense' : ''}`}
                style={{
                    '--cg-gap': '16px',
                    '--cg-pad': '20px'
                }}
            >
                {products.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.4)', alignSelf: 'center', zIndex: 10 }}>No cartridges available</div>
                ) : (
                    products.map((p, i) => (
                        <CartridgeCard
                            key={p.id}
                            product={p}
                            width={cardW}
                            minHeight={cardH}
                            index={i}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
