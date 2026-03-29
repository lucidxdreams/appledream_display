/**
 * DealCard.jsx — Compact Floating Card
 *
 * "Smart Flex Center" Architecture.
 * Fits many deals on-screen via a sleek portrait aspect ratio.
 * Product PNG sits physically on top of the card bounds.
 */

import { useState, useEffect } from 'react';
import CountdownTimer from './CountdownTimer';
import { useImagePalette } from '../lib/colorExtractor';
import './DealCard.css';

const TYPE_LABELS = {
    'BOGO':       'BOGO',
    'Discount':   '% OFF',
    'Bundle':     'BUNDLE',
    'Flash Sale': '⚡ FLASH',
    'Custom':     'DEAL',
};

function formatPrice(val) {
    if (val == null || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : `$${n.toFixed(2)}`;
}

function calcSavings(original, deal) {
    if (!original || !deal || Number(original) <= 0) return null;
    const pct = Math.round((1 - Number(deal) / Number(original)) * 100);
    return pct > 0 ? pct : null;
}

export default function DealCard({ deal }) {
    const savings = calcSavings(deal.originalPrice, deal.dealPrice);
    const hasImg  = !!deal.imageUrl;
    const typeLabel = TYPE_LABELS[deal.dealType] || deal.dealType || 'DEAL';
    const origFmt = formatPrice(deal.originalPrice);
    const dealFmt = formatPrice(deal.dealPrice);
    
    // Automatically extract harmonious theme from deal graphic
    const palette = useImagePalette(deal.imageUrl);

    return (
        <div 
            className={`ev-sc ${hasImg ? 'ev-sc--with-img' : 'ev-sc--no-img'}`}
            style={{
                '--dc-accent': palette?.accent || '#fbbf24',
                '--dc-glow':   palette?.glow   || 'rgba(251, 191, 36, 0.05)',
                '--dc-border': palette?.border || 'rgba(255, 255, 255, 0.25)',
                '--dc-text':   palette?.text   || '#ffffff'
            }}
        >
            
            {/* ── THE HERO IMAGE (Hangs -10% out top, strictly 85% width) ── */}
            {hasImg && (
                <div className="ev-sc__hero-zone">
                    <img 
                        src={deal.imageUrl} 
                        alt={deal.title} 
                        className="ev-sc__hero-img" 
                    />
                </div>
            )}

            {/* ── THE CARD CONTENT (Sits underneath the hero drop-shadow) ── */}
            <div className="ev-sc__content">
                
                {/* Dynamic Header Space: Push text down when image acts as roof */}
                <div className="ev-sc__header">
                    <span className="ev-sc__type">{typeLabel}</span>
                    
                    {savings && (
                        <div className="ev-sc__savings">
                            <span className="sc-pct">{savings}%</span>
                            <span className="sc-off">OFF</span>
                        </div>
                    )}
                </div>

                <div className="ev-sc__text-body">
                    <h2 className="ev-sc__title">{deal.title}</h2>
                    {deal.description && (
                        <p className="ev-sc__desc">{deal.description}</p>
                    )}
                </div>

                {/* Grow empty space to push pricing down */}
                <div className="ev-spacer" />

                {/* Bottom Bar: Pricing & Urgency */}
                <div className="ev-sc__footer">
                    <div className="ev-sc__pricing">
                        {origFmt && <span className="sc-price--orig">{origFmt}</span>}
                        {dealFmt && <span className="sc-price--deal">{dealFmt}</span>}
                    </div>

                    {deal.endTime && (
                        <div className="ev-sc__timer">
                            <span className="sc-timer-dot" />
                            <CountdownTimer endTime={deal.endTime} compact />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
