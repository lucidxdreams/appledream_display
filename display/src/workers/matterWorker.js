/**
 * matterWorker.js — Web Worker for Matter.js physics engine
 *
 * Offloads the BudUniverse physics simulation from the main thread.
 * Communicates body positions back via postMessage every animation frame.
 *
 * Messages IN:
 *   { type: 'init', products: [{id}], W, H, radii: [number] }
 *   { type: 'destroy' }
 *
 * Messages OUT:
 *   { type: 'positions', bodies: [{ id, x, y, r }] }
 */

import Matter from 'matter-js';

const { Engine, Bodies, Body, Runner, Events, Composite, World } = Matter;

let engine = null;
let runner = null;
let rafId = null;
let physicsBodies = [];
let productIds = [];
let radii = [];

function initWorld(products, W, H, radiiArr) {
    // Clean up any prior world
    cleanup();

    productIds = products.map((p) => p.id);
    radii = radiiArr;

    engine = Engine.create({ gravity: { x: 0, y: 0 } });

    const cx = W / 2;
    const cy = H / 2;

    // Create circular bodies — spiral placement
    physicsBodies = products.map((p, i) => {
        const r = radii[i];
        const angle = (i / products.length) * Math.PI * 2;
        const ring = Math.floor(i / 6) + 1;
        const dist = i === 0 ? 0 : Math.min(ring * r * 1.5, Math.min(cx, cy) * 0.75);
        const x = i === 0 ? cx : cx + Math.cos(angle) * dist;
        const y = i === 0 ? cy : cy + Math.sin(angle) * dist;

        const body = Bodies.circle(x, y, r, {
            restitution: 0.4,
            friction: 0.01,
            frictionAir: 0.04,
            label: p.id,
        });
        Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
        });
        return body;
    });

    Composite.add(engine.world, physicsBodies);

    // Central attractor + wall keepout
    Events.on(engine, 'beforeUpdate', () => {
        physicsBodies.forEach((body, i) => {
            const r = radii[i];

            // Attractor toward center
            const dx = cx - body.position.x;
            const dy = cy - body.position.y;
            const dist = Math.max(Math.hypot(dx, dy), 1);
            const strength = 0.0004 * body.mass;
            Body.applyForce(body, body.position, {
                x: (dx / dist) * strength,
                y: (dy / dist) * strength,
            });

            // Keep within bounds
            const margin = r + 10;
            if (body.position.x < margin)
                Body.applyForce(body, body.position, { x: 0.003 * body.mass, y: 0 });
            if (body.position.x > W - margin)
                Body.applyForce(body, body.position, { x: -0.003 * body.mass, y: 0 });
            if (body.position.y < margin)
                Body.applyForce(body, body.position, { x: 0, y: 0.003 * body.mass });
            if (body.position.y > H - margin)
                Body.applyForce(body, body.position, { x: 0, y: -0.003 * body.mass });
        });
    });

    runner = Runner.create();
    Runner.run(runner, engine);

    // Sync positions back to main thread
    function sync() {
        const bodies = physicsBodies.map((b, i) => ({
            id: productIds[i],
            x: b.position.x,
            y: b.position.y,
            r: radii[i],
        }));
        self.postMessage({ type: 'positions', bodies });
        rafId = requestAnimationFrame(sync);
    }
    rafId = requestAnimationFrame(sync);
}

function cleanup() {
    if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    if (runner) {
        Runner.stop(runner);
        runner = null;
    }
    if (engine) {
        World.clear(engine.world, false);
        Engine.clear(engine);
        engine = null;
    }
    physicsBodies = [];
    productIds = [];
    radii = [];
}

// ── Message handler ──────────────────────────────────────────────────────
self.onmessage = (e) => {
    const { type } = e.data;

    if (type === 'init') {
        const { products, W, H, radii: r } = e.data;
        initWorld(products, W, H, r);
    } else if (type === 'destroy') {
        cleanup();
        self.close();
    }
};
