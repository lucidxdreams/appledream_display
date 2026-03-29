import { useState, useEffect } from 'react';
import { useImagePalette } from '../lib/colorExtractor';
import './VariantGroupCard.css';

const PALETTES = {
    indica: { orb1: '#a855f7', orb2: '#c084fc', orb3: '#7e22ce', text: '#f3e8ff', primary: '#d8b4fe', label: 'Indica' },
    sativa: { orb1: '#f59e0b', orb2: '#fcd34d', orb3: '#b45309', text: '#fef3c7', primary: '#fcd34d', label: 'Sativa' },
    hybrid: { orb1: '#14b8a6', orb2: '#5eead4', orb3: '#0f766e', text: '#ccfbf1', primary: '#5eead4', label: 'Hybrid' },
};

const STRAIN_DOT = { indica: '#a855f7', sativa: '#f59e0b', hybrid: '#14b8a6' };

function getStrain(p) {
    const t = ((p.type || '') + ' ' + (p.name || '')).toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

const FLOAT_CONFIGS = [
    { dur: '8s', delay: '0s' }, { dur: '9.5s', delay: '-3s' },
    { dur: '7.2s', delay: '-1s' }, { dur: '8.8s', delay: '-5s' },
];

export default function VariantGroupCard({ group, mainProduct, variants, index, isDisposable }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [anim, setAnim]           = useState('idle');

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

    // Make sure useImagePalette is called at root level before any `if` returns
    // In React hooks must be called in same order. 
    // Fallback if no mainProduct is theoretically possible but we must call the hook unconditionally.
    const imgUrl = mainProduct?.imageUrl;
    const imgPal = useImagePalette(imgUrl);

    if (!mainProduct) return null;

    const strain = getStrain(mainProduct);
    const pal    = PALETTES[strain];
    const thc    = Number(mainProduct.thc || 0);
    const prices = [mainProduct, ...variants].map(p => Number(p.price || 0)).filter(Boolean);
    const minP   = prices.length ? Math.min(...prices) : 0;
    const maxP   = prices.length ? Math.max(...prices) : 0;
    const priceRange = minP === maxP
        ? `$${minP.toFixed(0)}`
        : `$${minP.toFixed(0)} – $${maxP.toFixed(0)}`;

    const effects = (mainProduct.effects || []).slice(0, 3);
    const delay  = index * 0.09;
    
    const active  = variants[activeIdx] ?? variants[0];
    const vStrain = active ? getStrain(active) : 'hybrid';
    const vDot    = STRAIN_DOT[vStrain];
    
    const floatCfg = FLOAT_CONFIGS[index % 4];

    const orb1 = isDisposable && imgPal ? imgPal.accent : pal.orb1;
    const orb2 = pal.orb1;
    const orb3 = isDisposable && imgPal ? imgPal.saturated : pal.orb3;
    const textCol = isDisposable && imgPal ? imgPal.text : pal.text;
    const priCol = isDisposable && imgPal ? imgPal.accent : pal.primary;

    return (
        <div
            className={`vgc2 ${isDisposable ? 'vgc2--disposable' : ''}`}
            style={{
                '--vgc-o1':        orb1,
                '--vgc-o2':        orb2,
                '--vgc-o3':        orb3,
                '--vgc-text':      textCol,
                '--vgc-primary':   priCol,
                '--entrance-del':  `${delay}s`,
                '--float-dur':     floatCfg.dur,
                '--float-delay':   floatCfg.delay,
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
                    <div className="holo-meta-tags">{variants.length} variant{variants.length !== 1 ? 's' : ''}</div>
                </div>

                <div className="holo-hero">
                    <div className="holo-hero-shadow" />
                    <div className="holo-img-container">
                        {mainProduct.imageUrl
                            ? <img src={mainProduct.imageUrl} alt={mainProduct.name} className="holo-img" loading="lazy" />
                            : <span className="vgc2-fallback">💧</span>
                        }
                    </div>
                </div>

                <div className="holo-info">
                    {mainProduct.brand && <div className="vgc2-brand">{mainProduct.brand}</div>}
                    <div className="vgc2-name">{group.name || mainProduct.name}</div>

                    {effects.length > 0 && (
                        <div className="holo-effects">
                            {effects.map(e => <span key={e} className="holo-chip">{e}</span>)}
                        </div>
                    )}

                    <span className="vgc2-price-range">{priceRange}</span>
                </div>

                {variants.length > 0 && (
                    <div className="vgc2-slot">
                        <div className="vgc2-slot-mask vgc2-slot-mask--top" />
                        <div className="vgc2-slot-mask vgc2-slot-mask--bot" />

                        <div className={`vgc2-slot-row vgc2-slot-${anim}`}>
                            <span className="vgc2-vdot" style={{ '--dot': vDot }} />
                            <span className="vgc2-vname">{active?.name}</span>
                            <span className="vgc2-vthc">{active?.thc != null ? `${active.thc}%` : ''}</span>
                            <span className="vgc2-vprice">${Number(active?.price || 0).toFixed(0)}</span>
                        </div>

                        {variants.length > 1 && (
                            <div className="vgc2-pips">
                                {variants.slice(0, 10).map((_, i) => (
                                    <span key={i} className={`vgc2-pip${i === activeIdx ? ' vgc2-pip--on' : ''}`} />
                                ))}
                                {variants.length > 10 && <span className="vgc2-pip-more">+{variants.length - 10}</span>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
