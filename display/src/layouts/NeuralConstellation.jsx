/**
 * NeuralConstellation.jsx — "Candy Shelf" Edibles Display
 *
 * A premium card grid layout for edibles products. Features:
 *  - Strain-specific color palettes (Indica=violet, Sativa=amber, Hybrid=teal)
 *  - Floating candy sparkle particle canvas background
 *  - Per-card glow rings + ribbon in strain color
 *  - Shows: image, name, brand, mg THC badge, piece count, effects chips, price
 *  - Staggered slide-up entrance animations
 *  - Scales from 1–16+ products gracefully
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import './NeuralConstellation.css';

/* ── Strain Color Palettes ─────────────────────────────────────────── */
const STRAIN_PALETTES = {
    indica: {
        ribbon: '#7c3aed',
        glow: 'rgba(124, 58, 237, 0.35)',
        glowSoft: 'rgba(124, 58, 237, 0.12)',
        border: 'rgba(124, 58, 237, 0.5)',
        mgBg: 'rgba(124, 58, 237, 0.2)',
        mgColor: '#c4b5fd',
        label: '#7c3aed',
        grad1: '#7c3aed',
        grad2: '#a78bfa',
        chipBg: 'rgba(124, 58, 237, 0.15)',
        chipColor: '#c4b5fd',
        name: 'Indica',
    },
    sativa: {
        ribbon: '#d97706',
        glow: 'rgba(217, 119, 6, 0.35)',
        glowSoft: 'rgba(217, 119, 6, 0.12)',
        border: 'rgba(217, 119, 6, 0.5)',
        mgBg: 'rgba(217, 119, 6, 0.2)',
        mgColor: '#fcd34d',
        label: '#d97706',
        grad1: '#f59e0b',
        grad2: '#fbbf24',
        chipBg: 'rgba(217, 119, 6, 0.15)',
        chipColor: '#fcd34d',
        name: 'Sativa',
    },
    hybrid: {
        ribbon: '#059669',
        glow: 'rgba(5, 150, 105, 0.35)',
        glowSoft: 'rgba(5, 150, 105, 0.12)',
        border: 'rgba(5, 150, 105, 0.5)',
        mgBg: 'rgba(5, 150, 105, 0.2)',
        mgColor: '#6ee7b7',
        label: '#059669',
        grad1: '#10b981',
        grad2: '#34d399',
        chipBg: 'rgba(5, 150, 105, 0.15)',
        chipColor: '#6ee7b7',
        name: 'Hybrid',
    },
};

function getStrain(product) {
    const t = (product.type || '').toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

/* ── Candy Sparkle Particle Canvas ───────────────────────────────── */
function CandyParticles({ W, H }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !W || !H) return;
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        // Candy sparkle colors — pinks, purples, golds, mint
        const COLORS = [
            '#f472b6', '#a78bfa', '#34d399', '#fbbf24',
            '#fb7185', '#60a5fa', '#c084fc', '#86efac',
        ];

        const particles = Array.from({ length: 55 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.8 + 0.4,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            alpha: Math.random(),
            speed: Math.random() * 0.004 + 0.002,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -Math.random() * 0.5 - 0.1,
            // Some float up slowly, some drift sideways
            drift: Math.random() > 0.6,
        }));

        function draw() {
            ctx.clearRect(0, 0, W, H);
            for (const p of particles) {
                p.alpha += p.speed;
                if (p.alpha > 1) {
                    p.alpha = 0;
                    p.x = Math.random() * W;
                    p.y = H + 4;
                }
                p.x += p.vx;
                p.y += p.vy;
                const opacity = Math.sin(p.alpha * Math.PI) * 0.5;

                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.shadowBlur = 6;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;

                // Alternate between diamond and circle shapes
                if (p.drift) {
                    ctx.translate(p.x, p.y);
                    ctx.rotate(Math.PI / 4);
                    ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
            rafRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [W, H]);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, width: W, height: H }}
        />
    );
}

