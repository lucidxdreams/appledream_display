import { useRef, useState, useEffect } from 'react';
import VariantGroupCard from './VariantGroupCard';
import { useImagePalette } from '../lib/colorExtractor';
import './VariantLayout.css';

const GAP    = 22;
const PAD_H  = 28;
const PAD_V  = 28;
const ASPECT = 0.62;

function getSafeTop(container) {
    if (!container) return 0;
    const stable = container.closest('main, .app-content') || container.parentElement;
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

const PALETTES = {
    indica: { orb1: '#a855f7', orb2: '#c084fc', orb3: '#7e22ce', text: '#f3e8ff', primary: '#d8b4fe', label: 'Indica' },
    sativa: { orb1: '#f59e0b', orb2: '#fcd34d', orb3: '#b45309', text: '#fef3c7', primary: '#fcd34d', label: 'Sativa' },
    hybrid: { orb1: '#14b8a6', orb2: '#5eead4', orb3: '#0f766e', text: '#ccfbf1', primary: '#5eead4', label: 'Hybrid' },
};

function getStrain(product) {
    const t = ((product.type || '') + ' ' + (product.name || '')).toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

const FLOAT_CONFIGS = [
    { dur: '8s', delay: '0s' }, { dur: '9.5s', delay: '-3s' },
    { dur: '7.2s', delay: '-1s' }, { dur: '8.8s', delay: '-5s' },
];

function StandaloneCard({ product, index, isDisposable }) {
    const pal      = PALETTES[getStrain(product)];
    const imgPal   = useImagePalette(product.imageUrl);

    const thc      = Number(product.thc || 0);
    const cbd      = Number(product.cbd || 0);
    const price    = Number(product.price || 0);
    const effects  = (product.effects || []).slice(0, 3);
    const cartSize = product.cartSize || product.size || '';
    const extract  = product.extractType || '';
    const isNew    = (product.badge || '').toLowerCase() === 'new';

    const floatCfg = FLOAT_CONFIGS[index % 4];
    const metaTags = [extract, cartSize, isNew ? 'NEW' : ''].filter(Boolean);

    const orb1 = isDisposable && imgPal ? imgPal.accent : pal.orb1;
    const orb2 = pal.orb1;
    const orb3 = isDisposable && imgPal ? imgPal.saturated : pal.orb3;
    const textCol = isDisposable && imgPal ? imgPal.text : pal.text;
    const priCol = isDisposable && imgPal ? imgPal.accent : pal.primary;

    return (
        <div className={`holo-card ${isDisposable ? 'holo-card--disposable' : ''}`} style={{
            '--pal-o1': orb1, '--pal-o2': orb2, '--pal-o3': orb3,
            '--pal-text': textCol, '--pal-primary': priCol,
            '--entrance-delay': `${index * 0.08}s`,
            '--float-dur': floatCfg.dur, '--float-delay': floatCfg.delay,
        }}>
            <div className="holo-orbs">
                <div className="holo-orb holo-orb-1" />
                <div className="holo-orb holo-orb-2" />
                <div className="holo-orb holo-orb-3" />
            </div>
            <div className="holo-glass-pane" />

            <div className="holo-content-wrapper">
                <div className="holo-meta-top">
                    <span className="holo-strain-pill">{pal.label}</span>
                    {metaTags.length > 0 && <div className="holo-meta-tags">{metaTags.join(' • ')}</div>}
                </div>

                <div className="holo-hero">
                    <div className="holo-hero-shadow" />
                    <div className="holo-img-container">
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="holo-img" loading="lazy" /> : <span className="holo-fallback">💧</span>}
                    </div>
                </div>

                <div className="holo-info">
                    {product.brand && <div className="holo-brand">{product.brand}</div>}
                    <div className="holo-name" title={product.name}>{product.name}</div>
                    {effects.length > 0 && (
                        <div className="holo-effects">
                            {effects.map(e => <span key={e} className="holo-chip">{e}</span>)}
                        </div>
                    )}
                    <div className="holo-data-pane">
                        <div className="holo-data-stats">
                            {thc > 0 && <div className="holo-stat-col"><span className="holo-stat-lbl">THC</span><span className="holo-stat-val">{thc}%</span></div>}
                            {cbd > 0 && <div className="holo-stat-col"><span className="holo-stat-lbl holo-stat-lbl--cbd">CBD</span><span className="holo-stat-val holo-stat-val--cbd">{cbd}%</span></div>}
                        </div>
                        {price > 0 && <div className="holo-price">${price.toFixed(0)}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function calcSizes(W, H, count, safeTop) {
    if (!W || !H || count === 0) return { cardW: 200, cardH: 323 };
    const availW = Math.max(80, W - PAD_H * 2);
    const availH = Math.max(80, H - safeTop - PAD_V * 2);
    const maxCols = Math.min(count, 8);
    let bestCols = Math.max(1, Math.min(count, 2));
    for (let c = 1; c <= maxCols; c++) {
        const rows  = Math.ceil(count / c);
        const cW    = Math.floor((availW - GAP * (c - 1)) / c);
        const cH    = Math.floor((availH - GAP * (rows - 1)) / rows);
        bestCols = c;
        if (cH >= cW) break;
    }
    const cols  = bestCols;
    const rows  = Math.ceil(count / cols);
    const cardW = Math.floor((availW - GAP * (cols - 1)) / cols);
    const rowH  = Math.floor((availH - GAP * (rows - 1)) / rows);
    const cardH = Math.max(rowH, Math.round(cardW * 1.1));
    return { cardW: Math.max(120, cardW), cardH: Math.max(190, Math.min(cardH, Math.round(cardW / ASPECT))) };
}

export default function VariantLayout({ products = [], variantGroups = [], categorySlug }) {
    const containerRef = useRef(null);
    const [dim, setDim]         = useState({ W: 0, H: 0 });
    const [safeTop, setSafeTop] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => {
            let W = el.offsetWidth;
            let H = el.offsetHeight;
            const stable = el.closest('main, .app-content') || el.parentElement;
            if (W < 10 || H < 10) { if (stable) { W = stable.offsetWidth; H = stable.offsetHeight; } }
            if (W > 10 && H > 10) { setDim({ W, H }); setSafeTop(getSafeTop(el)); }
        };
        const t  = setTimeout(measure, 120);
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        const stable = el.closest('main, .app-content');
        if (stable) ro.observe(stable);
        return () => { clearTimeout(t); ro.disconnect(); };
    }, []);

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

    const totalCards = resolvedGroups.length + standalone.length;
    const { cardW, cardH } = calcSizes(dim.W, dim.H, totalCards, safeTop);
    const isDisposable = categorySlug && (categorySlug.includes('disposable') || categorySlug.includes('vape'));

    return (
        <div className="vl2-scene" ref={containerRef}>
            <div className="vl2-bg" />
            <div className="vl2-bloom vl2-bloom--1" />
            <div className="vl2-bloom vl2-bloom--2" />

            <div className="vl2-grid" style={{ paddingTop: safeTop + PAD_V, paddingBottom: PAD_V, paddingLeft: PAD_H, paddingRight: PAD_H, gap: GAP }}>
                {resolvedGroups.map(({ group, mainProduct, variants }, i) => (
                    <div key={group.id} className="vl2-cell" style={{ width: cardW, height: cardH }}>
                        <VariantGroupCard group={group} mainProduct={mainProduct} variants={variants} index={i} isDisposable={isDisposable} />
                    </div>
                ))}
                {standalone.map((product, i) => (
                    <div key={product.id} className="vl2-cell" style={{ width: cardW, height: cardH }}>
                        <StandaloneCard product={product} index={resolvedGroups.length + i} isDisposable={isDisposable} />
                    </div>
                ))}
            </div>
        </div>
    );
}
