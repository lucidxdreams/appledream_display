/**
 * useFloatingLayout.js — Shared floating layout engine for all product displays.
 *
 * Uses D3 force simulation with CUSTOM RECTANGULAR (AABB) collision detection.
 *
 * Key design decisions:
 *   - GRID-FIT sizing: calculates the largest card that fits N cards in available space
 *   - Random initial placement (NOT grid) → organic, unstructured look
 *   - Collision with HIGH minimum strength floor (0.2) → never fades
 *   - Strong charge repulsion → spreads products across the full display
 *   - Adaptive centering: stronger for few products, weaker for many
 */

import { useMemo } from 'react';
import {
    forceSimulation,
    forceX,
    forceY,
    forceManyBody,
} from 'd3-force';

/* ────────────────────────────────────────────────────────────────────
   Rectangular (AABB) Collision Force
   ──────────────────────────────────────────────────────────────────── */
function forceRectCollide(gap) {
    let nodes;

    function force(alpha) {
        const str = Math.max(alpha * 1.5, 0.2);

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];

                const dx = b.x - a.x;
                const dy = b.y - a.y;

                const minDistX = a.hw + b.hw + gap;
                const minDistY = a.hh + b.hh + gap;

                const overlapX = minDistX - Math.abs(dx);
                const overlapY = minDistY - Math.abs(dy);

                if (overlapX > 0 && overlapY > 0) {
                    if (overlapX < overlapY) {
                        const push = overlapX * 0.5 * str;
                        const sign = dx >= 0 ? 1 : -1;
                        a.vx -= push * sign;
                        b.vx += push * sign;
                    } else {
                        const push = overlapY * 0.5 * str;
                        const sign = dy >= 0 ? 1 : -1;
                        a.vy -= push * sign;
                        b.vy += push * sign;
                    }
                }
            }
        }
    }

    force.initialize = (n) => { nodes = n; };
    return force;
}

/* ────────────────────────────────────────────────────────────────────
   Boundary Force — keeps cards inside safe area, never fades.
   ──────────────────────────────────────────────────────────────────── */
function createBoundaryForce(safeLeft, safeRight, safeTop, safeBottom) {
    let nodes;

    function force(alpha) {
        const str = Math.max(alpha, 0.2) * 0.8;
        for (const n of nodes) {
            if (n.x < safeLeft)       n.vx += (safeLeft - n.x) * str;
            else if (n.x > safeRight) n.vx += (safeRight - n.x) * str;
            if (n.y < safeTop)         n.vy += (safeTop - n.y) * str;
            else if (n.y > safeBottom) n.vy += (safeBottom - n.y) * str;
        }
    }

    force.initialize = (n) => { nodes = n; };
    return force;
}

/* ────────────────────────────────────────────────────────────────────
   Main Hook: useFloatingLayout
   ──────────────────────────────────────────────────────────────────── */
