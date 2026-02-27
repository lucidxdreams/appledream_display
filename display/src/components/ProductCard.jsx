/**
 * ProductCard.jsx
 * 
 * Glassmorphism product card with animated glow rim.
 * Cycles info every 7s: Image+Name+Price → THC/CBD → Terpenes/Effects
 * 
 * Props:
 *   product: Firestore product object
 *   size: number (diameter in px for circle/hex, or px width for others)
 *   variant: 'circle' | 'hex' | 'vertical' | 'standard'
 */

import { useState, useEffect, useRef } from 'react';
import './ProductCard.css';

const INFO_LAYERS = ['main', 'stats', 'terpenes'];
const CYCLE_MS = 7000;

function formatPrice(price) {
    if (price == null) return '';
    return `$${Number(price).toFixed(2)}`;
}

/* ── Circle Variant ────────────────────────────────────────────────────── */
function CircleCard({ product, size, layer }) {
    const diameter = size || 180;
    return (
        <div
            className="pc-circle glass-card pc-glow-rim"
            style={{ width: diameter, height: diameter }}
        >
            <div className="pc-circle__inner">
                {layer === 'main' && (
                    <div className="pc-layer pc-layer--main">
                        {product.imageUrl && (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="pc-img pc-img--circle"
                            />
                        )}
                        <p className="pc-name">{product.name}</p>
                        <p className="pc-price">{formatPrice(product.price)}</p>
                    </div>
                )}
                {layer === 'stats' && (
                    <div className="pc-layer pc-layer--stats">
                        {product.thc != null && (
                            <div className="pc-stat">
                                <span className="pc-stat__label">THC</span>
                                <span className="pc-stat__value">{product.thc}%</span>
                            </div>
                        )}
                        {product.cbd != null && (
                            <div className="pc-stat">
                                <span className="pc-stat__label">CBD</span>
                                <span className="pc-stat__value">{product.cbd}%</span>
                            </div>
                        )}
                        {product.strainType && (
                            <span className="pc-badge">{product.strainType}</span>
                        )}
                    </div>
                )}
                {layer === 'terpenes' && (
                    <div className="pc-layer pc-layer--terpenes">
                        {product.terpenes?.length > 0 && (
                            <p className="pc-terpenes">{product.terpenes.join(' · ')}</p>
                        )}
                        {product.effects?.length > 0 && (
                            <p className="pc-effects">{product.effects.join(' · ')}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Hex Variant ───────────────────────────────────────────────────────── */
function HexCard({ product, size, layer }) {
    const s = size || 160;
    return (
        <div className="pc-hex-wrapper" style={{ width: s, height: s * 1.15 }}>
            <div className="pc-hex glass-card pc-glow-rim">
                <div className="pc-hex__inner">
                    {layer === 'main' && (
                        <div className="pc-layer pc-layer--main">
                            {product.imageUrl && (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="pc-img pc-img--hex"
                                />
                            )}
                            <p className="pc-name pc-name--sm">{product.name}</p>
                            <p className="pc-price">{formatPrice(product.price)}</p>
                        </div>
                    )}
                    {layer === 'stats' && (
                        <div className="pc-layer pc-layer--stats">
                            {product.thc != null && (
                                <div className="pc-stat">
                                    <span className="pc-stat__label">THC</span>
                                    <span className="pc-stat__value">{product.thc}%</span>
                                </div>
                            )}
                            {product.cbd != null && (
                                <div className="pc-stat">
                                    <span className="pc-stat__label">CBD</span>
                                    <span className="pc-stat__value">{product.cbd}%</span>
                                </div>
                            )}
                        </div>
                    )}
                    {layer === 'terpenes' && (
                        <div className="pc-layer pc-layer--terpenes">
                            {product.effects?.slice(0, 3).map((e) => (
                                <span key={e} className="pc-badge">{e}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Vertical Variant ──────────────────────────────────────────────────── */
function VerticalCard({ product, size, layer }) {
    const w = size || 160;
    return (
        <div
            className="pc-vertical glass-card pc-glow-rim"
            style={{ width: w, minHeight: w * 1.6 }}
        >
            {layer === 'main' && (
                <div className="pc-layer pc-layer--main pc-vertical__main">
                    {product.imageUrl && (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="pc-img pc-img--vertical"
                        />
                    )}
                    <p className="pc-name">{product.name}</p>
                    <p className="pc-price">{formatPrice(product.price)}</p>
                </div>
            )}
            {layer === 'stats' && (
                <div className="pc-layer pc-layer--stats pc-vertical__stats">
                    {product.thc != null && (
                        <div className="pc-stat">
                            <span className="pc-stat__label">THC</span>
                            <span className="pc-stat__value">{product.thc}%</span>
                        </div>
                    )}
                    {product.cbd != null && (
                        <div className="pc-stat">
                            <span className="pc-stat__label">CBD</span>
                            <span className="pc-stat__value">{product.cbd}%</span>
                        </div>
                    )}
                    {product.strainType && (
                        <span className="pc-badge">{product.strainType}</span>
                    )}
                    {product.weight && (
                        <p className="pc-effects">{product.weight}</p>
                    )}
                </div>
            )}
            {layer === 'terpenes' && (
                <div className="pc-layer pc-layer--terpenes">
                    {product.terpenes?.length > 0 && (
                        <p className="pc-terpenes">{product.terpenes.join(' · ')}</p>
                    )}
                    {product.effects?.length > 0 && (
                        <p className="pc-effects">{product.effects.join(' · ')}</p>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Standard Variant ──────────────────────────────────────────────────── */
function StandardCard({ product, size, layer }) {
    const w = size || 240;
    return (
        <div
            className="pc-standard glass-card pc-glow-rim"
            style={{ width: w }}
        >
            {layer === 'main' && (
                <div className="pc-layer pc-layer--main">
                    {product.imageUrl && (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="pc-img pc-img--standard"
                        />
                    )}
                    <div className="pc-standard__info">
                        <p className="pc-name">{product.name}</p>
                        {product.brand && <p className="pc-brand">{product.brand}</p>}
                        <p className="pc-price">{formatPrice(product.price)}</p>
                    </div>
                </div>
            )}
            {layer === 'stats' && (
                <div className="pc-layer pc-layer--stats">
                    {product.thc != null && (
                        <div className="pc-stat pc-stat--lg">
                            <span className="pc-stat__label">THC</span>
                            <span className="pc-stat__value">{product.thc}%</span>
                        </div>
                    )}
                    {product.cbd != null && (
                        <div className="pc-stat">
                            <span className="pc-stat__label">CBD</span>
                            <span className="pc-stat__value">{product.cbd}%</span>
                        </div>
                    )}
                    {product.strainType && (
                        <span className="pc-badge">{product.strainType}</span>
                    )}
                </div>
            )}
            {layer === 'terpenes' && (
                <div className="pc-layer pc-layer--terpenes">
                    {product.terpenes?.length > 0 && (
                        <p className="pc-terpenes">{product.terpenes.join(' · ')}</p>
                    )}
                    {product.effects?.length > 0 && (
                        <p className="pc-effects">{product.effects.join(' · ')}</p>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Main Export ───────────────────────────────────────────────────────── */
export default function ProductCard({ product, size, variant = 'standard' }) {
    const [layerIndex, setLayerIndex] = useState(0);
    const [animating, setAnimating] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setAnimating(true);
            setTimeout(() => {
                setLayerIndex((i) => (i + 1) % INFO_LAYERS.length);
                setAnimating(false);
            }, 400);
        }, CYCLE_MS);

        return () => clearInterval(timerRef.current);
    }, []);

    const layer = INFO_LAYERS[layerIndex];
    const cardProps = { product, size, layer };

    return (
        <div
            className={`pc-wrapper pc-wrapper--${variant} ${animating ? 'pc-wrapper--animating' : ''}`}
        >
            {variant === 'circle' && <CircleCard   {...cardProps} />}
            {variant === 'hex' && <HexCard      {...cardProps} />}
            {variant === 'vertical' && <VerticalCard {...cardProps} />}
            {variant === 'standard' && <StandardCard {...cardProps} />}
        </div>
    );
}
