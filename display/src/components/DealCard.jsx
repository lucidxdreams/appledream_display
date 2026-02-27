/**
 * DealCard.jsx
 *
 * A single deal displayed inside the Vault page.
 *
 * Props:
 *   deal       {object}  — Firestore deal document
 *   isHero     {boolean} — full-screen hero variant
 *   isSide     {boolean} — side panel compact variant
 *   index      {number}  — for GSAP stagger targeting (data-attr)
 *
 * Expected deal fields:
 *   type          'BOGO' | 'PERCENT' | 'DOLLAR' | 'BUNDLE' | 'FLASH' | 'DAILY'
 *   title         string
 *   description   string (optional)
 *   imageUrl      string (optional)
 *   originalPrice number (optional)
 *   dealPrice     number
 *   savingsAmount number (optional, $ saved)
 *   savingsPercent number (optional, % saved)
 *   endTime       Date | Timestamp | string (optional)
 */

import CountdownTimer from './CountdownTimer';
import './DealCard.css';

const BADGE_CONFIG = {
    BOGO: { label: '🔁 BOGO', color: '#ff3300' },
    PERCENT: { label: '% OFF', color: '#ff6600' },
    DOLLAR: { label: '$ OFF', color: '#ff9900' },
    BUNDLE: { label: '📦 BUNDLE', color: '#9900ff' },
    FLASH: { label: '⚡ FLASH', color: '#0066ff' },
    DAILY: { label: '📅 TODAY', color: '#00aa44' },
};

function formatPrice(val) {
    if (val == null) return null;
    return `$${Number(val).toFixed(2)}`;
}

function buildSavingsText(deal) {
    const { type, originalPrice, dealPrice, savingsAmount, savingsPercent } = deal;

    if (type === 'BOGO') return 'Get 2nd FREE';

    const parts = [];
    if (savingsAmount != null && savingsAmount > 0) {
        parts.push(`Save $${Number(savingsAmount).toFixed(2)}`);
    } else if (originalPrice != null && dealPrice != null) {
        const saved = Number(originalPrice) - Number(dealPrice);
        if (saved > 0) parts.push(`Save $${saved.toFixed(2)}`);
    }

    if (savingsPercent != null && savingsPercent > 0) {
        parts.push(`${Number(savingsPercent).toFixed(0)}% off`);
    } else if (type === 'PERCENT' && deal.discountValue) {
        parts.push(`${deal.discountValue}% off`);
    }

    return parts.length > 0 ? parts.join(' / ') : null;
}

function buildDealPriceLabel(deal) {
    const { type, dealPrice, discountValue } = deal;
    if (type === 'BOGO') return 'BUY 1 GET 1';
    if (type === 'PERCENT' && discountValue) return `${discountValue}% OFF`;
    if (type === 'DOLLAR' && discountValue) return `$${discountValue} OFF`;
    if (dealPrice != null) return formatPrice(dealPrice);
    return null;
}

export default function DealCard({ deal, isHero = false, isSide = false, index = 0 }) {
    const badge = BADGE_CONFIG[deal.type] || BADGE_CONFIG.DOLLAR;
    const savingsText = buildSavingsText(deal);
    const dealPriceLabel = buildDealPriceLabel(deal);
    const originalFmt = formatPrice(deal.originalPrice);

    const classNames = [
        'deal-card',
        isHero ? 'deal-card--hero' : '',
        isSide ? 'deal-card--side' : '',
        !isHero && !isSide ? 'deal-card--grid' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={classNames} data-index={index}>
            {/* ── Top Row: Badge + Timer ──────────────────────── */}
            <div className="deal-card__top-row">
                <span
                    className="deal-card__badge"
                    style={{ background: badge.color }}
                >
                    {/* For PERCENT/DOLLAR types, show the actual value in the badge */}
                    {deal.type === 'PERCENT' && deal.discountValue
                        ? `${deal.discountValue}% OFF`
                        : deal.type === 'DOLLAR' && deal.discountValue
                            ? `$${deal.discountValue} OFF`
                            : badge.label}
                </span>

                {deal.endTime && (
                    <div className="deal-card__timer countdown-timer-wrapper">
                        <span className="deal-card__ends-label">ENDS IN</span>
                        <CountdownTimer endTime={deal.endTime} compact />
                    </div>
                )}
            </div>

            {/* ── Product Image ───────────────────────────────── */}
            {deal.imageUrl && (
                <div className="deal-card__img-wrap">
                    <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        className="deal-card__img"
                        loading="lazy"
                    />
                </div>
            )}

            {/* ── Product Info ────────────────────────────────── */}
            <div className="deal-card__info">
                <h3 className="deal-card__title">{deal.title}</h3>

                {deal.description && (
                    <p className="deal-card__desc">{deal.description}</p>
                )}

                <div className="deal-card__prices">
                    {originalFmt && (
                        <span className="deal-card__original">{originalFmt}</span>
                    )}
                    {dealPriceLabel && (
                        <span className="deal-card__price">{dealPriceLabel}</span>
                    )}
                </div>

                {savingsText && (
                    <div className="deal-card__savings">{savingsText}</div>
                )}
            </div>
        </div>
    );
}
