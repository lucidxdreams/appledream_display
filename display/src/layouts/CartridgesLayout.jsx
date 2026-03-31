/**
 * CartridgesLayout.jsx — Cartridges Display
 *
 * Simple centered layout — no grid calculation, no ResizeObserver.
 * Cards have a fixed CSS size and sit centered in the display area.
 * More products → they wrap naturally.
 */

import './CartridgesLayout.css';

/* ── Strain Palettes ── */
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

/* ── Float parameters ── */
const FLOAT_CONFIGS = [
    { dur: '8s',  delay: '0s' },
    { dur: '9.5s', delay: '-3s' },
    { dur: '7.2s', delay: '-1s' },
    { dur: '8.8s', delay: '-5s' },
];

/* ── Single Cartridge Card ── */
function CartridgeCard({ product, index }) {
    const pal      = getPalette(product);
    const thc      = product.thc  != null ? Number(product.thc)  : null;
    const cbd      = product.cbd  != null ? Number(product.cbd)  : null;
    const price    = product.price != null ? Number(product.price) : null;
    const effects  = (product.effects || []).slice(0, 3);
    const cartSize = product.cartSize || product.size || '';
    const extract  = product.extractType || '';
    const isNew    = (product.badge || '').toLowerCase() === 'new';
    const floatCfg = FLOAT_CONFIGS[index % 4];
    const metaTags = [extract, cartSize, isNew ? 'NEW' : ''].filter(Boolean);

    return (
        <div
            className="cart-card"
            style={{
                width: 280,
                height: 400,
                flexShrink: 0,
                flexGrow: 0,
                overflow: 'hidden',
                '--pal-o1':        pal.orb1,
                '--pal-o2':        pal.orb2,
                '--pal-o3':        pal.orb3,
                '--pal-text':      pal.text,
                '--pal-primary':   pal.primary,
                '--entrance-delay': `${index * 0.08}s`,
                '--float-dur':     floatCfg.dur,
                '--float-delay':   floatCfg.delay,
            }}
        >
            <div className="cart-orbs">
                <div className="cart-orb cart-orb-1" />
                <div className="cart-orb cart-orb-2" />
                <div className="cart-orb cart-orb-3" />
            </div>
            <div className="cart-glass" />

            <div className="cart-content">
                <div className="cart-meta-top">
                    <span className="cart-strain-pill">{pal.label}</span>
                    {metaTags.length > 0 && (
                        <span className="cart-meta-tags">{metaTags.join(' · ')}</span>
                    )}
                </div>

                <div className="cart-hero" style={{ flex: '1 1 0', minHeight: 0, maxHeight: '43%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div className="cart-img-wrap" style={{ height: '90%', width: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name} className="cart-img" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} loading="lazy" />
                            : <span className="cart-fallback">💧</span>
                        }
                    </div>
                </div>

                <div className="cart-info">
                    {product.brand && <div className="cart-brand">{product.brand}</div>}
                    <div className="cart-name" title={product.name}>{product.name}</div>

                    {effects.length > 0 && (
                        <div className="cart-effects">
                            {effects.map(e => <span key={e} className="cart-chip">{e}</span>)}
                        </div>
                    )}

                    <div className="cart-stats-row">
                        <div className="cart-stats">
                            {thc != null && (
                                <div className="cart-stat">
                                    <span className="cart-stat-lbl">THC</span>
                                    <span className="cart-stat-val">{thc}%</span>
                                </div>
                            )}
                            {cbd != null && cbd > 0 && (
                                <div className="cart-stat">
                                    <span className="cart-stat-lbl cart-stat-lbl--cbd">CBD</span>
                                    <span className="cart-stat-val cart-stat-val--cbd">{cbd}%</span>
                                </div>
                            )}
                        </div>
                        {price != null && (
                            <div className="cart-price">${price.toFixed(0)}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Layout ── */
export default function CartridgesLayout({ products = [] }) {
    return (
        <div className="cart-scene" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <div className="cart-bg" />
            <div className="cart-ambient-1" />
            <div className="cart-ambient-2" />

            <div className="cart-container" style={{
                position: 'relative', zIndex: 2,
                width: '100%', height: '100%',
                display: 'flex', flexWrap: 'wrap',
                alignItems: 'center', alignContent: 'center',
                justifyContent: 'center', gap: 24, padding: 24,
                boxSizing: 'border-box',
            }}>
                {products.map((p, i) => (
                    <CartridgeCard key={p.id} product={p} index={i} />
                ))}
            </div>
        </div>
    );
}
