/**
 * PreRollsLayout.jsx — "Ember" Pre-Rolls Display
 *
 * Architecture:
 *   • Flex-wrap container — no CSS grid, no absolute card positioning.
 *   • Smart sizing: calcSizes() simulates flex-wrap row fills to find the
 *     optimal column count so cards fill the display area without scrolling.
 *   • Badge products render at BADGE_W_MULT × wider and BADGE_H_MULT × taller
 *     than standard cards — they immediately draw the eye.
 *   • EmberCanvas: ambient drifting ember particles in the background.
 *   • All product details rendered: brand, name, strain, THC, CBD, weight, price.
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import './PreRollsLayout.css';

/* ── Strain → colour palette ──────────────────────────────────────── */
const PALETTES = {
    sativa: {
        primary:   '#f59e0b',
        secondary: '#fde68a',
        dim:       'rgba(245,158,11,0.15)',
        glow:      'rgba(245,158,11,0.50)',
        border:    'rgba(251,191,36,0.40)',
        bar:       'linear-gradient(90deg,#d97706,#fbbf24,#fde68a)',
        label:     'Sativa',
    },
    indica: {
        primary:   '#a855f7',
        secondary: '#e879f9',
        dim:       'rgba(168,85,247,0.15)',
        glow:      'rgba(168,85,247,0.50)',
        border:    'rgba(192,132,252,0.40)',
        bar:       'linear-gradient(90deg,#7c3aed,#a855f7,#e879f9)',
        label:     'Indica',
    },
    hybrid: {
        primary:   '#10b981',
        secondary: '#6ee7b7',
        dim:       'rgba(16,185,129,0.15)',
        glow:      'rgba(16,185,129,0.50)',
        border:    'rgba(52,211,153,0.40)',
        bar:       'linear-gradient(90deg,#059669,#10b981,#6ee7b7)',
        label:     'Hybrid',
    },
    cbd: {
        primary:   '#38bdf8',
        secondary: '#bae6fd',
        dim:       'rgba(56,189,248,0.15)',
        glow:      'rgba(56,189,248,0.50)',
        border:    'rgba(125,211,252,0.40)',
        bar:       'linear-gradient(90deg,#0284c7,#38bdf8,#bae6fd)',
        label:     'CBD',
    },
};

function getStrain(product) {
    const t = ((product.type || '') + ' ' + (product.name || '')).toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    if (t.includes('cbd'))    return 'cbd';
    return 'hybrid';
}

function getPalette(product) {
    return PALETTES[getStrain(product)];
}

/* ── Ember particle canvas ─────────────────────────────────────────── */
function EmberCanvas({ W, H }) {
    const canvasRef = useRef(null);
    const rafRef    = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !W || !H) return;

        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const COUNT = 52;
        const embers = Array.from({ length: COUNT }, () => ({
            x:      Math.random() * W,
            y:      H + Math.random() * 60,
            r:      0.7 + Math.random() * 2.0,
            vy:     -(0.22 + Math.random() * 0.48),
            vx:     (Math.random() - 0.5) * 0.30,
            alpha:  0.1 + Math.random() * 0.6,
            dAlpha: 0.003 + Math.random() * 0.005,
            hue:    24 + Math.random() * 38,
        }));

        function draw() {
            ctx.clearRect(0, 0, W, H);
            for (const e of embers) {
                e.y  += e.vy;
                e.x  += e.vx;
                e.alpha += e.dAlpha;
                if (e.alpha >= 0.85 || e.alpha <= 0.05) e.dAlpha *= -1;
                if (e.y < -12) {
                    e.y = H + 8;
                    e.x = Math.random() * W;
                    e.alpha = 0.1 + Math.random() * 0.5;
                }

                const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3);
                g.addColorStop(0,   `hsla(${e.hue},95%,78%,${e.alpha})`);
                g.addColorStop(0.4, `hsla(${e.hue},88%,55%,${e.alpha * 0.5})`);
                g.addColorStop(1,   `hsla(${e.hue},80%,38%,0)`);
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.r * 3, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
            }
            rafRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [W, H]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position:      'absolute',
                inset:         0,
                pointerEvents: 'none',
                zIndex:        0,
                width:         W,
                height:        H,
            }}
        />
    );
}

/* ── Smart sizing — binary-search approach ────────────────────────── */
const BADGE_W_MULT = 1.78;
const BADGE_H_MULT = 1.42;
const GAP          = 16;
const PAD          = 22;

