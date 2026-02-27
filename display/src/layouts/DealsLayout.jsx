/**
 * DealsLayout.jsx — "The Vault" (Phase 4)
 *
 * Reads active deals from Firestore (deals collection).
 * Selects layout variant based on deal count:
 *   0 deals → "No Active Deals" animated fallback
 *   1 deal  → Full Bleed Hero (full screen single card)
 *   2-3     → Hero (60%) + Side Panel (40%)
 *   4-6     → Symmetrical 3-column grid
 *
 * GSAP "Vault Open" entrance animation (1.8s) runs on each mount.
 */

import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import gsap from 'gsap';
import DealCard from '../components/DealCard';
import EmberCanvas from '../components/EmberCanvas';
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
        <div className="vault-no-deals">
            <div className="vault-no-deals__art">
                <div className="vault-no-deals__ring vault-no-deals__ring--1" />
                <div className="vault-no-deals__ring vault-no-deals__ring--2" />
                <div className="vault-no-deals__ring vault-no-deals__ring--3" />
                <span className="vault-no-deals__icon">🔒</span>
            </div>
            <h2 className="vault-no-deals__heading">The Vault is Resting</h2>
            <p className="vault-no-deals__sub">New deals dropping soon — check back shortly</p>
            <div className="vault-no-deals__loyalty">
                <span className="vault-no-deals__loyalty-icon">⭐</span>
                <span className="vault-no-deals__loyalty-text">
                    Ask about our Loyalty Program — earn points on every purchase
                </span>
            </div>
        </div>
    );
}

/* ── Full-Bleed Hero (1 deal) ─────────────────────────────────────── */
function HeroLayout({ deals }) {
    return (
        <div className="vault-layout vault-layout--hero">
            <DealCard deal={deals[0]} isHero index={0} />
        </div>
    );
}

/* ── Hero + Side Panel (2-3 deals) ───────────────────────────────── */
function HeroSideLayout({ deals }) {
    const [hero, ...rest] = deals;
    return (
        <div className="vault-layout vault-layout--hero-side">
            <div className="vault-hero-pane">
                <DealCard deal={hero} isHero index={0} />
            </div>
            <div className="vault-side-pane">
                {rest.map((deal, i) => (
                    <DealCard key={deal.id} deal={deal} isSide index={i + 1} />
                ))}
            </div>
        </div>
    );
}

/* ── Symmetrical Grid (4-6 deals) ────────────────────────────────── */
function GridLayout({ deals }) {
    return (
        <div className="vault-layout vault-layout--grid">
            {deals.map((deal, i) => (
                <DealCard key={deal.id} deal={deal} index={i} />
            ))}
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

    /* ── GSAP Vault Open animation ──────────────────────────────── */
    useEffect(() => {
        if (loading) return;
        if (animatedRef.current) return;
        animatedRef.current = true;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // 1. Concentric rings expand from center
            tl.from('.vault-rings .vault-ring', {
                scale: 0,
                opacity: 0,
                duration: 0.5,
                stagger: 0.08,
                ease: 'power4.out',
            });

            // 2. Ember particles fade in
            tl.to('.ember-canvas', {
                opacity: 1,
                duration: 0.3,
            }, '-=0.2');

            // 3. "DEALS" header slams in (elastic)
            tl.from('.deals-header', {
                y: -100,
                opacity: 0,
                duration: 0.4,
                ease: 'back.out(1.7)',
            }, '-=0.1');

            // 4. Deal cards fall + bounce into position (stagger)
            tl.from('.deal-card', {
                y: -200,
                opacity: 0,
                stagger: 0.15,
                duration: 0.5,
                ease: 'bounce.out',
            }, '-=0.2');

            // 5. Countdown timers snap in (elastic)
            tl.from('.countdown-timer', {
                scale: 0,
                opacity: 0,
                duration: 0.3,
                ease: 'elastic.out(1, 0.3)',
            }, '-=0.1');

            // 6. Glow borders animate on
            tl.from('.deal-card', {
                boxShadow: 'none',
                duration: 0.4,
            }, '-=0.1');
        }, sceneRef);

        return () => ctx.revert();
    }, [loading]);

    /* ── Layout variant selection ───────────────────────────────── */
    function renderLayout() {
        if (loading) return null;
        if (deals.length === 0) return <NoDeals />;
        if (deals.length === 1) return <HeroLayout deals={deals} />;
        if (deals.length <= 3) return <HeroSideLayout deals={deals} />;
        return <GridLayout deals={deals.slice(0, 6)} />;
    }

    return (
        <div ref={sceneRef} className="vault-scene">
            {/* Ember particles */}
            <EmberCanvas />

            {/* Concentric rings (vault open effect) */}
            <div className="vault-rings" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`vault-ring vault-ring--${i}`} />
                ))}
            </div>

            {/* Page header */}
            <header className="deals-header">
                <span className="deals-header__flame">🔥</span>
                <span className="deals-header__text">DEALS</span>
                <span className="deals-header__flame">🔥</span>
            </header>

            {/* Content area */}
            <div className="vault-content">
                {renderLayout()}
            </div>
        </div>
    );
}
