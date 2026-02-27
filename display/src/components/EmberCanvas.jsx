/**
 * EmberCanvas.jsx
 *
 * Canvas-based ember particle system for the Deals "Vault" page.
 * 60-80 small orange/red particles float upward from the bottom,
 * drift horizontally, and fade out as they rise.
 *
 * Positioned absolute, full screen, pointer-events: none.
 * GSAP controls opacity via the `.ember-canvas` class.
 */

import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 70;
const SPAWN_RATE = 3;   // new particles per frame
const MIN_RADIUS = 1;
const MAX_RADIUS = 2.5;
const MIN_SPEED = 0.004; // fraction of screen height per frame
const MAX_SPEED = 0.009;

function randomBetween(a, b) {
    return a + Math.random() * (b - a);
}

function createParticle(canvasW, canvasH) {
    return {
        x: randomBetween(0, canvasW),
        y: canvasH + randomBetween(0, 30),          // start below bottom
        vy: randomBetween(MIN_SPEED, MAX_SPEED) * canvasH, // px/frame
        vx: randomBetween(-0.4, 0.4),                // gentle drift
        radius: randomBetween(MIN_RADIUS, MAX_RADIUS),
        hue: randomBetween(20, 30),                   // orange-red
        lightness: randomBetween(50, 70),
        alpha: 1,
        life: 0,    // 0..1 (how far risen)
    };
}

export default function EmberCanvas() {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const particles = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let W = 0, H = 0;

        function resize() {
            W = canvas.width = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
        }

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        // Seed initial particles spread across screen
        particles.current = Array.from({ length: PARTICLE_COUNT }, () => {
            const p = createParticle(W, H);
            p.y = randomBetween(0, H); // pre-spread on first render
            return p;
        });

        function tick() {
            ctx.clearRect(0, 0, W, H);

            // Spawn new particles each frame
            for (let s = 0; s < SPAWN_RATE; s++) {
                if (particles.current.length < PARTICLE_COUNT * 1.5) {
                    particles.current.push(createParticle(W, H));
                }
            }

            // Update + draw
            particles.current = particles.current.filter((p) => p.alpha > 0.01);

            for (const p of particles.current) {
                p.y -= p.vy;
                p.x += p.vx;
                p.life = 1 - p.y / H;   // 0 when at bottom, 1 at top
                p.alpha = Math.max(0, 1 - p.life);

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 100%, ${p.lightness}%, ${p.alpha})`;
                ctx.fill();
            }

            rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="ember-canvas"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: 0,  // GSAP animates this to 1
                zIndex: 0,
            }}
        />
    );
}
