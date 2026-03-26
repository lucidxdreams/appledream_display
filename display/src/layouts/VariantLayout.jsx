/**
 * VariantLayout.jsx — Category display when variant groups are configured.
 *
 * Renders variant group cards (double-wide) alongside standalone product
 * cards using flex-wrap. Card sizes are computed from available space so
 * cards never stretch to fill empty rows.
 */

import { useRef, useState, useEffect } from 'react';
import VariantGroupCard from './VariantGroupCard';
import './VariantLayout.css';

/* ── Logo-safe top offset (same pattern as CartridgesLayout) ── */
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

/* ── Standalone card — mirrors CartridgesLayout card visuals ── */
const PALETTES = {
    indica: { neon: '#a855f7', glow: 'rgba(168,85,247,0.4)', border: 'rgba(168,85,247,0.4)', bar: 'linear-gradient(90deg,#7c3aed,#c084fc)', grad1: '#a855f7', grad2: '#e879f9' },
    sativa: { neon: '#f59e0b', glow: 'rgba(245,158,11,0.4)',  border: 'rgba(245,158,11,0.4)',  bar: 'linear-gradient(90deg,#d97706,#fbbf24)', grad1: '#f59e0b', grad2: '#fbbf24' },
    hybrid: { neon: '#10b981', glow: 'rgba(16,185,129,0.4)',  border: 'rgba(16,185,129,0.4)',  bar: 'linear-gradient(90deg,#059669,#34d399)', grad1: '#10b981', grad2: '#34d399' },
};

function getStrain(product) {
    const t = (product.type || '').toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

function StandaloneCard({ product, index }) {
    const strain = getStrain(product);
    const pal = PALETTES[strain];
    const thc = Number(product.thc || 0);
    const floatV = (index % 3) + 1;

    return (
        <div
            className={`vl-solo vl-solo--in vl-float-${floatV}`}
            style={{
                '--vl-neon': pal.neon,
                '--vl-glow': pal.glow,
                '--vl-border': pal.border,
                '--vl-bar': pal.bar,
                '--vl-grad1': pal.grad1,
                '--vl-grad2': pal.grad2,
                '--entrance-del': `${index * 0.07}s`,
                '--float-del': `${index * 0.18 + 0.5}s`,
            }}
        >
            <div className="vl-solo-top-line" />
            <div className="vl-solo-strain">{product.type || 'HYBRID'}</div>

            <div className="vl-solo-img-wrap">
                <div className="vl-solo-glow" />
                {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="vl-solo-img" loading="lazy" />
                    : <span className="vl-solo-fallback">💧</span>
                }
            </div>

            <div className="vl-solo-brand">{product.brand || ''}</div>
            <div className="vl-solo-name">{product.name}</div>

            <div className="vl-solo-thc-row">
                <span className="vl-solo-thc-label">THC</span>
                <div className="vl-solo-thc-track">
                    <div className="vl-solo-thc-fill" style={{ width: `${Math.min(thc, 100)}%` }} />
                </div>
                <span className="vl-solo-thc-val">{thc}%</span>
            </div>

            <div className="vl-solo-price">${Number(product.price || 0).toFixed(2)}</div>
        </div>
    );
}

const GAP     = 10;
const PAD_H   = 16;
const PAD_BOT = 16;
const PAD_TOP = 14;

/* ── Main layout ── */
export default function VariantLayout({ products = [], variantGroups = [], categoryTheme }) {
    const containerRef             = useRef(null);
    const [dimW, setDimW]          = useState(0);
    const [dimH, setDimH]          = useState(0);
    const [safeTop, setSafeTop]    = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const measure = () => {
            let W = el.offsetWidth;
            let H = el.offsetHeight;
            const stable = el.closest('main, .app-content') || el.parentElement;
            if (W < 10 || H < 10) {
                if (stable) { W = stable.offsetWidth; H = stable.offsetHeight; }
            }
            if (W > 10 && H > 10) {
                setDimW(W);
                setDimH(H);
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

    // Collect product IDs assigned to an enabled group
    const groupedIds = new Set();
    variantGroups.forEach(g => {
        if (g.enabled === false) return;
        if (g.mainProductId) groupedIds.add(g.mainProductId);
        (g.variantIds || []).forEach(id => groupedIds.add(id));
    });

    const standalone = products.filter(p => !groupedIds.has(p.id));

    const resolvedGroups = variantGroups
        .filter(g => g.enabled !== false && g.mainProductId)
        .map(g => ({
            group: g,
            mainProduct: products.find(p => p.id === g.mainProductId),
            variants: (g.variantIds || []).map(id => products.find(p => p.id === id)).filter(Boolean),
        }))
        .filter(g => g.mainProduct);

    // ── Compute card sizes from available space (no grid, no stretching) ──
    const totalSlots = resolvedGroups.length * 2 + standalone.length;
    const cols       = dimW < 900 ? 2 : dimW < 1400 ? 4 : 5;
    const availW     = Math.max(0, dimW - 2 * PAD_H);
    const availH     = Math.max(0, dimH - safeTop - PAD_TOP - PAD_BOT);
    const rows       = Math.max(1, Math.ceil(totalSlots / cols));

    // card width: divide available width evenly
    const cardW  = dimW > 0 ? Math.floor((availW - GAP * (cols - 1)) / cols) : 200;
    // group card is exactly 2 solo columns wide
    const groupW = 2 * cardW + GAP;
    // card height: divide available height by number of rows — no min clamp
    const cardH  = dimH > 0
        ? Math.min(260, Math.floor((availH - GAP * Math.max(0, rows - 1)) / rows))
        : 200;

    return (
        <div className="vl-scene" ref={containerRef}>
            <div className="vl-bg" />
            <div className="vl-bloom vl-bloom--1" />
            <div className="vl-bloom vl-bloom--2" />

            <div className="vl-cards" style={{ paddingTop: safeTop + PAD_TOP }}>
                {resolvedGroups.map(({ group, mainProduct, variants }, i) => (
                    <div
                        key={group.id}
                        className="vl-group-cell"
                        style={{ width: groupW, height: cardH }}
                    >
                        <VariantGroupCard
                            group={group}
                            mainProduct={mainProduct}
                            variants={variants}
                            index={i}
                        />
                    </div>
                ))}

                {standalone.map((product, i) => (
                    <div
                        key={product.id}
                        className="vl-solo-cell"
                        style={{ width: cardW, height: cardH }}
                    >
                        <StandaloneCard
                            product={product}
                            index={resolvedGroups.length + i}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
