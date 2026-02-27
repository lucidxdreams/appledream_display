/**
 * CategoryTransition.jsx
 * 
 * GSAP-powered transition wrapper between categories.
 * 
 * Exit  (0.6s): children implode to center → dissolve
 * Enter (0.9s): particle burst → category name flies in → children materialize
 * 
 * Usage: wrap the content area and pass categoryId as key to trigger transitions.
 *
 * HARDENED: Prior timeline is killed before building a new one to prevent
 * overlapping animations during rapid category switches.
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/** Burst of DOM particles using CSS absolute divs */
function burstParticles(container, accent, count = 24) {
    const cx = container.offsetWidth / 2;
    const cy = container.offsetHeight / 2;

    const particles = Array.from({ length: count }, () => {
        const el = document.createElement('div');
        el.style.cssText = `
      position:absolute;
      left:${cx}px;
      top:${cy}px;
      width:8px;
      height:8px;
      border-radius:50%;
      background:${accent};
      pointer-events:none;
      z-index:100;
      transform:translate(-50%,-50%);
    `;
        container.appendChild(el);
        return el;
    });

    const tl = gsap.timeline({
        onComplete: () => particles.forEach((p) => p.remove()),
    });

    particles.forEach((p, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 150 + Math.random() * 250;
        tl.to(
            p,
            {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                opacity: 0,
                scale: Math.random() * 2 + 0.5,
                duration: 0.8,
                ease: 'power2.out',
            },
            0
        );
    });

    return tl;
}

export default function CategoryTransition({
    children,
    categoryId,
    categoryName,
    categoryAccent = '#7cb518',
    onTransitionComplete,
}) {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const labelRef = useRef(null);
    const prevCategoryId = useRef(null);
    const isFirstRender = useRef(true);
    const masterTlRef = useRef(null);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            prevCategoryId.current = categoryId;
            // Entrance animation for first load
            if (contentRef.current) {
                const tween = gsap.fromTo(
                    contentRef.current.children,
                    { opacity: 0, scale: 0.5, y: 60 },
                    {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        duration: 0.9,
                        stagger: 0.06,
                        ease: 'back.out(1.4)',
                    }
                );
                masterTlRef.current = tween;
            }
            return;
        }

        if (categoryId === prevCategoryId.current) return;
        prevCategoryId.current = categoryId;

        const container = containerRef.current;
        const content = contentRef.current;
        const label = labelRef.current;
        if (!container || !content) return;

        // Kill any prior running timeline before building a new one
        if (masterTlRef.current) {
            masterTlRef.current.kill();
            masterTlRef.current = null;
        }

        const masterTl = gsap.timeline({
            onComplete: () => {
                onTransitionComplete?.();
            },
        });
        masterTlRef.current = masterTl;

        // ── EXIT: implode + dissolve (0.6s) ──────────────────────────────────
        masterTl.to(Array.from(content.children), {
            scale: 0.1,
            opacity: 0,
            x: () => (Math.random() - 0.5) * 60,
            y: () => (Math.random() - 0.5) * 60,
            duration: 0.45,
            stagger: { each: 0.04, from: 'random' },
            ease: 'power3.in',
        });

        // ── PARTICLE BURST ────────────────────────────────────────────────────
        masterTl.add(() => {
            burstParticles(container, categoryAccent);
        });

        // ── LABEL FLIES IN ────────────────────────────────────────────────────
        if (label) {
            masterTl.fromTo(
                label,
                { x: -120, opacity: 0, scale: 0.8 },
                { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }
            );
            masterTl.to(label, { opacity: 0, duration: 0.3, delay: 0.4 });
        }

        // ── ENTER: products materialize (0.9s) ────────────────────────────────
        masterTl.set(Array.from(content.children), { scale: 0, opacity: 0, x: 0, y: 0 });
        masterTl.to(Array.from(content.children), {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            stagger: { each: 0.07, from: 'start' },
            ease: 'back.out(1.4)',
        });

        return () => {
            if (masterTlRef.current) {
                masterTlRef.current.kill();
                masterTlRef.current = null;
            }
        };
    }, [categoryId, categoryAccent, onTransitionComplete]);

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
        >
            {/* Flying category name label */}
            <div
                ref={labelRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 50,
                    opacity: 0,
                }}
            >
                <span
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 900,
                        fontSize: 'clamp(3rem, 8vw, 7rem)',
                        color: categoryAccent,
                        textShadow: `0 0 40px ${categoryAccent}, 0 0 80px ${categoryAccent}44`,
                        letterSpacing: '-0.02em',
                    }}
                >
                    {categoryName}
                </span>
            </div>

            {/* Content that gets transitioned */}
            <div ref={contentRef} style={{ width: '100%', height: '100%' }}>
                {children}
            </div>
        </div>
    );
}
