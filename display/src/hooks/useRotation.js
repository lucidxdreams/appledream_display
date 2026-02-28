/**
 * useRotation.js
 * 
 * Reads active categories from Firestore in real time.
 * Cycles through them using each category's displayDuration.
 * Restarts when settings.lastPushed changes.
 * 
 * Returns: { currentCategory, nextCategory, progress, jumpTo, categories, connectionError }
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

const MAX_RETRIES = 3;

export function useRotation() {
    const [categories, setCategories] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [lastPushed, setLastPushed] = useState(null);
    const [connectionError, setConnectionError] = useState(false);

    // Refs so timer callbacks always see latest values without re-creating
    const categoriesRef = useRef([]);
    const currentIndexRef = useRef(0);
    const startTimeRef = useRef(Date.now());
    const rafRef = useRef(null);
    const resetFlagRef = useRef(false);
    const catErrorCount = useRef(0);
    const settingsErrorCount = useRef(0);

    // ── 1. Subscribe to categories collection ──────────────────────────────────
    useEffect(() => {
        const unsubCats = onSnapshot(
            collection(db, 'categories'),
            (snap) => {
                catErrorCount.current = 0;
                setConnectionError(settingsErrorCount.current >= MAX_RETRIES);

                const cats = snap.docs
                    .map((d) => ({ id: d.id, ...d.data() }))
                    .filter((c) => c.active)
                    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

                categoriesRef.current = cats;
                setCategories(cats);
            },
            (err) => {
                console.error('[useRotation] categories error:', err);
                catErrorCount.current += 1;
                if (catErrorCount.current >= MAX_RETRIES) {
                    setConnectionError(true);
                }
            }
        );

        return () => unsubCats();
    }, []);

    // ── 2. Subscribe to settings.lastPushed ───────────────────────────────────
    useEffect(() => {
        const unsubSettings = onSnapshot(
            doc(db, 'settings', 'display'),
            (snap) => {
                settingsErrorCount.current = 0;
                setConnectionError(catErrorCount.current >= MAX_RETRIES);

                if (snap.exists()) {
                    const lp = snap.data().lastPushed;
                    setLastPushed((prev) => {
                        if (prev !== null && lp !== prev) {
                            // Signal reset
                            resetFlagRef.current = true;
                        }
                        return lp;
                    });
                }
            },
            (err) => {
                console.error('[useRotation] settings error:', err);
                settingsErrorCount.current += 1;
                if (settingsErrorCount.current >= MAX_RETRIES) {
                    setConnectionError(true);
                }
            }
        );

        return () => unsubSettings();
    }, []);

    // ── 3. RAF-based rotation loop ─────────────────────────────────────────────
    const tick = useCallback(() => {
        const cats = categoriesRef.current;

        if (cats.length === 0) {
            rafRef.current = requestAnimationFrame(tick);
            return;
        }

        // Handle reset triggered by lastPushed change
        if (resetFlagRef.current) {
            resetFlagRef.current = false;
            currentIndexRef.current = 0;
            setCurrentIndex(0);
            startTimeRef.current = Date.now();
            setProgress(0);
            rafRef.current = requestAnimationFrame(tick);
            return;
        }

        const current = cats[currentIndexRef.current % cats.length];
        const duration = (current?.displayDuration ?? 15) * 1000; // ms
        const elapsed = Date.now() - startTimeRef.current;
        const prog = Math.min(elapsed / duration, 1);

        setProgress(prog);

        if (prog >= 1) {
            const nextIdx = (currentIndexRef.current + 1) % cats.length;
            currentIndexRef.current = nextIdx;
            setCurrentIndex(nextIdx);
            startTimeRef.current = Date.now();
        }

        rafRef.current = requestAnimationFrame(tick);
    }, []);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [tick]);

    // ── 4. jumpTo helper ───────────────────────────────────────────────────────
    const jumpTo = useCallback((indexOrId) => {
        const cats = categoriesRef.current;
        let idx = typeof indexOrId === 'number'
            ? indexOrId
            : cats.findIndex((c) => c.id === indexOrId);

        if (idx < 0) idx = 0;
        currentIndexRef.current = idx;
        setCurrentIndex(idx);
        startTimeRef.current = Date.now();
        setProgress(0);
    }, []);

    // ── 5. Derived values ──────────────────────────────────────────────────────
    const safeIndex = categories.length > 0 ? currentIndex % categories.length : 0;
    const currentCategory = categories[safeIndex] ?? null;
    const nextIndex = categories.length > 1 ? (safeIndex + 1) % categories.length : safeIndex;
    const nextCategory = categories[nextIndex] ?? null;

    return { currentCategory, nextCategory, progress, jumpTo, categories, connectionError };
}

