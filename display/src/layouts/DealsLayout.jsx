/**
 * DealsLayout.jsx — "Bento Box" Design (Redesign)
 *
 * Reads active deals from Firestore (deals collection).
 * Sorts them by priority.
 *
 * Responsive Grid Rules:
 * - Built on CSS Grid
 * - displayMode "Full Image Banner" will span full width natively in CSS
 * - displayMode "Standard" will map to smaller bento squares/rectangles
 * - displayMode "Text Only" maps to compact informational strips
 */

import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import gsap from 'gsap';
import DealCard from '../components/DealCard';
import './DealsLayout.css';

/* ── Firestore active-deal filter ─────────────────────────────────── */
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

/* ── No-Deals Fallback ────────────────────────────────────────────── */
function NoDeals() {
    return (
        <div className="bento-no-deals">
            <div className="bento-no-deals__icon">🎁</div>
            <h2 className="bento-no-deals__heading">NO ACTIVE DEALS</h2>
            <p className="bento-no-deals__sub">Check back shortly for new promotions</p>
            <div className="bento-no-deals__loyalty">
                <span className="bento-no-deals__loyalty-icon">⭐</span>
                <span className="bento-no-deals__loyalty-text">
                    Ask about our Loyalty Program — earn points on every purchase
                </span>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                      */
/* ═══════════════════════════════════════════════════════════════════ */
export default function DealsLayout() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const sceneRef = useRef(null);
    const animatedRef = useRef(false);

    /* ── Firestore listener ─────────────────────────────────────── */
    useEffect(() => {
        const ref = collection(db, 'deals');
        const unsub = onSnapshot(
            ref,
            (snap) => {
                const items = snap.docs
                    .map((d) => ({ id: d.id, ...d.data() }))
                    .filter(isActive);
                
                // Sort by priority
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
    }, []);

    /* ── GSAP Bento Grid animation ──────────────────────────────── */
    useEffect(() => {
        if (loading || deals.length === 0) return;
        if (animatedRef.current) return;
        animatedRef.current = true;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // Animate Header
            tl.fromTo('.bento-header', 
                { opacity: 0, filter: 'blur(10px)', y: -30 },
                { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.8 }
            );

            // Stagger in the bento boxes
            tl.fromTo('.bento-grid-item',
                { opacity: 0, scale: 0.95, y: 40 },
                { opacity: 1, scale: 1, y: 0, stagger: 0.1, duration: 0.7, ease: 'back.out(1.2)' },
                '-=0.4'
            );
        }, sceneRef);

        return () => ctx.revert();
    }, [loading, deals]);


    if (loading) return null;

    return (
        <div ref={sceneRef} className="bento-scene">
            {/* Animated Ambient Background Glows */}
            <div className="bento-ambient-glow glow-1" />
            <div className="bento-ambient-glow glow-2" />

            {/* Page header */}
            <header className="bento-header">
                <span className="bento-header__text">Featured Deals</span>
            </header>

            {/* Content area */}
            <div className="bento-content">
                {deals.length === 0 ? (
                    <NoDeals />
                ) : (
                    <div className="bento-grid">
                        {deals.map((deal, i) => {
                            // Determine the CSS class based on the mode
                            const mode = deal.displayMode || 'Standard';
                            let spanClass = 'bento-grid-item--standard';
                            if (mode === 'Full Image Banner') spanClass = 'bento-grid-item--banner';
                            if (mode === 'Text Only') spanClass = 'bento-grid-item--text';

                            // Edge case: if it's the only deal, let the standard box span everything
                            if (deals.length === 1 && mode !== 'Text Only') spanClass = 'bento-grid-item--banner';

                            return (
                                <div key={deal.id} className={`bento-grid-item ${spanClass}`}>
                                    <DealCard deal={deal} mode={mode} />
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
