/**
 * DealsLayout.jsx — "Smart Flex Center" Architecture
 *
 * Dynamically centers any number of active deals in the absolute
 * center of the screen via CSS flex wrap & align-content.
 * Scales effortlessly from 1 to 8+ deals.
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import EmberCanvas from '../components/EmberCanvas';
import DealCard from '../components/DealCard';
import './DealsLayout.css';

/* ── Active-deal filter ─────────────────────────────────────────── */
function isActive(deal) {
    if (deal.active === false) return false;
    if (deal.endTime) {
        const endMs = deal.endTime?.seconds
            ? deal.endTime.seconds * 1000
            : new Date(deal.endTime).getTime();
        if (!isNaN(endMs) && endMs < Date.now()) return false;
    }
    return true;
}

/* ── Fallback ───────────────────────────────────────────────────── */
function NoDeals() {
    return (
        <div className="ev-no-deals">
            <div className="ev-no-deals__icon">🎁</div>
            <h2 className="ev-no-deals__heading">NO ACTIVE DEALS</h2>
            <p className="ev-no-deals__sub">Check back shortly for new promotions</p>
            <div className="ev-no-deals__loyalty">
                <span>⭐</span>
                <span className="ev-no-deals__loyalty-text">
                    Ask about our Loyalty Program — earn points on every purchase
                </span>
            </div>
        </div>
    );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function DealsLayout({ locationId }) {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);

    /* Firestore listener */
    useEffect(() => {
        if (!locationId) return;
        const ref = collection(db, 'locations', locationId, 'deals');
        const unsub = onSnapshot(
            ref,
            (snap) => {
                const items = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(isActive);
                
                // Sort by priority to ensure intended visual groupings
                items.sort((a, b) => (a.displayPriority ?? 99) - (b.displayPriority ?? 99));
                setDeals(items);
                setLoading(false);
            },
            (err) => {
                console.error('[DealsLayout] Firestore error:', err);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [locationId]);

    if (loading) return null;

    return (
        <div className="ev-scene">
            <EmberCanvas />
            {/* Soft background blooms for atmosphere without noise */}
            <div className="ev-bloom ev-bloom--1" />
            <div className="ev-bloom ev-bloom--2" />
            <div className="ev-vignette" />

            <div className="ev-layout">
                {deals.length === 0 ? (
                    <NoDeals />
                ) : (
                    <div className="ev-smart-grid">
                        {deals.map((deal, i) => (
                            <div 
                                key={deal.id} 
                                className={`ev-smart-item ev-enter--${(i % 3) + 1}`}
                                style={{ '--entrance-delay': `${i * 0.08}s` }}
                            >
                                <DealCard deal={deal} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
