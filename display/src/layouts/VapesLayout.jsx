/**
 * VapesLayout.jsx — "Neon Prism" Vapes Display
 *
 * Premium showcase for vape cartridges/pens:
 *  · Deep dark background with tech-grid overlay and neon bloom
 *  · Tall vertical "pen silhouette" cards — looks like a lit-up vape cart
 *  · Strain-colored neon glow (Indica=violet, Sativa=amber, Hybrid=teal)
 *  · Large product image (bigger than edibles)
 *  · Prominent THC% meter bar + cart size badge
 *  · Flavor tags as slim neon chips
 *  · Staggered slide-in from bottom + continuous subtle shimmer
 *  · Scales 1–14 products gracefully
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import './VapesLayout.css';

/* ── Strain palettes ─────────────────────────────────────────── */
const PALETTES = {
    indica: {
        neon: '#a855f7',
        neonDim: 'rgba(168,85,247,0.18)',
        neonGlow: 'rgba(168,85,247,0.55)',
        border: 'rgba(168,85,247,0.5)',
        thcBar: 'linear-gradient(90deg,#7c3aed,#c084fc)',
        grad1: '#a855f7',
        grad2: '#e879f9',
        chipBg: 'rgba(168,85,247,0.15)',
        chipTxt: '#d8b4fe',
        label: 'Indica',
        barColor: '#a855f7',
    },
    sativa: {
        neon: '#f59e0b',
        neonDim: 'rgba(245,158,11,0.18)',
        neonGlow: 'rgba(245,158,11,0.55)',
        border: 'rgba(245,158,11,0.5)',
        thcBar: 'linear-gradient(90deg,#d97706,#fbbf24)',
        grad1: '#f59e0b',
        grad2: '#fde68a',
        chipBg: 'rgba(245,158,11,0.15)',
        chipTxt: '#fde68a',
        label: 'Sativa',
        barColor: '#f59e0b',
    },
    hybrid: {
        neon: '#10b981',
        neonDim: 'rgba(16,185,129,0.18)',
        neonGlow: 'rgba(16,185,129,0.55)',
        border: 'rgba(16,185,129,0.5)',
        thcBar: 'linear-gradient(90deg,#059669,#34d399)',
        grad1: '#10b981',
        grad2: '#6ee7b7',
        chipBg: 'rgba(16,185,129,0.15)',
        chipTxt: '#6ee7b7',
        label: 'Hybrid',
        barColor: '#10b981',
    },
};

function getStrain(p) {
    const t = (p.type || '').toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

/* ── Grid particle canvas (tech circuit dots) ────────────────── */
function CircuitCanvas({ W, H }) {
    const ref = useRef(null);
    const raf = useRef(null);

    useEffect(() => {
        const c = ref.current;
        if (!c || !W || !H) return;
        const ctx = c.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        c.width = W * dpr; c.height = H * dpr;
        ctx.scale(dpr, dpr);

        // Static grid dots
        const CELL = 48;
        const cols = Math.ceil(W / CELL);
        const rows = Math.ceil(H / CELL);

        // Animated neon streaks
        const STREAK_COLORS = ['#a855f7', '#10b981', '#f59e0b', '#38bdf8'];
        const streaks = Array.from({ length: 8 }, (_, i) => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.6),
            vy: (Math.random() > 0.5 ? 0.2 : -0.2),
            len: 60 + Math.random() * 80,
            col: STREAK_COLORS[i % STREAK_COLORS.length],
            alpha: 0.0,
            alphaDelta: 0.008 + Math.random() * 0.012,
        }));

        function draw() {
            ctx.clearRect(0, 0, W, H);

            // Grid dots
            ctx.fillStyle = 'rgba(255,255,255,0.045)';
            for (let col = 0; col <= cols; col++) {
                for (let row = 0; row <= rows; row++) {
                    ctx.beginPath();
                    ctx.arc(col * CELL, row * CELL, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Animated streaks
            for (const s of streaks) {
                s.alpha += s.alphaDelta;
                if (s.alpha > 1 || s.alpha < 0) s.alphaDelta *= -1;
                s.x += s.vx; s.y += s.vy;
                if (s.x < -s.len || s.x > W + s.len) s.x = s.vx > 0 ? -s.len : W + s.len;
                if (s.y < -20 || s.y > H + 20) s.vy *= -1;

                const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.len * Math.sign(s.vx), s.y);
                grad.addColorStop(0, s.col + '00');
                grad.addColorStop(0.5, s.col + `${Math.round(s.alpha * 0.4 * 255).toString(16).padStart(2, '0')}`);
                grad.addColorStop(1, s.col + '00');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x + s.len * Math.sign(s.vx), s.y);
                ctx.stroke();
            }

            raf.current = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(raf.current);
    }, [W, H]);

    return <canvas ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, width: W, height: H }} />;
}

