/**
 * VapesLayout.jsx — "Holo-Fluid Glass" Vapes Display
 *
 * Implements the same Holo-Fluid Glass design system as Cartridges,
 * but retains the unique animated CircuitCanvas background layer
 * and maps Vape specific properties (flavors, vapeType).
 */

import { useRef, useState, useEffect } from 'react';
import { useImagePalette } from '../lib/colorExtractor';
import './CartridgesLayout.css';

/* ── Layout constants ── */
const GAP    = 22;
const PAD_H  = 28;
const PAD_V  = 28;
const ASPECT = 0.62;

/* ── Fluid Strain Palettes ── */
const PALETTES = {
    indica: { orb1: '#a855f7', orb2: '#c084fc', orb3: '#7e22ce', text: '#f3e8ff', primary: '#d8b4fe', label: 'Indica' },
    sativa: { orb1: '#f59e0b', orb2: '#fcd34d', orb3: '#b45309', text: '#fef3c7', primary: '#fcd34d', label: 'Sativa' },
    hybrid: { orb1: '#14b8a6', orb2: '#5eead4', orb3: '#0f766e', text: '#ccfbf1', primary: '#5eead4', label: 'Hybrid' },
};

function getStrain(p) {
    const t = ((p.type || '') + ' ' + (p.name || '')).toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}
function getPalette(p) { return PALETTES[getStrain(p)]; }

/* ── Fixed card sizing — guaranteed portrait, no stretching ── */
function calcSizes(W, H, count, safeTop) {
    if (!W || !H || count === 0) return { cardW: 200, cardH: 323 };
    const availW = Math.max(80, W - PAD_H * 2);
    const availH = Math.max(80, H - safeTop - PAD_V * 2);

    const maxCols = Math.min(count, 8);
    let bestCols = Math.max(1, Math.min(count, 2));
    for (let c = 1; c <= maxCols; c++) {
        const rows = Math.ceil(count / c);
        const cW   = Math.floor((availW - GAP * (c - 1)) / c);
        const cH   = Math.floor((availH - GAP * (rows - 1)) / rows);
        bestCols = c;
        if (cH >= cW) break;
    }

    const cols  = bestCols;
    const rows  = Math.ceil(count / cols);
    const cardW = Math.floor((availW - GAP * (cols - 1)) / cols);
    const rowH  = Math.floor((availH - GAP * (rows - 1)) / rows);
    const cardH = Math.max(rowH, Math.round(cardW * 1.1));

    return {
        cardW: Math.max(120, cardW),
        cardH: Math.max(190, Math.min(cardH, Math.round(cardW / ASPECT))),
    };
}

/* ── Logo-safe top offset ── */
function getSafeTop(container) {
    if (!container) return 0;
    const stable = container.closest('main, .app-content') || container.parentElement?.parentElement || container.parentElement;
    const refTop = stable ? stable.getBoundingClientRect().top : 0;
    let max = 0;
    ['.app-header-center', '.app-logo', '.app-header-meta'].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            const b = el.getBoundingClientRect().bottom;
            if (b > refTop) max = Math.max(max, b - refTop);
        });
    });
    return max > 0 ? max + 16 : 0;
}

