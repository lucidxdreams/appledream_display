/**
 * CartridgesLayout.jsx — "Holo-Fluid Glass" Cartridges Display
 *
 * Completely redesigned:
 * - Fluid gradient orbs morphing inside a deeply frosted glass pane
 * - Continuous zero-gravity float for the main product image
 * - Laser-thin sleek typography and minimalist data presentation
 */

import { useRef, useState, useEffect } from 'react';
import './CartridgesLayout.css';

/* ── Layout constants ── */
const GAP         = 22;
const PAD_H       = 28;
const PAD_V       = 28;
const ASPECT      = 0.62; // cardW / cardH  → portrait
const MAX_CARD_W  = 360;  // cap so 1–3 products never fill the screen
const MAX_CARD_H  = 580;

/* ── Fluid Strain Palettes ── */
const PALETTES = {
    indica: {
        orb1: '#a855f7',
        orb2: '#c084fc',
        orb3: '#7e22ce',
        text: '#f3e8ff',
        primary: '#d8b4fe',
        label: 'Indica',
    },
    sativa: {
        orb1: '#f59e0b',
        orb2: '#fcd34d',
        orb3: '#b45309',
        text: '#fef3c7',
        primary: '#fcd34d',
        label: 'Sativa',
    },
    hybrid: {
        orb1: '#14b8a6',
        orb2: '#5eead4',
        orb3: '#0f766e',
        text: '#ccfbf1',
        primary: '#5eead4',
        label: 'Hybrid',
    },
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
        cardW: Math.max(120, Math.min(cardW, MAX_CARD_W)),
        cardH: Math.max(190, Math.min(cardH, MAX_CARD_H)),
    };
}

/* ── Logo-safe top offset ── */
function getSafeTop(container) {
    if (!container) return 0;
    const stable = container.closest('main, .app-content')
        || container.parentElement?.parentElement
        || container.parentElement;
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

/* ── Float parameters for cards ── */
const FLOAT_CONFIGS = [
    { dur: '8s',  delay: '0s' },
    { dur: '9.5s', delay: '-3s' },
    { dur: '7.2s', delay: '-1s' },
    { dur: '8.8s', delay: '-5s' },
];

/* ── Single Cartridge Card ── */
function CartridgeCard({ product, cardW, cardH, index }) {
    const pal      = getPalette(product);
    const thc      = product.thc  != null ? Number(product.thc)  : null;
    const cbd      = product.cbd  != null ? Number(product.cbd)  : null;
    const price    = product.price != null ? Number(product.price) : null;
    const effects  = (product.effects || []).slice(0, 3);
    const cartSize = product.cartSize || product.size || '';
    const extract  = product.extractType || '';
    const isNew    = (product.badge || '').toLowerCase() === 'new';

    const floatCfg = FLOAT_CONFIGS[index % 4];

    /* Metadata details joined */
    const metaTags = [extract, cartSize, isNew ? 'NEW' : ''].filter(Boolean);

    return (
        <div
            className="holo-card"
            style={{
                '--pal-o1':        pal.orb1,
                '--pal-o2':        pal.orb2,
                '--pal-o3':        pal.orb3,
                '--pal-text':      pal.text,
                '--pal-primary':   pal.primary,
                '--entrance-delay': `${index * 0.08}s`,
                '--float-dur':     floatCfg.dur,
                '--float-delay':   floatCfg.delay,
                width:  cardW,
                height: cardH,
                flexShrink: 0,
            }}
        >
            {/* Fluid Orbs layered inside the card */}
            <div className="holo-orbs">
                <div className="holo-orb holo-orb-1" />
                <div className="holo-orb holo-orb-2" />
                <div className="holo-orb holo-orb-3" />
            </div>

            {/* Inner Glossy Glass Overlay */}
            <div className="holo-glass-pane" />

            {/* Floating content wrapper */}
            <div className="holo-content-wrapper">

                {/* Top Meta Area */}
                <div className="holo-meta-top">
                    <span className="holo-strain-pill">{pal.label}</span>
                    {metaTags.length > 0 && (
                        <div className="holo-meta-tags">
                            {metaTags.join(' • ')}
                        </div>
                    )}
                </div>

                {/* Hero Product Image (Zero-G Float) */}
                <div className="holo-hero">
                    <div className="holo-hero-shadow" />
                    <div className="holo-img-container">
                        {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name} className="holo-img" loading="lazy" />
                            : <span className="holo-fallback">💧</span>
                        }
                    </div>
                </div>

                {/* Bottom info section */}
                <div className="holo-info">
                    {/* Brand line */}
                    {product.brand && <div className="holo-brand">{product.brand}</div>}

                    {/* Product Name */}
                    <div className="holo-name" title={product.name}>{product.name}</div>

                    {/* Minimalist Effects */}
                    {effects.length > 0 && (
                        <div className="holo-effects">
                            {effects.map(e => <span key={e} className="holo-chip">{e}</span>)}
                        </div>
                    )}

                    {/* Sleek Laser Data Pane */}
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
export default function CartridgesLayout({ products = [] }) {
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
                const stable = el.closest('main, .app-content')
                    || el.parentElement?.parentElement
                    || el.parentElement;
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
            {/* Deep Ambient Space */}
            <div className="holo-bg" />
            <div className="holo-ambient-1" />
            <div className="holo-ambient-2" />

            {/* Grid */}
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
                    <CartridgeCard
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