/* Safe-top: how far the logo / header children visually intrude
   into the layout container.
   We reference the stable app-content ancestor so GSAP transforms
   on the scene itself don't corrupt the measurement.             */
function getSafeTop(container) {
    if (!container) return 0;
    /* Walk up to the first stable ancestor (not GSAP-animated) */
    const stable = container.closest('main, .app-content') ||
                   container.parentElement?.parentElement ||
                   container.parentElement;
    const refTop = stable ? stable.getBoundingClientRect().top : 0;
    let max = 0;
    ['.app-header-center', '.app-logo', '.app-header-meta'].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            const b = el.getBoundingClientRect().bottom;
            if (b > refTop) max = Math.max(max, b - refTop);
        });
    });
    return max > 0 ? max + 20 : 0; /* +20 breathing gap */
}

/* How many flex-wrap rows would `cw`-wide cards produce? */
function simulateRows(products, cw, availW) {
    let rows = 1, rowW = 0;
    for (const p of products) {
        const pw = p.badge ? cw * BADGE_W_MULT : cw;
        if (rowW > 0 && rowW + GAP + pw > availW + 0.5) {
            rows++;
            rowW = pw;
        } else {
            rowW += (rowW > 0 ? GAP : 0) + pw;
        }
    }
    return rows;
}

function calcSizes(products, W, H) {
    const n = products.length;
    if (!n || W < 120 || H < 80) {
        return { cardW: 218, cardH: 330, badgeW: 388, badgeH: 469 };
    }

    const availW = W - PAD * 2;
    const availH = H - PAD * 2;
    const hasBadge = products.some(p => p.badge);

    /* Target row count based on product count */
    const targetRows = n <= 4 ? 1 : n <= 10 ? 2 : 3;

    /* Card height that exactly fills availH in targetRows rows.
       If there's a badge card, cap so it doesn't overflow.       */
    let cardH = Math.round((availH - GAP * (targetRows - 1)) / targetRows);
    if (hasBadge) cardH = Math.min(cardH, Math.round(availH / BADGE_H_MULT));
    cardH = Math.max(cardH, 140);

    /* Binary search: largest cardW where flex-wrap rows ≤ targetRows.
       Upper bound: badge card must still fit alone on one row.     */
    const maxBadgeW = Math.floor(availW * 0.92);
    let lo = 100, hi = Math.min(Math.floor(availW * 0.85),
                                 Math.floor(maxBadgeW / BADGE_W_MULT));

    while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (simulateRows(products, mid, availW) <= targetRows) lo = mid;
        else hi = mid;
    }

    /* Cap aspect ratio so cards stay portrait-ish (max w/h = 1.5) */
    const cardW = Math.max(100, Math.min(lo, Math.round(cardH * 1.5)));

    return {
        cardW,
        cardH,
        badgeW: Math.round(cardW * BADGE_W_MULT),
        badgeH: Math.round(cardH * BADGE_H_MULT),
    };
}

