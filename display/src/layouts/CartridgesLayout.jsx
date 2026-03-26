/**
 * CartridgesLayout.jsx — "Neon Drop" Cartridges Display
 *
 * Flex-wrap layout with binary-search card sizing and safeTop offset.
 * Mirrors PreRollsLayout pattern. Cards: landscape with large image,
 * THC/CBD bars, effects chips, and prominent price.
 */

import { useRef, useState, useEffect } from 'react';
import './CartridgesLayout.css';

/* ── Layout constants ── */
const GAP    = 16;
const PAD    = 22;
const ASPECT = 1.42; // cardW / cardH

/* ── Strain palettes ── */
const PALETTES = {
    indica: {
        primary:   '#a855f7',
        secondary: '#e879f9',
        dim:       'rgba(168,85,247,0.14)',
        glow:      'rgba(168,85,247,0.52)',
        border:    'rgba(192,132,252,0.38)',
        bar:       'linear-gradient(90deg,#6d28d9,#a855f7,#e879f9)',
        label:     'Indica',
    },
    sativa: {
        primary:   '#f59e0b',
        secondary: '#fde68a',
        dim:       'rgba(245,158,11,0.14)',
        glow:      'rgba(245,158,11,0.52)',
        border:    'rgba(251,191,36,0.38)',
        bar:       'linear-gradient(90deg,#b45309,#f59e0b,#fde68a)',
        label:     'Sativa',
    },
    hybrid: {
        primary:   '#10b981',
        secondary: '#6ee7b7',
        dim:       'rgba(16,185,129,0.14)',
        glow:      'rgba(16,185,129,0.52)',
        border:    'rgba(52,211,153,0.38)',
        bar:       'linear-gradient(90deg,#065f46,#10b981,#6ee7b7)',
        label:     'Hybrid',
    },
};

function getStrain(p) {
    const t = ((p.type || '') + ' ' + (p.name || '')).toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}
function getPalette(p) { return PALETTES[getStrain(p)]; }

/* ── Binary-search sizing ── */
function calcSizes(W, H, count, safeTop) {
    if (!W || !H || count === 0) return { cardW: 260, cardH: 183 };
    const usableH = Math.max(80, H - safeTop - PAD * 2);
    const usableW = Math.max(80, W - PAD * 2);
    const targetRows = count <= 3 ? 1 : count <= 8 ? 2 : 3;
    const cardH = Math.floor((usableH - GAP * (targetRows - 1)) / targetRows);
    let lo = 80, hi = Math.round(cardH * ASPECT);
    for (let iter = 0; iter < 20; iter++) {
        const mid    = (lo + hi) >> 1;
        const perRow = Math.floor((usableW + GAP) / (mid + GAP));
        const rows   = Math.ceil(count / Math.max(1, perRow));
        const fill   = rows * (cardH + GAP) - GAP;
        (fill <= usableH && perRow >= 1) ? (lo = mid) : (hi = mid - 1);
    }
    const cardW = Math.max(120, Math.min(lo, Math.round(cardH * ASPECT)));
    return { cardW, cardH };
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
    return max > 0 ? max + 20 : 0;
}

/* ── Single Cartridge Card ── */
function CartridgeCard({ product, cardW, cardH, index }) {
    const pal       = getPalette(product);
    const thc       = product.thc  != null ? Number(product.thc)  : null;
    const cbd       = product.cbd  != null ? Number(product.cbd)  : null;
    const price     = product.price != null ? Number(product.price) : null;
    const effects   = (product.effects || []).slice(0, 3);
    const cartSize  = product.cartSize || product.size || '';
    const extract   = product.extractType || '';
    const isNew     = (product.badge || '').toLowerCase() === 'new';
    const floatV    = (index % 3) + 1;

    return (
        <div
            className={`cg-card cg-float-${floatV}`}
            style={{
                '--pal-primary':   pal.primary,
                '--pal-secondary': pal.secondary,
                '--pal-dim':       pal.dim,
                '--pal-glow':      pal.glow,
                '--pal-border':    pal.border,
                '--pal-bar':       pal.bar,
                '--entrance-delay': `${index * 0.07}s`,
                '--float-delay':    `${0.9 + index * 0.14}s`,
                width:   cardW,
                height:  cardH,
                flexShrink: 0,
            }}
        >
            {/* Top accent bar */}
            <div className="cg-accent-line" />

            {/* Header row */}
            <div className="cg-header">
                <span className="cg-strain">{pal.label}</span>
                <div className="cg-badges">
                    {cartSize && <span className="cg-badge cg-badge--size">{cartSize}</span>}
                    {extract  && <span className="cg-badge cg-badge--ext">{extract}</span>}
                    {isNew    && <span className="cg-badge cg-badge--new">NEW</span>}
                </div>
            </div>

            {/* Product image */}
            <div className="cg-img-wrap">
                <div className="cg-img-glow" />
                {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="cg-img" loading="lazy" />
                    : <span className="cg-fallback">💧</span>
                }
            </div>

            {/* Data panel */}
            <div className="cg-data">
                {product.brand && <div className="cg-brand">{product.brand}</div>}
                <div className="cg-name">{product.name}</div>

                {thc != null && (
                    <div className="cg-thc-row">
                        <span className="cg-thc-lbl">THC</span>
                        <div className="cg-thc-track">
                            <div className="cg-thc-fill" style={{ width: `${Math.min(thc, 100)}%` }} />
                        </div>
                        <span className="cg-thc-val">{thc}%</span>
                    </div>
                )}

                {cbd != null && cbd > 0 && (
                    <div className="cg-thc-row cg-thc-row--cbd">
                        <span className="cg-thc-lbl">CBD</span>
                        <div className="cg-thc-track">
                            <div className="cg-thc-fill cg-thc-fill--cbd" style={{ width: `${Math.min(cbd * 2, 100)}%` }} />
                        </div>
                        <span className="cg-thc-val cg-thc-val--cbd">{cbd}%</span>
                    </div>
                )}

                {effects.length > 0 && (
                    <div className="cg-effects">
                        {effects.map(e => <span key={e} className="cg-chip">{e}</span>)}
                    </div>
                )}

                <div className="cg-spacer" />
                {price != null && <div className="cg-price">${price.toFixed(2)}</div>}
            </div>
        </div>
    );
}

/* ── Main Layout ── */
export default function CartridgesLayout({ products = [] }) {
    const containerRef  = useRef(null);
    const [dim, setDim]           = useState({ W: 0, H: 0 });
    const [safeTop, setSafeTop]   = useState(0);

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
        <div ref={containerRef} className="cg-scene">
            <div className="cg-bg" />
            <div className="cg-bloom cg-bloom--1" />
            <div className="cg-bloom cg-bloom--2" />
            <div className="cg-bloom cg-bloom--3" />

            <div
                className="cg-cards"
                style={{
                    paddingTop: `${safeTop + PAD}px`,
                    paddingLeft:  PAD,
                    paddingRight: PAD,
                    paddingBottom: PAD,
                    gap: GAP,
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
