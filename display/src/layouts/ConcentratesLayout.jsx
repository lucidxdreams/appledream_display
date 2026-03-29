import { useRef, useState, useEffect, useMemo } from 'react';
import './ConcentratesLayout.css';
import LiquidGoldCanvas from '../components/LiquidGoldCanvas';

const GAP = 20;
const PAD = 30;

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
    return max > 0 ? max + 20 : 0;
}

function simulateRows(n, cw, availW) {
    let rows = 1, rowW = 0;
    for (let i = 0; i < n; i++) {
        if (rowW > 0 && rowW + GAP + cw > availW + 0.5) {
            rows++;
            rowW = cw;
        } else {
            rowW += (rowW > 0 ? GAP : 0) + cw;
        }
    }
    return rows;
}

function calcSizes(n, W, H) {
    if (!n || W < 120 || H < 80) return { cardW: 360, cardH: 180 };

    const availW = W - PAD * 2;
    const availH = H - PAD * 2;

    const targetRows = Math.max(1, Math.ceil(Math.sqrt((n * availH) / (availW * 0.45)))); 

    let cardH = Math.max(120, Math.floor((availH - GAP * (targetRows - 1)) / targetRows));

    let lo = 200, hi = availW;
    while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (simulateRows(n, mid, availW) <= targetRows) lo = mid;
        else hi = mid;
    }
    
    // Clamp Aspect Ratio landscape
    const cardW = Math.max(cardH * 1.6, Math.min(lo, cardH * 2.8));
    
    return { cardW: Math.floor(cardW), cardH: Math.floor(cardH) };
}

function ConcentrateCard({ product, cardW, cardH, index }) {
    const thc = product.thc != null && product.thc > 0 ? Number(product.thc) : null;
    const price = product.price != null ? Number(product.price) : null;
    const weight = product.weight || product.size || '1g';
    const extractType = product.extractType || 'Extract';
    const type = product.type || 'Hybrid';

    // Randomized float offsets so they don't all bob entirely in sync
    const floatDur = 3.5 + (index % 3) * 0.8;
    const floatDelay = (index % 4) * 0.4;

    return (
        <div 
            className="conc-card"
            style={{
                width: cardW,
                height: cardH,
                '--entrance-delay': `${index * 0.08}s`,
                '--float-dur': `${floatDur}s`,
                '--float-delay': `${floatDelay}s`
            }}
        >
            <div className="conc-img-col">
                <div className="conc-pedestal" />
                <div className="conc-img-wrapper">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} className="conc-img" alt={product.name} loading="lazy" />
                    ) : (
                        <span className="conc-fallback">⚗️</span>
                    )}
                </div>
            </div>
            
            <div className="conc-data-col">
                <div className="conc-badge-row">
                    <span className="conc-extract-type">{extractType}</span>
                    <span className="conc-strain-type">{type}</span>
                </div>
                
                {product.brand && <div className="conc-brand">{product.brand}</div>}
                <div className="conc-name">{product.name}</div>
                
                <div className="conc-spacer" />
                
                <div className="conc-bottom-row">
                    <div className="conc-stats-grid">
                        {thc != null && (
                            <div className="conc-stat-box">
                                <span className="conc-stat-lbl">THC</span>
                                <span className="conc-stat-val">{thc}%</span>
                            </div>
                        )}
                        <div className="conc-stat-box">
                            <span className="conc-stat-lbl">WT</span>
                            <span className="conc-stat-val">{weight}</span>
                        </div>
                    </div>
                    
                    {price != null && (
                        <div className="conc-price">${price.toFixed(2)}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ConcentratesLayout({ products = [] }) {
    const containerRef = useRef(null);
    const [dim, setDim] = useState({ W: 0, H: 0 });
    const [safeTop, setSafeTop] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => {
            let W = el.offsetWidth;
            let H = el.offsetHeight;
            if (W < 10 || H < 10) {
                const stable = el.closest('main, .app-content') || el.parentElement;
                if (stable) { W = stable.offsetWidth; H = stable.offsetHeight; }
            }
            if (W > 10 && H > 10) {
                setDim({ W, H });
                setSafeTop(getSafeTop(el));
            }
        };
        const t = setTimeout(measure, 120);
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        const stable = el.closest('main, .app-content');
        if (stable) ro.observe(stable);
        return () => { clearTimeout(t); ro.disconnect(); };
    }, []);

    const { W, H } = dim;
    const usableH = Math.max(80, H - safeTop);

    const sizes = useMemo(
        () => calcSizes(products.length, W, usableH),
        [products.length, W, usableH]
    );

    if (!products.length) {
        return (
            <div className="conc-scene" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LiquidGoldCanvas />
                <p style={{ zIndex: 10, color: '#f59e0b', fontSize: '1.5rem', fontFamily: 'monospace' }}>
                    No concentrates currently available
                </p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="conc-scene">
            <LiquidGoldCanvas />
            
            <div 
                className="conc-grid"
                style={{
                    paddingTop: `${safeTop + PAD}px`,
                    paddingBottom: `${PAD}px`,
                    gap: `${GAP}px`
                }}
            >
                {products.map((product, i) => (
                    <ConcentrateCard 
                        key={product.id || i}
                        product={product}
                        cardW={sizes.cardW}
                        cardH={sizes.cardH}
                        index={i}
                    />
                ))}
            </div>
        </div>
    );
}
