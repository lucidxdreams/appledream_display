/**
 * VariantGroupCard.jsx — Variant group card with 3D cycling slot
 *
 * Looks like a normal CartridgeCard but with a 3D flip-slot at the bottom
 * that automatically cycles through all variants one by one.
 */

import { useState, useEffect } from 'react';
import './VariantGroupCard.css';

const PALETTES = {
    indica: {
        primary:   '#a855f7',
        secondary: '#e879f9',
        dim:       'rgba(168,85,247,0.13)',
        glow:      'rgba(168,85,247,0.50)',
        border:    'rgba(192,132,252,0.36)',
        bar:       'linear-gradient(90deg,#6d28d9,#a855f7,#e879f9)',
        label:     'Indica',
    },
    sativa: {
        primary:   '#f59e0b',
        secondary: '#fde68a',
        dim:       'rgba(245,158,11,0.13)',
        glow:      'rgba(245,158,11,0.50)',
        border:    'rgba(251,191,36,0.36)',
        bar:       'linear-gradient(90deg,#b45309,#f59e0b,#fde68a)',
        label:     'Sativa',
    },
    hybrid: {
        primary:   '#10b981',
        secondary: '#6ee7b7',
        dim:       'rgba(16,185,129,0.13)',
        glow:      'rgba(16,185,129,0.50)',
        border:    'rgba(52,211,153,0.36)',
        bar:       'linear-gradient(90deg,#065f46,#10b981,#6ee7b7)',
        label:     'Hybrid',
    },
};

const STRAIN_DOT = { indica: '#a855f7', sativa: '#f59e0b', hybrid: '#10b981' };

function getStrain(p) {
    const t = ((p.type || '') + ' ' + (p.name || '')).toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

export default function VariantGroupCard({ group, mainProduct, variants, index }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [anim, setAnim]           = useState('idle'); // 'idle' | 'exit' | 'enter'

    useEffect(() => {
        if (variants.length < 1) return;
        const CYCLE  = 3800;
        const EXIT   = 320;
        const SETTLE = 400;
        let t1, t2;
        const id = setInterval(() => {
            setAnim('exit');
            t1 = setTimeout(() => {
                setActiveIdx(i => (i + 1) % variants.length);
                setAnim('enter');
                t2 = setTimeout(() => setAnim('idle'), SETTLE);
            }, EXIT);
        }, CYCLE);
        return () => { clearInterval(id); clearTimeout(t1); clearTimeout(t2); };
    }, [variants.length]);

    if (!mainProduct) return null;

    const strain = getStrain(mainProduct);
    const pal    = PALETTES[strain];
    const thc    = Number(mainProduct.thc || 0);

    const prices     = [mainProduct, ...variants].map(p => Number(p.price || 0)).filter(Boolean);
    const minP       = prices.length ? Math.min(...prices) : 0;
    const maxP       = prices.length ? Math.max(...prices) : 0;
    const priceRange = minP === maxP ? `$${minP.toFixed(0)}` : `$${minP.toFixed(0)} – $${maxP.toFixed(0)}`;

    const floatV = (index % 3) + 1;
    const delay  = index * 0.09;

    const active  = variants[activeIdx] ?? variants[0];
    const vStrain = active ? getStrain(active) : 'hybrid';
    const vDot    = STRAIN_DOT[vStrain];

    return (
        <div
            className={`vgc vgc-float-${floatV}`}
            style={{
                '--vgc-primary':   pal.primary,
                '--vgc-secondary': pal.secondary,
                '--vgc-dim':       pal.dim,
                '--vgc-glow':      pal.glow,
                '--vgc-border':    pal.border,
                '--vgc-bar':       pal.bar,
                '--entrance-del':  `${delay}s`,
                '--float-del':     `${delay + 0.5}s`,
            }}
        >
            {/* Top accent */}
            <div className="vgc-accent" />

            {/* Header */}
            <div className="vgc-header">
                <span className="vgc-strain">{pal.label}</span>
                <div className="vgc-header-right">
                    <span className="vgc-var-count">{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
                    <span className="vgc-price-range">{priceRange}</span>
                </div>
            </div>

            {/* Hero image */}
            <div className="vgc-img-wrap">
                <div className="vgc-img-glow" />
                {mainProduct.imageUrl
                    ? <img src={mainProduct.imageUrl} alt={mainProduct.name} className="vgc-img" loading="lazy" />
                    : <span className="vgc-fallback">💧</span>
                }
            </div>

            {/* Product data */}
            <div className="vgc-data">
                {mainProduct.brand && <div className="vgc-brand">{mainProduct.brand}</div>}
                <div className="vgc-name">{group.name || mainProduct.name}</div>
                {thc > 0 && (
                    <div className="vgc-thc-row">
                        <span className="vgc-thc-lbl">THC</span>
                        <div className="vgc-thc-track">
                            <div className="vgc-thc-fill" style={{ width: `${Math.min(thc, 100)}%` }} />
                        </div>
                        <span className="vgc-thc-val">{thc}%</span>
                    </div>
                )}
            </div>

            {/* ── 3-D variant slot ── */}
            {variants.length > 0 && (
                <div className="vgc-slot">
                    {/* Slot window — top + bottom fade masks */}
                    <div className="vgc-slot-mask vgc-slot-mask--top" />
                    <div className="vgc-slot-mask vgc-slot-mask--bot" />

                    {/* The cycling row */}
                    <div className={`vgc-slot-row vgc-slot-${anim}`}>
                        <span className="vgc-vdot" style={{ '--dot': vDot }} />
                        <span className="vgc-vname">{active?.name}</span>
                        <span className="vgc-vthc">{active?.thc != null ? `${active.thc}%` : ''}</span>
                        <span className="vgc-vprice">${Number(active?.price || 0).toFixed(0)}</span>
                    </div>

                    {/* Progress pips */}
                    {variants.length > 1 && (
                        <div className="vgc-pips">
                            {variants.slice(0, 10).map((_, i) => (
                                <span key={i} className={`vgc-pip${i === activeIdx ? ' vgc-pip--on' : ''}`} />
                            ))}
                            {variants.length > 10 && <span className="vgc-pip-more">+{variants.length - 10}</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
