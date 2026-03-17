/**
 * DealCard.jsx - Bento Box Design
 *
 * Renders the internal content of a deal item based on its `mode`.
 *
 * Modes:
 *   - "Full Image Banner" -> Just the image filling the space. Text visually hidden.
 *   - "Standard" -> Image + Text stacked or side-by-side bento card.
 *   - "Text Only" -> Clean typography-focused card, no image.
 */

import CountdownTimer from './CountdownTimer';
import './DealCard.css';

const BADGE_CONFIG = {
    BOGO: { label: '🔁 BOGO', color: '#dc2626' }, // red-600
    Discount: { label: '% OFF', color: '#ea580c' }, // orange-600
    Bundle: { label: '📦 BUNDLE', color: '#7c3aed' }, // violet-600
    'Flash Sale': { label: '⚡ FLASH', color: '#2563eb' }, // blue-600
    Custom: { label: '⭐ DEAL', color: '#16a34a' }, // green-600
};

function formatPrice(val) {
    if (val == null || val === '') return null;
    return `$${Number(val).toFixed(2)}`;
}

export default function DealCard({ deal, mode = 'Standard' }) {
    // Determine Badge
    const badge = BADGE_CONFIG[deal.dealType] || BADGE_CONFIG.Custom;
    
    // Formatting
    const originalFmt = formatPrice(deal.originalPrice);
    const dealPriceFmt = formatPrice(deal.dealPrice);
    
    // Auto Savings %
    let savingsPercent = null;
    if (deal.originalPrice && deal.dealPrice && deal.originalPrice > 0) {
        savingsPercent = Math.round((1 - deal.dealPrice / deal.originalPrice) * 100);
    }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* MODE 1: FULL IMAGE BANNER                                           */
    /* ═══════════════════════════════════════════════════════════════════ */
    if (mode === 'Full Image Banner') {
        return (
            <div className="deal-card deal-card--banner">
                {deal.imageUrl ? (
                    <img 
                        src={deal.imageUrl} 
                        alt={deal.title} 
                        className="deal-card__banner-img" 
                    />
                ) : (
                    <div className="deal-card__banner-placeholder">
                        <span>No Image Provided for Banner</span>
                    </div>
                )}
                {/* Optional Timer Overlay */}
                {deal.endTime && (
                    <div className="deal-card__banner-timer">
                        <span className="deal-card__ends-label">Ends In</span>
                        <CountdownTimer endTime={deal.endTime} compact />
                    </div>
                )}
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* MODE 2: TEXT ONLY                                                   */
    /* ═══════════════════════════════════════════════════════════════════ */
    if (mode === 'Text Only') {
        return (
            <div className="deal-card deal-card--text">
                <div className="deal-card__top">
                    <span className="deal-card__badge" style={{ background: badge.color }}>
                        {savingsPercent ? `${savingsPercent}% OFF` : badge.label}
                    </span>
                    {deal.endTime && (
                        <div className="deal-card__timer">
                            <CountdownTimer endTime={deal.endTime} compact />
                        </div>
                    )}
                </div>

                <div className="deal-card__body">
                    <h3 className="deal-card__title">{deal.title}</h3>
                    <p className="deal-card__desc">{deal.description}</p>
                </div>

                {(originalFmt || dealPriceFmt) && (
                    <div className="deal-card__pricing">
                        {originalFmt && <span className="deal-card__original">{originalFmt}</span>}
                        {dealPriceFmt && <span className="deal-card__price">{dealPriceFmt}</span>}
                    </div>
                )}
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* MODE 3: STANDARD (Image + Text)                                     */
    /* ═══════════════════════════════════════════════════════════════════ */
    return (
        <div className="deal-card deal-card--standard">
            {deal.imageUrl && (
                <div className="deal-card__std-img-wrap">
                    <img 
                        src={deal.imageUrl} 
                        alt={deal.title} 
                        className="deal-card__std-img" 
                    />
                    <span className="deal-card__badge deal-card__badge--floating" style={{ background: badge.color }}>
                        {savingsPercent ? `${savingsPercent}% OFF` : badge.label}
                    </span>
                </div>
            )}
            
            <div className="deal-card__std-content">
                {/* Fallback badge if no image */}
                {!deal.imageUrl && (
                    <span className="deal-card__badge" style={{ background: badge.color, alignSelf: 'flex-start', marginBottom: '12px' }}>
                        {savingsPercent ? `${savingsPercent}% OFF` : badge.label}
                    </span>
                )}

                <div className="deal-card__row">
                    <div className="deal-card__text-col">
                        <h3 className="deal-card__title">{deal.title}</h3>
                        <p className="deal-card__desc">{deal.description}</p>
                    </div>

                    {(originalFmt || dealPriceFmt) && (
                        <div className="deal-card__price-col">
                            {originalFmt && <span className="deal-card__original">{originalFmt}</span>}
                            {dealPriceFmt && <span className="deal-card__price">{dealPriceFmt}</span>}
                        </div>
                    )}
                </div>

                {deal.endTime && (
                    <div className="deal-card__timer deal-card__timer--standard">
                        <span className="deal-card__ends-label">Ends In</span>
                        <CountdownTimer endTime={deal.endTime} compact />
                    </div>
                )}
            </div>
        </div>
    );
}
