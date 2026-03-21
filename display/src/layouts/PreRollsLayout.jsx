/**
 * PreRollsLayout.jsx — "Golden Scatter" Pre-Rolls Display
 * 
 * Floating vertical cards with strain-based coloring and physics-inspired positioning.
 * Products float freely across the display area with dynamic sizing and stunning visuals.
 */

import { useRef, useEffect, useState } from 'react';
import { useFloatingLayout } from './useFloatingLayout';
import './PreRollsLayout.css';

/* ============================================
   PreRollsLayout — Premium Showcase Design
   Large product images with elegant info cards
   ============================================ */

// Strain-based color palettes
const STRAIN_PALETTES = {
  sativa: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.6)',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    border: 'rgba(251, 191, 36, 0.5)',
    shadow: '0 0 40px rgba(245, 158, 11, 0.3)'
  },
  indica: {
    primary: '#a855f7',
    secondary: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.6)',
    gradient: 'linear-gradient(135deg, #a855f7, #c084fc)',
    border: 'rgba(192, 132, 252, 0.5)',
    shadow: '0 0 40px rgba(168, 85, 247, 0.3)'
  },
  hybrid: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.6)',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    border: 'rgba(52, 211, 153, 0.5)',
    shadow: '0 0 40px rgba(16, 185, 129, 0.3)'
  }
};

function getStrain(product) {
  const type = (product.type || '').toLowerCase();
  if (type.includes('indica')) return 'indica';
  if (type.includes('sativa')) return 'sativa';
  return 'hybrid';
}


// Individual Pre-Roll Card
function PreRollCard({ product, index, cardW, cardH }) {
  const strain = getStrain(product);
  const pal = STRAIN_PALETTES[strain];
  
  const thc = product.thc || '';
  const cbd = product.cbd || '';
  const weight = product.weight || '';
  const price = product.price ? parseFloat(product.price).toFixed(2) : '';
  const imgSrc = product.imageUrl || `${import.meta.env.BASE_URL}placeholder.webp`;
  const hasBadge = product.badge && (product.badge.toLowerCase() === 'new' || product.badge.toLowerCase() === 'hot');
  const badgeType = hasBadge ? product.badge.toLowerCase() : null;
  const floatV = (index % 3) + 1;

  return (
    <div 
      className={`pr-card pr-float-${floatV}`}
      style={{
        '--pal-primary': pal.primary,
        '--pal-secondary': pal.secondary,
        '--pal-glow': pal.glow,
        '--pal-gradient': pal.gradient,
        '--pal-border': pal.border,
        '--pal-shadow': pal.shadow,
        '--entrance-delay': `${index * 0.08}s`,
        '--float-delay': `${1 + index * 0.12}s`,
        width: cardW,
        height: cardH
      }}
    >
      {/* Top accent line */}
      <div className="pr-accent-line" />
      
      {/* Header with strain and badge */}
      <div className="pr-header">
        <div className="pr-strain-badge">{strain}</div>
        {hasBadge && (
          <div className={`pr-badge pr-badge--${badgeType}`}>
            {product.badge}
          </div>
        )}
      </div>

      {/* Large product image */}
      <div className="pr-image-wrap">
        <div className="pr-image-glow" />
        <div className="pr-image-inner">
          {imgSrc.includes('placeholder') ? (
            <div className="pr-placeholder">🌿</div>
          ) : (
            <img src={imgSrc} alt={product.name} className="pr-image" loading="lazy" />
          )}
        </div>
      </div>

      {/* Product info */}
      <div className="pr-info">
        {product.brand && <div className="pr-brand">{product.brand}</div>}
        <h3 className="pr-name">{product.name}</h3>
        
        {/* Stats row */}
        <div className="pr-stats">
          {thc && (
            <div className="pr-stat">
              <span className="pr-stat-label">THC</span>
              <span className="pr-stat-value">{thc}%</span>
            </div>
          )}
          {cbd && parseFloat(cbd) > 0 && (
            <div className="pr-stat">
              <span className="pr-stat-label">CBD</span>
              <span className="pr-stat-value">{cbd}%</span>
            </div>
          )}
          {weight && (
            <div className="pr-stat">
              <span className="pr-stat-label">Weight</span>
              <span className="pr-stat-value">{weight}</span>
            </div>
          )}
        </div>

        {/* Price */}
        {price && <div className="pr-price">${price}</div>}
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */
export default function PreRollsLayout({ products = [] }) {
  const containerRef = useRef(null);
  const [dim, setDim] = useState({ w: 1280, h: 720 });

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDim({ w: width, h: height });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { positions, cardW, cardH } = useFloatingLayout({
    products,
    containerW: dim.w,
    containerH: dim.h,
    baseCardW: 240,
    baseCardH: 340,
    gap: 45,
  });

  if (!products.length) {
    return (
      <div className="pr-scene pr-empty">
        <div className="pr-empty-msg">No pre-rolls currently available</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="pr-scene">
      {/* Ambient background effects */}
      <div className="pr-bg" />
      <div className="pr-bloom pr-bloom--1" />
      <div className="pr-bloom pr-bloom--2" />
      
      {/* Floating Products */}
      <div className="pr-floating-container">
        {products.map((product, i) => positions[i] ? (
          <div
            key={product.id || i}
            className="pr-card-wrapper"
            style={{
              position: 'absolute',
              left: positions[i].x - cardW / 2,
              top: positions[i].y - cardH / 2,
              width: cardW,
              height: cardH,
            }}
          >
            <PreRollCard
              product={product}
              index={i}
              cardW={cardW}
              cardH={cardH}
            />
          </div>
        ) : null)}
      </div>
    </div>
  );
}