/* ── Single Product Card ─────────────────────────────────────────── */
function EdibleCard({ product, index, cardWidth }) {
    const strain = getStrain(product);
    const palette = STRAIN_PALETTES[strain];
    const effects = product.effects || [];
    const thcMg = product.thcMg || product.thc || 0;
    const pieceCount = product.pieceCount;
    const price = Number(product.price || 0).toFixed(2);
    const isNew = (product.badge || '').toLowerCase() === 'new';

    const fontSize = cardWidth > 200 ? 14 : 12;
    const imgSize = cardWidth > 200 ? Math.min(cardWidth * 0.55, 130) : Math.min(cardWidth * 0.55, 100);

    return (
        <div
            className="ec-card ec-card--in"
            style={{
                '--strain-ribbon': palette.ribbon,
                '--strain-glow': palette.glow,
                '--strain-glow-soft': palette.glowSoft,
                '--strain-border': palette.border,
                '--strain-grad1': palette.grad1,
                '--strain-grad2': palette.grad2,
                '--strain-mg-bg': palette.mgBg,
                '--strain-mg-color': palette.mgColor,
                '--strain-chip-bg': palette.chipBg,
                '--strain-chip-color': palette.chipColor,
                '--entrance-delay': `${index * 0.07}s`,
                width: cardWidth,
                fontSize,
            }}
        >
            {/* Strain-colored top ribbon */}
            <div className="ec-ribbon">
                <span className="ec-ribbon-strain">{palette.name}</span>
                {product.badge && (
                    <span className={`ec-badge ${isNew ? 'ec-badge--new' : 'ec-badge--hot'}`}>
                        {product.badge}
                    </span>
                )}
            </div>

            {/* Product image with glow ring */}
            <div className="ec-img-wrap" style={{ width: imgSize, height: imgSize }}>
                <div className="ec-img-ring" />
                {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="ec-img" />
                    : <span className="ec-emoji">🍬</span>
                }
            </div>

            {/* Name & brand */}
            <div className="ec-name">{product.name}</div>
            {product.brand && <div className="ec-brand">{product.brand}</div>}

            {/* mg THC + piece count row */}
            <div className="ec-specs">
                {thcMg > 0 && (
                    <div className="ec-spec-pill ec-spec-mg">
                        <span className="ec-spec-val">{thcMg}<span style={{ fontSize: '0.7em', opacity: 0.8 }}>mg</span></span>
                        <span className="ec-spec-lbl">THC</span>
                    </div>
                )}
                {pieceCount && (
                    <div className="ec-spec-pill ec-spec-count">
                        <span className="ec-spec-val">{pieceCount}</span>
                        <span className="ec-spec-lbl">pieces</span>
                    </div>
                )}
            </div>

            {/* Effects chips */}
            {effects.length > 0 && (
                <div className="ec-effects">
                    {effects.slice(0, 4).map(e => (
                        <span key={e} className="ec-chip">{e}</span>
                    ))}
                </div>
            )}

            {/* Flavor notes */}
            {product.notes && (
                <div className="ec-notes">{product.notes}</div>
            )}

            {/* Price */}
            <div className="ec-price">${price}</div>
        </div>
    );
}

/* ── Main Component ────────────────────────────────────────────────── */
export default function NeuralConstellation({ products = [], categoryTheme }) {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ W: 1280, H: 720 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => setSize({ W: el.clientWidth || 1280, H: el.clientHeight || 720 });
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { W, H } = size;

    // Calculate ideal card width based on product count + available width
    const cardWidth = useMemo(() => {
        const count = products.length;
        if (!count) return 200;
        const cols = count <= 2 ? count : count <= 4 ? 2 : count <= 6 ? 3 : count <= 9 ? 3 : count <= 12 ? 4 : 5;
        const gap = 16;
        const sidePad = 40;
        const available = W - sidePad * 2 - gap * (cols - 1);
        return Math.max(140, Math.min(220, Math.floor(available / cols)));
    }, [products.length, W]);

    return (
        <div
            ref={containerRef}
            className="ec-scene"
            style={{ width: '100%', height: '100%', '--accent': categoryTheme?.accent || '#c06c84' }}
        >
            {/* Ambient gradient bg */}
            <div className="ec-ambient" />

            {/* Candy sparkle particles */}
            <CandyParticles W={W} H={H} />

            {/* Card grid */}
            <div className="ec-grid" style={{ '--card-width': `${cardWidth}px` }}>
                {products.map((product, i) => (
                    <EdibleCard
                        key={product.id}
                        product={product}
                        index={i}
                        cardWidth={cardWidth}
                    />
                ))}
            </div>
        </div>
    );
}