/* ── Single vape card ─────────────────────────────────────────── */
function VapeCard({ product, index, cardW, cardH }) {
    const strain = getStrain(product);
    const pal = PALETTES[strain];
    const thc = Number(product.thc || 0);
    const cbd = Number(product.cbd || 0);
    const flavors = (product.flavors || product.terpenes || []).slice(0, 4);
    const price = Number(product.price || 0).toFixed(2);
    const cartSize = product.cartSize || product.sellType?.replace('Pre-packed', '') || '1g';
    const vapeType = product.vapeType || 'Classic THC';
    const isNew = (product.badge || '').toLowerCase() === 'new';
    const floatV = (index % 4) + 1;

    // Image is intentionally larger for vapes — tall cart photo
    const imgH = Math.min(cardH * 0.52, 200);
    const imgW = imgH * 0.55; // portrait ratio for a vape pen

    return (
        <div
            className={`vp-card vp-float-${floatV} vp-card--in`}
            style={{
                '--pal-neon': pal.neon,
                '--pal-neon-dim': pal.neonDim,
                '--pal-neon-glow': pal.neonGlow,
                '--pal-border': pal.border,
                '--pal-thc-bar': pal.thcBar,
                '--pal-grad1': pal.grad1,
                '--pal-grad2': pal.grad2,
                '--pal-chip-bg': pal.chipBg,
                '--pal-chip-txt': pal.chipTxt,
                '--entrance-del': `${index * 0.07}s`,
                '--float-del': `${index * 0.18}s`,
                width: cardW,
                minHeight: cardH,
            }}
        >
            {/* Top neon line accent */}
            <div className="vp-top-line" />

            {/* Header row: strain badge + vape type + cart size */}
            <div className="vp-header">
                <span className="vp-strain-label">{pal.label}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {cartSize && <span className="vp-size-badge">{cartSize}</span>}
                    {product.badge && (
                        <span className={`vp-badge ${isNew ? 'vp-badge--new' : 'vp-badge--hot'}`}>
                            {product.badge}
                        </span>
                    )}
                </div>
            </div>

            {/* Product Image — tall portrait, bigger than edibles */}
            <div className="vp-img-wrap" style={{ height: imgH, width: imgW }}>
                <div className="vp-img-glow" />
                {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="vp-img" />
                    : <span className="vp-emoji">💨</span>
                }
            </div>

            {/* Name */}
            <div className="vp-name">{product.name}</div>
            {product.brand && <div className="vp-brand">{product.brand}</div>}

            {/* Vape type tag */}
            {vapeType && vapeType !== 'Classic THC' && (
                <div className="vp-type-tag">{vapeType}</div>
            )}

            {/* THC meter */}
            {thc > 0 && (
                <div className="vp-thc-wrap">
                    <div className="vp-thc-label-row">
                        <span className="vp-thc-label">THC</span>
                        <span className="vp-thc-val">{thc}%</span>
                    </div>
                    <div className="vp-thc-track">
                        <div className="vp-thc-fill" style={{ width: `${Math.min(thc, 100)}%` }} />
                        <div className="vp-thc-glow" style={{ left: `${Math.min(thc, 100)}%` }} />
                    </div>
                    {cbd > 0 && <div className="vp-cbd-row">CBD {cbd}%</div>}
                </div>
            )}

            {/* Flavor chips */}
            {flavors.length > 0 && (
                <div className="vp-flavors">
                    {flavors.map(f => <span key={f} className="vp-chip">{f}</span>)}
                </div>
            )}

            {/* Notes */}
            {product.notes && <div className="vp-notes">{product.notes}</div>}

            {/* Price */}
            <div className="vp-price">${price}</div>

            {/* Bottom neon line */}
            <div className="vp-bottom-glow" />
        </div>
    );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function VapesLayout({ products = [], categoryTheme }) {
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

    const { cardW, cardH, cols } = useMemo(() => {
        const n = products.length || 1;
        const cols = n <= 2 ? n : n <= 4 ? 2 : n <= 6 ? 3 : n <= 9 ? 3 : n <= 12 ? 4 : 5;
        const GAP = 14, PAD_X = 24, PAD_Y = 14;
        const avlW = W - PAD_X * 2 - GAP * (cols - 1);
        const cardW = Math.max(130, Math.min(200, Math.floor(avlW / cols)));
        const rows = Math.ceil(n / cols);
        // Subtract padding + gaps from available height, then divide
        const avlH = H - PAD_Y * 2 - GAP * (rows - 1);
        const cardH = Math.max(240, Math.min(420, Math.floor(avlH / rows)));
        return { cardW, cardH, cols };
    }, [products.length, W, H]);

    return (
        <div ref={containerRef} className="vp-scene"
            style={{ width: '100%', height: '100%', '--accent': categoryTheme?.accent || '#7c8cf8' }}>

            {/* Dark tech base */}
            <div className="vp-bg" />

            {/* Animated circuit grid */}
            <CircuitCanvas W={W} H={H} />

            {/* Ambient neon bloom centers */}
            <div className="vp-bloom vp-bloom--1" />
            <div className="vp-bloom vp-bloom--2" />
            <div className="vp-bloom vp-bloom--3" />

            {/* Card grid */}
            <div className="vp-grid"
                style={{ '--cols': cols, '--gap': '14px', '--pad': '14px 24px' }}>
                {products.map((p, i) => (
                    <VapeCard key={p.id} product={p} index={i} cardW={cardW} cardH={cardH} />
                ))}
            </div>
        </div>
    );
}
