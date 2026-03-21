/**
 * VariantLayout.jsx — Category display when variant groups are configured.
 *
 * Renders variant group cards (wide, hero + flavor list) alongside any
 * standalone products (products not assigned to any group) using a
 * responsive CSS grid. No D3 force needed — the grid handles placement.
 */

import { useRef, useState, useEffect } from 'react';
import VariantGroupCard from './VariantGroupCard';
import './VariantLayout.css';

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

/* ── Main layout ── */
export default function VariantLayout({ products = [], variantGroups = [], categoryTheme }) {
    const containerRef = useRef(null);
    const [cols, setCols] = useState(3);

    // Measure container width to decide column count
    useEffect(() => {
        if (!containerRef.current) return;
        const measure = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth || 1280;
            // Each solo card ~165px, group card ~2x = 330px. Pick cols to fill.
            setCols(w < 900 ? 2 : w < 1400 ? 4 : 5);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // Collect product IDs that are assigned to an enabled group
    const groupedIds = new Set();
    variantGroups.forEach(g => {
        if (g.enabled === false) return;
        if (g.mainProductId) groupedIds.add(g.mainProductId);
        (g.variantIds || []).forEach(id => groupedIds.add(id));
    });

    // Standalone products (not in any active group)
    const standalone = products.filter(p => !groupedIds.has(p.id));

    // Resolve active groups to real product objects
    const resolvedGroups = variantGroups
        .filter(g => g.enabled !== false && g.mainProductId)
        .map(g => ({
            group: g,
            mainProduct: products.find(p => p.id === g.mainProductId),
            variants: (g.variantIds || []).map(id => products.find(p => p.id === id)).filter(Boolean),
        }))
        .filter(g => g.mainProduct);

    return (
        <div className="vl-scene" ref={containerRef} style={{ '--vl-cols': cols }}>
            <div className="vl-bg" />
            <div className="vl-bloom vl-bloom--1" />
            <div className="vl-bloom vl-bloom--2" />

            <div className="vl-grid">
                {/* Variant group cards — each spans 2 columns */}
                {resolvedGroups.map(({ group, mainProduct, variants }, i) => (
                    <div key={group.id} className="vl-group-cell">
                        <VariantGroupCard
                            group={group}
                            mainProduct={mainProduct}
                            variants={variants}
                            index={i}
                        />
                    </div>
                ))}

                {/* Standalone product cards — each spans 1 column */}
                {standalone.map((product, i) => (
                    <div key={product.id} className="vl-solo-cell">
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