export function useFloatingLayout({
    products,
    containerW,
    containerH,
    baseCardW,
    baseCardH,
    headerReserved = 180,
    footerReserved = 30,
    gap = 30,
}) {
    return useMemo(() => {
        const count = products.length;
        if (!count || !containerW || !containerH) {
            return { positions: [], cardW: baseCardW, cardH: baseCardH };
        }

        const isFew = count <= 8;

        // ── Available area ──
        const availW = containerW - 40;
        const availH = containerH - headerReserved - footerReserved;

        if (availH <= 50 || availW <= 50) {
            return {
                positions: products.map(() => ({ x: containerW / 2, y: containerH / 2 })),
                cardW: baseCardW * 0.4,
                cardH: baseCardH * 0.4,
            };
        }

        // ── RESPONSIVE card sizing — scale down when many products ──
        // Target 72% packing so the simulation can resolve without overlap.
        const maxPacking = 0.72;
        const perCardArea = (availW * availH * maxPacking) / count;
        const aspectRatio = baseCardW / baseCardH;
        const rawCardH = Math.sqrt(perCardArea / aspectRatio);
        const rawCardW = rawCardH * aspectRatio;
        const cardH = Math.min(baseCardH, Math.max(baseCardH * 0.45, rawCardH));
        const cardW = Math.min(baseCardW, Math.max(baseCardW * 0.45, rawCardW));

        const hw = cardW / 2;
        const hh = cardH / 2;

        // ── Safe bounds for card CENTERS ──
        const safeLeft   = hw + 20;
        const safeRight  = containerW - hw - 20;
        const safeTop    = headerReserved + hh + 10;
        const safeBottom = containerH - footerReserved - hh - 10;

        if (safeRight <= safeLeft || safeBottom <= safeTop) {
            return {
                positions: products.map(() => ({ x: containerW / 2, y: containerH / 2 })),
                cardW, cardH,
            };
        }

        const centerX = (safeLeft + safeRight) / 2;
        // For few products, use visual center (slightly above page mid) instead of
        // safe-area center which is pushed low by headerReserved.
        const safeAreaCenterY = (safeTop + safeBottom) / 2;
        const visualCenterY = containerH * 0.45;
        const centerY = isFew
            ? Math.max(safeTop, Math.min(safeBottom, visualCenterY))
            : safeAreaCenterY;
        const spreadX = safeRight - safeLeft;
        const spreadY = safeBottom - safeTop;

        // ── Initial placement ──
        // isFew: grid-scatter across the full safe area (prevents row convergence)
        // many:  uniform random across full safe area
        const isFewCols = Math.max(1, Math.round(Math.sqrt(count * (spreadX / Math.max(spreadY, 1)))));
        const isFewRows = Math.ceil(count / isFewCols);
        const isFewCellW = spreadX / isFewCols;
        const isFewCellH = spreadY / Math.max(isFewRows, 1);

        const nodes = products.map((p, i) => {
            let x, y;
            if (isFew) {
                // Distribute evenly across safe area in a grid, then add jitter
                x = safeLeft + (i % isFewCols + 0.5) * isFewCellW + (Math.random() - 0.5) * isFewCellW * 0.4;
                y = safeTop  + (Math.floor(i / isFewCols) + 0.5) * isFewCellH + (Math.random() - 0.5) * isFewCellH * 0.4;
            } else {
                x = safeLeft + Math.random() * spreadX;
                y = safeTop  + Math.random() * spreadY;
            }
            return {
                id: p.id || i,
                index: i,
                hw,
                hh,
                x,
                y,
                vx: 0,
                vy: 0,
            };
        });

        // ── D3 force simulation ──
        // Scale forces with viewport area so larger viewports (e.g. 50% zoom)
        // get stronger repulsion and weaker centering to prevent clustering.
        const baseArea = 1920 * 900;
        const currentArea = spreadX * spreadY;
        const areaScale = Math.max(1, Math.sqrt(currentArea / baseArea));

        const sim = forceSimulation(nodes)
            .velocityDecay(0.22)
            .alphaDecay(0.005)
            .force('rectCollide', forceRectCollide(gap))
            .force('x', forceX(centerX).strength(isFew ? 0.005 : 0.003 / areaScale))
            .force('y', forceY(centerY).strength(isFew ? 0.005 : 0.005 / areaScale))
            .force('charge', forceManyBody().strength(isFew ? -180 : -120 * areaScale))
            .force('boundary', createBoundaryForce(safeLeft, safeRight, safeTop, safeBottom))
            .stop();

        for (let i = 0; i < 700; i++) sim.tick();

        // ── Final hard clamp ──
        const positions = nodes.map(n => ({
            x: Math.max(safeLeft, Math.min(safeRight, n.x)),
            y: Math.max(safeTop, Math.min(safeBottom, n.y)),
        }));

        return { positions, cardW, cardH };
    }, [products.length, containerW, containerH, baseCardW, baseCardH, headerReserved, footerReserved, gap]);
}
