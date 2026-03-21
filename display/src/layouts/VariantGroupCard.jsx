/**
 * VariantGroupCard.jsx — Display card for a variant group
 *
 * Shows a "hero" main product on the left, with a compact scrollable
 * list of its flavor/size variants on the right.
 * Strain-themed glassmorphism styling matching CartridgesLayout palette.
 */

import './VariantGroupCard.css';

const PALETTES = {
    indica: {
        neon: '#a855f7',
        glow: 'rgba(168,85,247,0.45)',
        dim: 'rgba(168,85,247,0.12)',
        border: 'rgba(168,85,247,0.45)',
        grad1: '#a855f7',
        grad2: '#e879f9',
        bar: 'linear-gradient(90deg, #7c3aed, #c084fc)',
        chip: '#d8b4fe',
    },
    sativa: {
        neon: '#f59e0b',
        glow: 'rgba(245,158,11,0.45)',
        dim: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.45)',
        grad1: '#f59e0b',
        grad2: '#fbbf24',
        bar: 'linear-gradient(90deg, #d97706, #fbbf24)',
        chip: '#fde68a',
    },
    hybrid: {
        neon: '#10b981',
        glow: 'rgba(16,185,129,0.45)',
        dim: 'rgba(16,185,129,0.12)',
        border: 'rgba(16,185,129,0.45)',
        grad1: '#10b981',
        grad2: '#34d399',
        bar: 'linear-gradient(90deg, #059669, #34d399)',
        chip: '#a7f3d0',
    },
};

function getStrain(product) {
    const t = (product.type || '').toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

export default function VariantGroupCard({ group, mainProduct, variants, index }) {
    if (!mainProduct) return null;

    const strain = getStrain(mainProduct);
    const pal = PALETTES[strain];
    const thc = Number(mainProduct.thc || 0);
    const prices = [mainProduct, ...variants].map(p => Number(p.price || 0)).filter(Boolean);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const priceLabel = minPrice === maxPrice
        ? `$${minPrice.toFixed(0)}`
        : `$${minPrice.toFixed(0)}–$${maxPrice.toFixed(0)}`;

    const entranceDelay = index * 0.09;
    const floatV = (index % 3) + 1;

    return (
        <div
            className={`vgc vgc--in vgc-float-${floatV}`}
            style={{
                '--vgc-neon': pal.neon,
                '--vgc-glow': pal.glow,
                '--vgc-dim': pal.dim,
                '--vgc-border': pal.border,
                '--vgc-grad1': pal.grad1,
                '--vgc-grad2': pal.grad2,
                '--vgc-bar': pal.bar,
                '--vgc-chip': pal.chip,
                '--entrance-del': `${entranceDelay}s`,
                '--float-del': `${entranceDelay + 0.5}s`,
            }}
        >
            {/* Strain accent line */}
            <div className="vgc-top-line" />

            {/* LEFT — Main product hero */}
            <div className="vgc-hero">
                <div className="vgc-hero-strain">{mainProduct.type || 'HYBRID'}</div>

                <div className="vgc-hero-img-wrap">
                    <div className="vgc-hero-glow" />
                    {mainProduct.imageUrl
                        ? <img src={mainProduct.imageUrl} alt={mainProduct.name} className="vgc-hero-img" loading="lazy" />
                        : <span className="vgc-hero-fallback">💧</span>
                    }
                </div>

                <div className="vgc-hero-brand">{mainProduct.brand || ''}</div>
                <div className="vgc-hero-name">{group.name || mainProduct.name}</div>

                {/* THC bar */}
                <div className="vgc-hero-thc-row">
                    <span className="vgc-hero-thc-label">THC</span>
                    <div className="vgc-hero-thc-track">
                        <div className="vgc-hero-thc-fill" style={{ width: `${Math.min(thc, 100)}%` }} />
                    </div>
                    <span className="vgc-hero-thc-val">{thc}%</span>
                </div>

                <div className="vgc-hero-price">{priceLabel}</div>
                <div className="vgc-hero-count">
                    {variants.length} flavor{variants.length !== 1 ? 's' : ''} available
                </div>
            </div>

            {/* Divider */}
            <div className="vgc-divider" />

            {/* RIGHT — Variants list */}
            <div className="vgc-list-wrap">
                <div className="vgc-list-header">Choose Your Flavor</div>
                <div className="vgc-list">
                    {variants.map((v, vi) => {
                        const vStrain = getStrain(v);
                        return (
                            <div
                                key={v.id}
                                className="vgc-row"
                                style={{ '--vi': vi }}
                            >
                                {v.imageUrl && (
                                    <img src={v.imageUrl} alt="" className="vgc-row-img" loading="lazy" />
                                )}
                                <div className="vgc-row-name">{v.name}</div>
                                <div className="vgc-row-right">
                                    <span className={`vgc-row-strain vgc-row-strain--${vStrain}`}>
                                        {v.thc || 0}%
                                    </span>
                                    <span className="vgc-row-price">${Number(v.price || 0).toFixed(0)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
