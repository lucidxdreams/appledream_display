import React, { useState, useEffect, useRef, useMemo } from 'react'
import './PreRollsLayout.css'

export default function PreRollsLayout({ products = [] }) {
    if (!products || products.length === 0) {
        return (
            <div className="prerolls-scene empty-state">
                <div className="empty-message">No pre-rolls currently available</div>
            </div>
        )
    }

    // Sort by name so it's consistent
    const sortedProducts = [...products].sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    const containerRef = useRef(null);
    const [dim, setDim] = useState({ w: window.innerWidth, h: window.innerHeight * 0.84 });

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                if (width > 0 && height > 0) setDim({ w: width, h: height });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const { cols, scale } = useMemo(() => {
        const count = sortedProducts.length || 1;
        const W = dim.w;
        const H = dim.h;
        
        let c = Math.ceil(Math.sqrt(count * (W / H) * (500 / 240)));
        if (c < 2 && count > 1) c = 2;
        if (c > count) c = count;
        
        const r = Math.ceil(count / c);
        const gap = 24;
        const padX = 40;
        const padY = 40;
        
        const avlW = W - padX * 2 - gap * (c - 1);
        const avlH = H - padY * 2 - gap * (r - 1);
        
        const baseW = 240;
        const baseH = 500;
        
        const scaleW = avlW / (c * baseW);
        const scaleH = avlH / (r * baseH);
        const s = Math.min(scaleW, scaleH, 1.25);
        
        return { cols: c, scale: s };
    }, [sortedProducts.length, dim.w, dim.h]);

    return (
        <div className="prerolls-scene" ref={containerRef}>
            <div className="prerolls-grid-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div 
                    className="prerolls-grid"
                    style={{
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                        width: 'auto'
                    }}
                >
                    {sortedProducts.map((item, index) => {
                        const typeColor =
                            item.type === 'Sativa' ? 'var(--sativa, #f39c12)'
                                : item.type === 'Indica' ? 'var(--indica, #8e44ad)'
                                    : 'var(--hybrid, #27ae60)'

                        return (
                            <div
                                key={item.id}
                                className="prerolls-card"
                                style={{
                                    '--strain-color': typeColor,
                                    animationDelay: `${index * 0.05}s`
                                }}
                            >
                                <div className="prerolls-image-wrapper">
                                    <div className="prerolls-glow-backdrop" />
                                    <img
                                        src={item.imageUrl || '/placeholder.png'}
                                        alt={item.name}
                                        className="prerolls-image"
                                    />
                                    {item.badge && <div className="prerolls-badge">{item.badge}</div>}
                                </div>

                                <div className="prerolls-content">
                                    <div className="prerolls-header">
                                        <h3 className="prerolls-brand">{item.brand || 'Premium Brand'}</h3>
                                        <h2 className="prerolls-name">{item.name}</h2>
                                    </div>

                                    <div className="prerolls-pills">
                                        <span className="pill strain" style={{ background: typeColor }}>{item.type || 'Hybrid'}</span>
                                        {item.weight && <span className="pill property">{item.weight}</span>}
                                        {item.thc > 0 && <span className="pill property">THC {item.thc}%</span>}
                                        {item.cbd > 0 && <span className="pill property">CBD {item.cbd}%</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
