/**
 * CategoryTransition.jsx
 *
 * GSAP-powered transition wrapper between categories.
 *
 * Fix: useLayoutEffect fires before browser paint — new content is hidden
 * immediately, preventing the products-visible-before-title flash bug.
 *
 * Enter sequence (≈1.8s):
 *  1. Accent bars sweep in from opposite sides
 *  2. Title rises from behind a hard clip (curtain reveal)
 *  3. "NOW DISPLAYING" sub-label fades up
 *  4. Hold
 *  5. Title drops behind clip, bars collapse inward
 *  6. Products materialize
 *
 * HARDENED: Prior timeline is killed before building a new one.
 */

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

function burstParticles(container, accent, count = 20) {
    const cx = container.offsetWidth / 2;
    const cy = container.offsetHeight / 2;

    const particles = Array.from({ length: count }, () => {
        const el = document.createElement('div');
        el.style.cssText = `
      position:absolute;
      left:${cx}px;
      top:${cy}px;
      width:6px;
      height:6px;
      border-radius:50%;
      background:${accent};
      pointer-events:none;
      z-index:100;
      transform:translate(-50%,-50%);
    `;
        container.appendChild(el);
        return el;
    });

    const tl = gsap.timeline({ onComplete: () => particles.forEach((p) => p.remove()) });

    particles.forEach((p, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 120 + Math.random() * 240;
        tl.to(p, {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            opacity: 0,
            scale: Math.random() * 2.5 + 0.5,
            duration: 0.9,
            ease: 'power2.out',
        }, 0);
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
    const contentRef   = useRef(null);
    const labelRef     = useRef(null);
    const barTopRef    = useRef(null);
    const barBotRef    = useRef(null);
    const titleClipRef = useRef(null);
    const titleRef     = useRef(null);
    const subLabelRef  = useRef(null);

    const prevCategoryId = useRef(null);
    const isFirstRender  = useRef(true);
    const masterTlRef    = useRef(null);

    // useLayoutEffect fires synchronously before the browser paints —
    // this is what prevents new content from flashing into view.
    useLayoutEffect(() => {
        // ── First render: just materialize products ──────────────────────────
        if (isFirstRender.current) {
            isFirstRender.current = false;
            prevCategoryId.current = categoryId;
            if (contentRef.current) {
                masterTlRef.current = gsap.fromTo(
                    contentRef.current.children,
                    { opacity: 0, scale: 0.5, y: 60 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'back.out(1.4)' }
                );
            }
            return;
        }

        if (categoryId === prevCategoryId.current) return;
        prevCategoryId.current = categoryId;

        const container = containerRef.current;
        const content   = contentRef.current;
        const label     = labelRef.current;
        const barTop    = barTopRef.current;
        const barBot    = barBotRef.current;
        const titleClip = titleClipRef.current;
        const titleEl   = titleRef.current;
        const subLabel  = subLabelRef.current;

        if (!container || !content) return;

        if (masterTlRef.current) {
            masterTlRef.current.kill();
            masterTlRef.current = null;
        }

        // CRITICAL: hide new products before browser paints.
        // NOTE: We must NOT set scale:0 here because R3F (used by FlowersLayout)
        // measures the Canvas size via getBoundingClientRect(). If scale:0 is applied,
        // R3F initialises the WebGL renderer at 0×0 and the spheres never appear.
        // We hide with opacity:0 only (scale stays at 1) so R3F gets correct dimensions.
        // The pop-in scale effect is applied later — just before the reveal — so the
        // Canvas has already initialized at full size by then.
        gsap.set(content, { opacity: 0 });
        gsap.set(Array.from(content.children), { opacity: 0, scale: 1, x: 0, y: 0 });

        // Reset label children to clean starting states
        if (barTop)   gsap.set(barTop,   { scaleX: 0 });
        if (barBot)   gsap.set(barBot,   { scaleX: 0 });
        if (titleEl)  gsap.set(titleEl,  { y: '115%' });
        if (subLabel) gsap.set(subLabel, { opacity: 0, y: 10 });

        const masterTl = gsap.timeline({ onComplete: () => onTransitionComplete?.() });
        masterTlRef.current = masterTl;

        // ── REVEAL LABEL ──────────────────────────────────────────────────────
        masterTl.set(label, { opacity: 1 }, 0);

        // Particle burst
        masterTl.add(() => burstParticles(container, categoryAccent), 0);

        // Top bar sweeps in from the left
        if (barTop) {
            masterTl.to(barTop, {
                scaleX: 1,
                transformOrigin: 'left center',
                duration: 0.42,
                ease: 'power3.out',
            }, 0.05);
        }

        // Bottom bar sweeps in from the right
        if (barBot) {
            masterTl.to(barBot, {
                scaleX: 1,
                transformOrigin: 'right center',
                duration: 0.42,
                ease: 'power3.out',
            }, 0.12);
        }

        // Title curtain-rise: parent overflow:hidden clips the upward travel
        if (titleEl) {
            masterTl.to(titleEl, {
                y: '0%',
                duration: 0.65,
                ease: 'power4.out',
            }, 0.18);
        }

        // Sub-label fades up once the title has settled
        if (subLabel) {
            masterTl.to(subLabel, {
                opacity: 1,
                y: 0,
                duration: 0.35,
                ease: 'power2.out',
            }, 0.56);
        }

        // ── HOLD ─────────────────────────────────────────────────────────────
        masterTl.addLabel('hold', '+=0.68');

        // ── EXIT LABEL ────────────────────────────────────────────────────────
        if (subLabel) {
            masterTl.to(subLabel, { opacity: 0, duration: 0.2 }, 'hold');
        }

        // Title drops back behind the clip
        if (titleEl) {
            masterTl.to(titleEl, {
                y: '-115%',
                duration: 0.4,
                ease: 'power3.in',
            }, 'hold+=0.06');
        }

        // Bars collapse inward
        if (barTop) {
            masterTl.to(barTop, {
                scaleX: 0,
                transformOrigin: 'right center',
                duration: 0.3,
                ease: 'power2.in',
            }, 'hold+=0.1');
        }
        if (barBot) {
            masterTl.to(barBot, {
                scaleX: 0,
                transformOrigin: 'left center',
                duration: 0.3,
                ease: 'power2.in',
            }, 'hold+=0.1');
        }

        masterTl.set(label, { opacity: 0 });

        // ── PRODUCTS MATERIALIZE ──────────────────────────────────────────────
        // Set scale just before reveal so the pop-in effect is preserved.
        // By now the Canvas has already been initialised at full size (scale was 1
        // during the entire title sequence), so this brief 0.8 start is safe.
        masterTl.set(Array.from(content.children), { scale: 0.8 });
        masterTl.set(content, { opacity: 1 });
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
            {/* ── Cinematic title card ── */}
            <div
                ref={labelRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 50,
                    opacity: 0,
                    background: 'radial-gradient(ellipse 90% 65% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 100%)',
                }}
            >
                {/* Top accent bar */}
                <div
                    ref={barTopRef}
                    style={{
                        width: '36%',
                        maxWidth: '400px',
                        height: '3px',
                        background: `linear-gradient(90deg, ${categoryAccent}, rgba(255,255,255,0.65))`,
                        borderRadius: '2px',
                        marginBottom: '1rem',
                    }}
                />

                {/* Sub-label */}
                <div
                    ref={subLabelRef}
                    style={{
                        fontFamily: '"Barlow Condensed", "Plus Jakarta Sans", sans-serif',
                        fontWeight: 700,
                        fontSize: 'clamp(0.55rem, 1.1vw, 0.82rem)',
                        letterSpacing: '0.45em',
                        color: categoryAccent,
                        textTransform: 'uppercase',
                        marginBottom: '0.5rem',
                        opacity: 0,
                    }}
                >
                    Now Displaying
                </div>

                {/* Title — hard clip via overflow:hidden on parent */}
                <div
                    ref={titleClipRef}
                    style={{
                        overflow: 'hidden',
                        paddingBottom: '0.06em',
                        paddingTop: '0.02em',
                    }}
                >
                    <div
                        ref={titleRef}
                        style={{
                            fontFamily: '"Barlow Condensed", sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(5rem, 15vw, 12rem)',
                            lineHeight: 0.9,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {categoryName}
                    </div>
                </div>

                {/* Bottom accent bar */}
                <div
                    ref={barBotRef}
                    style={{
                        width: '36%',
                        maxWidth: '400px',
                        height: '3px',
                        background: `linear-gradient(90deg, rgba(255,255,255,0.65), ${categoryAccent})`,
                        borderRadius: '2px',
                        marginTop: '1rem',
                    }}
                />
            </div>

            {/* Product content */}
            <div ref={contentRef} style={{ width: '100%', height: '100%' }}>
                {children}
            </div>
        </div>
    );
}