/* ── Pre-Roll Card — 2-column: image | data ───────────────────────── */
function PreRollCard({ product, cardW, cardH, isBadge, index }) {
    const pal      = getPalette(product);
    const thc      = product.thc   != null ? Number(product.thc)   : null;
    const cbd      = product.cbd   != null ? Number(product.cbd)   : null;
    const price    = product.price != null ? Number(product.price) : null;
    const weight   = product.weight || product.size || '';
    const floatV   = (index % 3) + 1;
    const badgeTxt = (product.badge || '').toLowerCase();
    const badgeMod = badgeTxt === 'new' ? 'new' : badgeTxt === 'hot' ? 'hot' : 'feat';
    const hasStats = thc != null || (cbd != null && cbd > 0) || weight;

    return (
        <div
            className={`pr-c-card pr-c-float-${floatV}${isBadge ? ' pr-c-card--badge' : ''}`}
            style={{
                '--pal-primary':    pal.primary,
                '--pal-secondary':  pal.secondary,
                '--pal-dim':        pal.dim,
                '--pal-glow':       pal.glow,
                '--pal-border':     pal.border,
                '--pal-bar':        pal.bar,
                '--entrance-delay': `${index * 0.07}s`,
                '--float-delay':    `${0.9 + index * 0.14}s`,
                width:      cardW,
                height:     cardH,
                flexShrink: 0,
            }}
        >
            {/* ── LEFT: full-height image panel ─────────────── */}
            <div className="pr-c-img-panel">
                <div className="pr-c-img-aura" />
                {product.imageUrl
                    ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="pr-c-img"
                            loading="lazy"
                        />
                    )
                    : <span className="pr-c-fallback">🌿</span>
                }
                <div className="pr-c-img-fade" />
            </div>

            {/* ── DIVIDER ───────────────────────────────────── */}
            <div className="pr-c-divider" />

            {/* ── RIGHT: data panel ─────────────────────────── */}
            <div className="pr-c-data">
                {/* Strain pill + optional badge chip */}
                <div className="pr-c-data-top">
                    <span className="pr-c-strain">{pal.label}</span>
                    {product.badge && (
                        <span className={`pr-c-chip pr-c-chip--${badgeMod}`}>
                            {product.badge}
                        </span>
                    )}
                </div>

                {/* Brand */}
                {product.brand && (
                    <div className="pr-c-brand">{product.brand}</div>
                )}

                {/* Product name */}
                <div className="pr-c-name">{product.name}</div>

                {/* Spacer → pushes stats + price to bottom */}
                <div className="pr-c-spacer" />

                {/* Stat pills: THC / CBD / weight */}
                {hasStats && (
                    <div className="pr-c-stats">
                        {thc != null && (
                            <div className="pr-c-stat">
                                <span className="pr-c-stat-lbl">THC</span>
                                <span className="pr-c-stat-val">{thc}%</span>
                            </div>
                        )}
                        {cbd != null && cbd > 0 && (
                            <div className="pr-c-stat">
                                <span className="pr-c-stat-lbl">CBD</span>
                                <span className="pr-c-stat-val">{cbd}%</span>
                            </div>
                        )}
                        {weight && (
                            <div className="pr-c-stat pr-c-stat--wt">
                                <span className="pr-c-stat-lbl">WT</span>
                                <span className="pr-c-stat-val">{weight}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Price */}
                {price != null && (
                    <div className="pr-c-price">${price.toFixed(2)}</div>
                )}
            </div>
        </div>
    );
}

/* ── Main Layout ───────────────────────────────────────────────────── */
export default function PreRollsLayout({ products = [] }) {
    const containerRef = useRef(null);
    const [dim, setDim]         = useState({ W: 0, H: 0 });
    const [safeTop, setSafeTop] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => {
            /* offsetWidth/offsetHeight are NOT affected by GSAP scale transforms.
               getBoundingClientRect() would return 0 when scale:0 is active.   */
            let W = el.offsetWidth;
            let H = el.offsetHeight;
            /* Fallback: walk up to the nearest stable ancestor */
            if (W < 10 || H < 10) {
                const stable = el.closest('main, .app-content') ||
                               el.parentElement?.parentElement ||
                               el.parentElement;
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
        /* Also watch the stable ancestor for resize */
        const stable = el.closest('main, .app-content');
        if (stable) ro.observe(stable);
        return () => { clearTimeout(t); ro.disconnect(); };
    }, []);

    const { W, H } = dim;
    /* Effective usable height below the logo */
    const usableH = Math.max(80, H - safeTop);

    const badgeKey = products.map(p => p.badge ? '1' : '0').join('');
    const sizes = useMemo(
        () => calcSizes(products, W, usableH),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [products.length, badgeKey, W, usableH]
    );

    if (!products.length) {
        return (
            <div className="pr-c-scene pr-c-empty">
                <p className="pr-c-empty-msg">No pre-rolls currently available</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="pr-c-scene">
            {/* Layered background */}
            <div className="pr-c-bg" />
            <EmberCanvas W={W} H={H} />
            <div className="pr-c-bloom pr-c-bloom--1" />
            <div className="pr-c-bloom pr-c-bloom--2" />

            {/* Flex-wrap card container — no grid, no absolute positioning */}
            <div
                className="pr-c-cards"
                style={{
                    '--pr-gap': `${GAP}px`,
                    '--pr-pad': `${PAD}px`,
                    paddingTop: `${safeTop + PAD}px`,
                }}
            >
                {products.map((product, i) => {
                    const isBadge = Boolean(product.badge);
                    return (
                        <PreRollCard
                            key={product.id ?? i}
                            product={product}
                            cardW={isBadge ? sizes.badgeW : sizes.cardW}
                            cardH={isBadge ? sizes.badgeH : sizes.cardH}
                            isBadge={isBadge}
                            index={i}
                        />
                    );
                })}
            </div>
        </div>
    );
}