/* ── Animated circuit canvas (unique to Vapes) ── */
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

        const CELL = 48;
        const cols = Math.ceil(W / CELL);
        const rows = Math.ceil(H / CELL);

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
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            for (let col = 0; col <= cols; col++) {
                for (let row = 0; row <= rows; row++) {
                    ctx.beginPath();
                    ctx.arc(col * CELL, row * CELL, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

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

/* ── Float parameters for cards ── */
const FLOAT_CONFIGS = [
    { dur: '8s',  delay: '0s' },
    { dur: '9.5s', delay: '-3s' },
    { dur: '7.2s', delay: '-1s' },
    { dur: '8.8s', delay: '-5s' },
];

/* ── Single Vape Card ── */
function VapeCard({ product, cardW, cardH, index }) {
    const pal      = getPalette(product);
    const imgPal   = useImagePalette(product.imageUrl);

    const thc      = product.thc  != null ? Number(product.thc)  : null;
    const cbd      = product.cbd  != null ? Number(product.cbd)  : null;
    const price    = product.price != null ? Number(product.price) : null;
    const flavors  = (product.flavors || product.terpenes || []).slice(0, 3);
    const cartSize = product.cartSize || product.size || '';
    const vapeType = product.vapeType || '';
    const isNew    = (product.badge || '').toLowerCase() === 'new';

    const floatCfg = FLOAT_CONFIGS[index % 4];

    /* Metadata details joined for Vapes */
    const metaTags = [vapeType !== 'Classic THC' ? vapeType : null, cartSize, isNew ? 'NEW' : ''].filter(Boolean);

    /* Dynamic Color Blends: 
     * Orb 1: Image Dominant Accent
     * Orb 2: Strain Core Color (Preserves Strain Identity)
     * Orb 3: Image Hyper-Saturated Hue
     */
    const orb1 = imgPal?.accent || pal.orb1;
    const orb2 = pal.orb1; 
    const orb3 = imgPal?.saturated || pal.orb3;
    const textCol = imgPal?.text || pal.text;
    const priCol = imgPal?.accent || pal.primary;

    return (
        <div
            className="holo-card holo-card--disposable"
            style={{
                '--pal-o1':        orb1,
                '--pal-o2':        orb2,
                '--pal-o3':        orb3,
                '--pal-text':      textCol,
                '--pal-primary':   priCol,
                '--entrance-delay': `${index * 0.08}s`,
                '--float-dur':     floatCfg.dur,
                '--float-delay':   floatCfg.delay,
                width:  cardW,
                height: cardH,
                flexShrink: 0,
            }}
        >
            <div className="holo-orbs">
                <div className="holo-orb holo-orb-1" />
                <div className="holo-orb holo-orb-2" />
                <div className="holo-orb holo-orb-3" />
            </div>

            <div className="holo-glass-pane" />

            <div className="holo-content-wrapper">
                <div className="holo-meta-top">
                    <span className="holo-strain-pill">{pal.label}</span>
                    {metaTags.length > 0 && (
                        <div className="holo-meta-tags">
                            {metaTags.join(' • ')}
                        </div>
                    )}
                </div>

                <div className="holo-hero">
                    <div className="holo-hero-shadow" />
                    <div className="holo-img-container">
                        {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name} className="holo-img" loading="lazy" />
                            : <span className="holo-fallback">💨</span>
                        }
                    </div>
                </div>

                <div className="holo-info">
                    {product.brand && <div className="holo-brand">{product.brand}</div>}
                    <div className="holo-name" title={product.name}>{product.name}</div>

                    {flavors.length > 0 && (
                        <div className="holo-effects">
                            {flavors.map(f => <span key={f} className="holo-chip">{f}</span>)}
                        </div>
                    )}

                    <div className="holo-data-pane">
                        <div className="holo-data-stats">
                            {thc != null && (
                                <div className="holo-stat-col">
                                    <span className="holo-stat-lbl">THC</span>
                                    <span className="holo-stat-val">{thc}%</span>
                                </div>
                            )}
                            {cbd != null && cbd > 0 && (
                                <div className="holo-stat-col">
                                    <span className="holo-stat-lbl holo-stat-lbl--cbd">CBD</span>
                                    <span className="holo-stat-val holo-stat-val--cbd">{cbd}%</span>
                                </div>
                            )}
                        </div>
                        {price != null && (
                            <div className="holo-price">
                                ${price.toFixed(0)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Layout ── */
export default function VapesLayout({ products = [] }) {
    const containerRef = useRef(null);
    const [dim, setDim]         = useState({ W: 0, H: 0 });
    const [safeTop, setSafeTop] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const measure = () => {
            let W = el.offsetWidth;
            let H = el.offsetHeight;
            if (W < 10 || H < 10) {
                const stable = el.closest('main, .app-content') || el.parentElement?.parentElement || el.parentElement;
                if (stable) { W = stable.offsetWidth; H = stable.offsetHeight; }
            }
            if (W > 10 && H > 10) {
                setDim({ W, H });
                setSafeTop(getSafeTop(el));
            }
        };

        const t  = setTimeout(measure, 120);
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        const stable = el.closest('main, .app-content');
        if (stable) ro.observe(stable);
        return () => { clearTimeout(t); ro.disconnect(); };
    }, []);

    const { cardW, cardH } = calcSizes(dim.W, dim.H, products.length, safeTop);

    return (
        <div ref={containerRef} className="holo-scene">
            <div className="holo-bg" />
            <CircuitCanvas W={dim.W} H={dim.H} />
            <div className="holo-ambient-1" />
            <div className="holo-ambient-2" />

            <div
                className="holo-grid"
                style={{
                    paddingTop:    safeTop + PAD_V,
                    paddingBottom: PAD_V,
                    paddingLeft:   PAD_H,
                    paddingRight:  PAD_H,
                    gap:           GAP,
                }}
            >
                {products.map((p, i) => (
                    <VapeCard
                        key={p.id}
                        product={p}
                        cardW={cardW}
                        cardH={cardH}
                        index={i}
                    />
                ))}
            </div>
        </div>
    );
}
