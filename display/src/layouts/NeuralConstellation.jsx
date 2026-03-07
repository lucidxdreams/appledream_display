/**
 * NeuralConstellation.jsx — "Candy Aurora" Edibles Display
 *
 * Premium glassmorphism showcase:
 *  · Animated aurora borealis background (CSS, candy palette)
 *  · Tall frosted-glass cards with strain-colored holographic glow
 *  · Circular product image with animated halo ring
 *  · Prominent THC mg dial badge + piece count
 *  · Effects as slim frosted chips
 *  · Staggered float-up entrance + continuous gentle levitation
 *  · Scales 1–16 products gracefully (auto-cols)
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import './NeuralConstellation.css';

/* ── Strain palettes ─────────────────────────────────────────────── */
const PALETTES = {
    indica: {
        halo: '#8b5cf6',
        glow: 'rgba(139, 92, 246, 0.5)',
        glowSm: 'rgba(139, 92, 246, 0.15)',
        border: 'rgba(139, 92, 246, 0.45)',
        mg: '#c4b5fd',
        mgBg: 'rgba(139, 92, 246, 0.22)',
        chip: 'rgba(139, 92, 246, 0.18)',
        chipTxt: '#c4b5fd',
        grad1: '#8b5cf6',
        grad2: '#c084fc',
        bar: 'linear-gradient(180deg, #7c3aed, #a855f7)',
        label: 'Indica',
        aurora: '#7c3aed',
    },
    sativa: {
        halo: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.5)',
        glowSm: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.45)',
        mg: '#fde68a',
        mgBg: 'rgba(245, 158, 11, 0.22)',
        chip: 'rgba(245, 158, 11, 0.18)',
        chipTxt: '#fde68a',
        grad1: '#f59e0b',
        grad2: '#fbbf24',
        bar: 'linear-gradient(180deg, #d97706, #f59e0b)',
        label: 'Sativa',
        aurora: '#d97706',
    },
    hybrid: {
        halo: '#10b981',
        glow: 'rgba(16, 185, 129, 0.5)',
        glowSm: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.45)',
        mg: '#6ee7b7',
        mgBg: 'rgba(16, 185, 129, 0.22)',
        chip: 'rgba(16, 185, 129, 0.18)',
        chipTxt: '#6ee7b7',
        grad1: '#10b981',
        grad2: '#34d399',
        bar: 'linear-gradient(180deg, #059669, #10b981)',
        label: 'Hybrid',
        aurora: '#059669',
    },
};

function getStrain(p) {
    const t = (p.type || '').toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

/* ── Floating orb background (canvas) ───────────────────────────── */
function AuroraOrbs({ W, H }) {
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

        const ORB_COLORS = [
            ['#7c3aed', '#a855f7'],
            ['#d97706', '#f59e0b'],
            ['#059669', '#10b981'],
            ['#db2777', '#f472b6'],
            ['#0ea5e9', '#38bdf8'],
        ];

        const orbs = ORB_COLORS.map(([c1, c2], i) => ({
            x: (W / ORB_COLORS.length) * i + W / ORB_COLORS.length / 2,
            y: H * (0.3 + Math.random() * 0.4),
            r: Math.min(W, H) * (0.22 + Math.random() * 0.18),
            c1, c2,
            speed: 0.15 + Math.random() * 0.1,
            offset: Math.random() * Math.PI * 2,
        }));

        let t = 0;

        function draw() {
            ctx.clearRect(0, 0, W, H);
            for (const o of orbs) {
                const dx = Math.sin(t * o.speed + o.offset) * W * 0.06;
                const dy = Math.cos(t * o.speed * 0.7 + o.offset) * H * 0.06;
                const grd = ctx.createRadialGradient(o.x + dx, o.y + dy, 0, o.x + dx, o.y + dy, o.r);
                grd.addColorStop(0, o.c1 + '28');   // ~15% opacity
                grd.addColorStop(1, o.c2 + '00');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(o.x + dx, o.y + dy, o.r, 0, Math.PI * 2);
                ctx.fill();
            }
            t += 0.008;
            rafRef.current = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [W, H]);

    return (
        <canvas ref={canvasRef}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, width: W, height: H }} />
    );
}

/* ── Sparkle particles ────────────────────────────────────────── */
function Sparkles({ W, H }) {
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

        const COLS = ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#fff', '#60a5fa'];
        const pts = Array.from({ length: 70 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.5 + 0.3,
            col: COLS[Math.floor(Math.random() * COLS.length)],
            life: Math.random(),
            spd: 0.003 + Math.random() * 0.004,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -(Math.random() * 0.4 + 0.1),
        }));

        function draw() {
            ctx.clearRect(0, 0, W, H);
            for (const p of pts) {
                p.life += p.spd;
                if (p.life > 1) { p.life = 0; p.x = Math.random() * W; p.y = H + 4; }
                p.x += p.vx; p.y += p.vy;
                const a = Math.sin(p.life * Math.PI) * 0.55;
                ctx.save();
                ctx.globalAlpha = a;
                ctx.shadowBlur = 5;
                ctx.shadowColor = p.col;
                ctx.fillStyle = p.col;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            rafRef.current = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [W, H]);

    return (
        <canvas ref={canvasRef}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, width: W, height: H }} />
    );
}

