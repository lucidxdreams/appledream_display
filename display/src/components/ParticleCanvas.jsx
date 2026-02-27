/**
 * ParticleCanvas.jsx
 * 
 * Ambient canvas particle system.
 * Up to 80 particles float upward with subtle drift.
 * DPR-aware canvas for crisp rendering on Retina/4K displays.
 * Colors pulled from categoryAccent prop.
 */

import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 80;

function hexToRgb(hex) {
    const clean = hex.replace('#', '').trim();
    const bigint = parseInt(clean, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

function createParticle(W, H, color) {
    return {
        x: Math.random() * W,
        y: H + Math.random() * 40,
        size: Math.random() * 3 + 1,
        speedY: Math.random() * 0.6 + 0.3,
        drift: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.6 + 0.2,
        color,
    };
}

export default function ParticleCanvas({ categoryAccent }) {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const rafRef = useRef(null);
    const accentRef = useRef(categoryAccent || '#7cb518');
    const dprRef = useRef(Math.min(window.devicePixelRatio || 1, 2));

    // Update accent color ref when prop changes
    useEffect(() => {
        accentRef.current = categoryAccent || '#7cb518';
        particlesRef.current = particlesRef.current.map((p) => ({
            ...p,
            color: accentRef.current,
        }));
    }, [categoryAccent]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = dprRef.current;

        // Size canvas to full window, DPR-aware
        const resize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        const cssW = window.innerWidth;
        const cssH = window.innerHeight;

        // Spawn initial particles (capped at MAX_PARTICLES)
        const count = Math.min(MAX_PARTICLES, 50);
        particlesRef.current = Array.from({ length: count }, () =>
            createParticle(cssW, cssH, accentRef.current)
        );
        // Stagger initial y positions
        particlesRef.current = particlesRef.current.map((p) => ({
            ...p,
            y: Math.random() * cssH,
        }));

        const animate = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            ctx.clearRect(0, 0, w, h);

            // Hard cap: never exceed MAX_PARTICLES
            if (particlesRef.current.length > MAX_PARTICLES) {
                particlesRef.current = particlesRef.current.slice(0, MAX_PARTICLES);
            }

            particlesRef.current = particlesRef.current.map((p) => {
                const nextY = p.y - p.speedY;
                const nextX = p.x + p.drift;

                if (nextY < -10) {
                    return createParticle(w, h, accentRef.current);
                }

                const rgb = hexToRgb(p.color);
                ctx.beginPath();
                ctx.arc(nextX, nextY, p.size, 0, Math.PI * 2);

                const grad = ctx.createRadialGradient(nextX, nextY, 0, nextX, nextY, p.size * 2);
                grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity})`);
                grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
                ctx.fillStyle = grad;
                ctx.fill();

                return { ...p, x: nextX, y: nextY };
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 1,
                opacity: 0.8,
            }}
            aria-hidden="true"
        />
    );
}