/* ── Single product card ─────────────────────────────────────── */
function EdibleCard({ product, index, cardW, cardH }) {
    const strain = getStrain(product);
    const pal = PALETTES[strain];
    const effects = (product.effects || []).slice(0, 4);
    const thcMg = product.thcMg || product.thc || 0;
    const pieces = product.pieceCount;
    const price = Number(product.price || 0).toFixed(2);
    const isNew = (product.badge || '').toLowerCase() === 'new';
    const floatV = (index % 4) + 1;
    const imgSize = Math.min(cardW * 0.62, 110);

    return (
        <div
            className={`ca-card ca-float-${floatV} ca-card--in`}
            style={{
                '--pal-halo': pal.halo,
                '--pal-glow': pal.glow,
                '--pal-glow-sm': pal.glowSm,
                '--pal-border': pal.border,
                '--pal-mg': pal.mg,
                '--pal-mg-bg': pal.mgBg,
                '--pal-chip': pal.chip,
                '--pal-chip-txt': pal.chipTxt,
                '--pal-grad1': pal.grad1,
                '--pal-grad2': pal.grad2,
                '--pal-bar': pal.bar,
                '--entrance-del': `${index * 0.07}s`,
                '--float-del': `${index * 0.15}s`,
                width: cardW,
                minHeight: cardH,
            }}
        >
            {/* Left strain bar */}
            <div className="ca-bar" />

            {/* Top section: badge + strain label */}
            <div className="ca-top">
                <span className="ca-strain-label">{pal.label}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                    {product.badge && (
                        <span className={`ca-badge ${isNew ? 'ca-badge--new' : 'ca-badge--hot'}`}>
                            {product.badge}
                        </span>
                    )}
                    {product.featured && <span className="ca-badge ca-badge--feat">★</span>}
                </div>
            </div>

            {/* Product image — circular with halo */}
            <div className="ca-img-outer" style={{ width: imgSize, height: imgSize }}>
                <div className="ca-halo-ring" />
                <div className="ca-halo-ring ca-halo-ring--2" />
                <div className="ca-img-inner">
                    {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.name} className="ca-img" />
                        : <span className="ca-emoji">🍬</span>
                    }
                </div>
            </div>

            {/* Name */}
            <div className="ca-name">{product.name}</div>
            {product.brand && <div className="ca-brand">{product.brand}</div>}

            {/* THC mg + pieces row */}
            <div className="ca-meta">
                {thcMg > 0 && (
                    <div className="ca-thc-badge">
                        <span className="ca-thc-val">{thcMg}</span>
                        <span className="ca-thc-unit">mg THC</span>
                    </div>
                )}
                {pieces && (
                    <div className="ca-pieces-badge">
                        <span className="ca-pieces-val">{pieces}</span>
                        <span className="ca-pieces-unit">pcs</span>
                    </div>
                )}
            </div>

            {/* Effects */}
            {effects.length > 0 && (
                <div className="ca-effects">
                    {effects.map(e => <span key={e} className="ca-chip">{e}</span>)}
                </div>
            )}

            {/* Notes */}
            {product.notes && (
                <div className="ca-notes">{product.notes}</div>
            )}

            {/* Price */}
            <div className="ca-price">${price}</div>
        </div>
    );
}

/* ── Main ─────────────────────────────────────────────────────── */
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

    // Dynamic card dimensions
    const { cardW, cardH, cols } = useMemo(() => {
        const n = products.length || 1;
        const cols = n <= 2 ? n : n <= 4 ? 2 : n <= 6 ? 3 : n <= 9 ? 3 : n <= 12 ? 4 : 5;
        const gap = 18;
        const padX = 36;
        const padY = 20;
        const avlW = W - padX * 2 - gap * (cols - 1);
        const cardW = Math.max(130, Math.min(200, Math.floor(avlW / cols)));
        const rows = Math.ceil(n / cols);
        const avlH = H - padY * 2 - gap * (rows - 1);
        const cardH = Math.max(280, Math.min(360, Math.floor(avlH / rows)));
        return { cardW, cardH, cols };
    }, [products.length, W, H]);

    return (
        <div ref={containerRef} className="ca-scene"
            style={{ width: '100%', height: '100%', '--accent': categoryTheme?.accent || '#c06c84' }}>

            {/* Deep plum bg */}
            <div className="ca-bg" />

            {/* Animated aurora orbs */}
            <AuroraOrbs W={W} H={H} />

            {/* Fine sparkle particles */}
            <Sparkles W={W} H={H} />

            {/* Grid */}
            <div className="ca-grid"
                style={{ '--cols': cols, '--gap': `${18}px`, '--pad': '36px 36px' }}>
                {products.map((p, i) => (
                    <EdibleCard
                        key={p.id}
                        product={p}
                        index={i}
                        cardW={cardW}
                        cardH={cardH}
                    />
                ))}
            </div>
        </div>
    );
}
