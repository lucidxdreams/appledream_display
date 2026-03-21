/**
 * NeuralConstellation.jsx — "Candy Carousel" Edibles Display
 *
 * Cinematic 3-D carousel:
 *  · Center card: full-resolution hero with large image + all details
 *  · Side cards: scaled, blurred, faded — feed in from both sides
 *  · Far cards: barely visible silhouettes at screen edges
 *  · Auto-advances every 5 s; manual navigation resets timer
 *  · Aurora orb background + sparkle particles preserved
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import './NeuralConstellation.css';

/* ── Color helpers ───────────────────────────────────────────────── */
function hslToRgb(h, s, l) {
    // h,s,l all in [0,1]
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h * 12) % 12;
        return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
    };
    return [f(0), f(8), f(4)];
}

function toHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbStr(r, g, b, a) {
    return a !== undefined ? `rgba(${r},${g},${b},${a})` : `rgb(${r},${g},${b})`;
}

/*
 * Hue-bucket quantizer:
 *  1. Downscale image to 48×48 on a canvas.
 *  2. Distribute colorful pixels (skip near-white / near-black / near-grey) into
 *     36 hue buckets.
 *  3. Score each bucket: sat^1.5 × coverage^0.5 — favours vivid AND common hues.
 *  4. Return the winning hue in [0,1] plus its average saturation.
 */
function extractDominantHue(img) {
    const SIZE = 48;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

    const HUE_N = 36;
    const buckets = Array.from({ length: HUE_N }, () => ({ count: 0, satSum: 0 }));
    let total = 0;

    for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 128) continue;
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        if (l > 0.92 || l < 0.05) continue;           // skip white / black
        const d = max - min;
        const s = max === 0 ? 0 : d / max;             // HSV saturation
        if (s < 0.18) continue;                         // skip greys

        let h = 0;
        if      (max === r) h = ((g - b) / d + 6) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else                h = (r - g) / d + 4;
        h /= 6;

        const bi = Math.floor(h * HUE_N) % HUE_N;
        buckets[bi].count++;
        buckets[bi].satSum += s;
        total++;
    }

    if (total === 0) return null;

    let bestScore = -1, bestBucket = -1;
    for (let i = 0; i < HUE_N; i++) {
        if (!buckets[i].count) continue;
        const avgSat   = buckets[i].satSum / buckets[i].count;
        const coverage = buckets[i].count / total;
        const score    = Math.pow(avgSat, 1.5) * Math.pow(coverage, 0.5);
        if (score > bestScore) { bestScore = score; bestBucket = i; }
    }
    if (bestBucket === -1) return null;

    const hue = (bestBucket + 0.5) / HUE_N;
    const sat = Math.min(1, Math.max(0.60, buckets[bestBucket].satSum / buckets[bestBucket].count));
    return { hue, sat };
}

/*
 * Build a harmonious 12-variable palette from a single hue + saturation.
 * All variants are derived via color theory — no random sampling.
 *
 *  vibrant  → S=sat*1.05, L=0.50  — the primary accent
 *  light    → S=sat*0.65, L=0.82  — readable text / labels
 *  dark     → S=1.00,     L=0.22  — deep shadow / gradient base
 *  muted    → S=sat*0.75, L=0.44  — chip background hue
 */
function buildPaletteFromHue(hue, sat) {
    const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
    const V  = hslToRgb(hue, clamp(sat * 1.05), 0.50);  // vibrant
    const L  = hslToRgb(hue, clamp(sat * 0.65), 0.82);  // light
    const D  = hslToRgb(hue, clamp(sat),        0.22);  // dark
    const M  = hslToRgb(hue, clamp(sat * 0.80), 0.44);  // muted
    return {
        halo:      toHex(...V),
        glow:      rgbStr(...V, 0.58),
        glowSm:    rgbStr(...V, 0.20),
        border:    rgbStr(...V, 0.52),
        mg:        toHex(...L),
        mgBg:      rgbStr(...V, 0.22),
        chip:      rgbStr(...M, 0.24),
        chipTxt:   toHex(...L),
        grad1:     toHex(...D),
        grad2:     toHex(...V),
        bar:       `linear-gradient(135deg,${toHex(...D)},${toHex(...V)})`,
        spotlight: rgbStr(...V, 0.22),
    };
}

/* ── Strain palettes ─────────────────────────────────────────────── */
const PALETTES = {
    indica: {
        halo: '#8b5cf6', glow: 'rgba(139,92,246,0.55)', glowSm: 'rgba(139,92,246,0.18)',
        border: 'rgba(139,92,246,0.5)', mg: '#c4b5fd', mgBg: 'rgba(139,92,246,0.25)',
        chip: 'rgba(139,92,246,0.2)', chipTxt: '#c4b5fd',
        grad1: '#8b5cf6', grad2: '#c084fc', bar: 'linear-gradient(135deg,#7c3aed,#a855f7)',
        label: 'Indica', aurora: '#7c3aed', spotlight: 'rgba(139,92,246,0.22)',
    },
    sativa: {
        halo: '#f59e0b', glow: 'rgba(245,158,11,0.55)', glowSm: 'rgba(245,158,11,0.18)',
        border: 'rgba(245,158,11,0.5)', mg: '#fde68a', mgBg: 'rgba(245,158,11,0.25)',
        chip: 'rgba(245,158,11,0.2)', chipTxt: '#fde68a',
        grad1: '#f59e0b', grad2: '#fbbf24', bar: 'linear-gradient(135deg,#d97706,#f59e0b)',
        label: 'Sativa', aurora: '#d97706', spotlight: 'rgba(245,158,11,0.18)',
    },
    hybrid: {
        halo: '#10b981', glow: 'rgba(16,185,129,0.55)', glowSm: 'rgba(16,185,129,0.18)',
        border: 'rgba(16,185,129,0.5)', mg: '#6ee7b7', mgBg: 'rgba(16,185,129,0.25)',
        chip: 'rgba(16,185,129,0.2)', chipTxt: '#6ee7b7',
        grad1: '#10b981', grad2: '#34d399', bar: 'linear-gradient(135deg,#059669,#10b981)',
        label: 'Hybrid', aurora: '#059669', spotlight: 'rgba(16,185,129,0.18)',
    },
};

/* ── Extract dominant palette from product image ────────────────── */
function useImagePalette(imageUrl) {
    const [palette, setPalette] = useState(null);
    useEffect(() => {
        if (!imageUrl) { setPalette(null); return; }
        let cancelled = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (cancelled) return;
            try {
                const result = extractDominantHue(img);
                if (!result) { setPalette(null); return; }
                setPalette(buildPaletteFromHue(result.hue, result.sat));
            } catch { if (!cancelled) setPalette(null); }
        };
        img.onerror = () => { if (!cancelled) setPalette(null); };
        img.src = imageUrl;
        return () => { cancelled = true; };
    }, [imageUrl]);
    return palette;
}

function getStrain(p) {
    const t = (p.type || '').toLowerCase();
    if (t.includes('indica')) return 'indica';
    if (t.includes('sativa')) return 'sativa';
    return 'hybrid';
}

/* ── Floating orb background (canvas) ───────────────────────────── */
function AuroraOrbs({ W, H }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !W || !H) return;
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const ORB_COLORS = [
            ['#7c3aed', '#a855f7'],
            ['#d97706', '#f59e0b'],
            ['#059669', '#10b981'],
            ['#db2777', '#f472b6'],
            ['#0ea5e9', '#38bdf8'],
        ];

        const orbs = ORB_COLORS.map(([c1, c2], i) => ({
            x: (W / ORB_COLORS.length) * i + W / ORB_COLORS.length / 2,
            y: H * (0.3 + Math.random() * 0.4),
            r: Math.min(W, H) * (0.22 + Math.random() * 0.18),
            c1, c2,
            speed: 0.15 + Math.random() * 0.1,
            offset: Math.random() * Math.PI * 2,
        }));

        let t = 0;

        function draw() {
            ctx.clearRect(0, 0, W, H);
            for (const o of orbs) {
                const dx = Math.sin(t * o.speed + o.offset) * W * 0.06;
                const dy = Math.cos(t * o.speed * 0.7 + o.offset) * H * 0.06;
                const grd = ctx.createRadialGradient(o.x + dx, o.y + dy, 0, o.x + dx, o.y + dy, o.r);
                grd.addColorStop(0, o.c1 + '28');   // ~15% opacity
                grd.addColorStop(1, o.c2 + '00');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(o.x + dx, o.y + dy, o.r, 0, Math.PI * 2);
                ctx.fill();
            }
            t += 0.008;
            rafRef.current = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [W, H]);

    return (
        <canvas ref={canvasRef}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, width: W, height: H }} />
    );
}

/* ── Sparkle particles ────────────────────────────────────────── */
function Sparkles({ W, H }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !W || !H) return;
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const COLS = ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#fff', '#60a5fa'];
        const pts = Array.from({ length: 70 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.5 + 0.3,
            col: COLS[Math.floor(Math.random() * COLS.length)],
            life: Math.random(),
            spd: 0.003 + Math.random() * 0.004,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -(Math.random() * 0.4 + 0.1),
        }));

        function draw() {
            ctx.clearRect(0, 0, W, H);
            for (const p of pts) {
                p.life += p.spd;
                if (p.life > 1) { p.life = 0; p.x = Math.random() * W; p.y = H + 4; }
                p.x += p.vx; p.y += p.vy;
                const a = Math.sin(p.life * Math.PI) * 0.55;
                ctx.save();
                ctx.globalAlpha = a;
                ctx.shadowBlur = 5;
                ctx.shadowColor = p.col;
                ctx.fillStyle = p.col;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            rafRef.current = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [W, H]);

    return (
        <canvas ref={canvasRef}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, width: W, height: H }} />
    );
}

/* ── Hero Card (center spotlight) ───────────────────────────────── */
function HeroCard({ product }) {
    const strain = getStrain(product);
    const extracted = useImagePalette(product.imageUrl);
    const pal = extracted || PALETTES[strain];
    const effects = (product.effects || []).slice(0, 4);
    const thcMg = product.thcMg || product.thc || 0;
    const pieces = product.pieceCount;
    const price = Number(product.price || 0).toFixed(2);

    return (
        <div className="ec-hero-card" style={{
            '--pal-halo': pal.halo, '--pal-glow': pal.glow, '--pal-glow-sm': pal.glowSm,
            '--pal-border': pal.border, '--pal-mg': pal.mg, '--pal-mg-bg': pal.mgBg,
            '--pal-chip': pal.chip, '--pal-chip-txt': pal.chipTxt,
            '--pal-grad1': pal.grad1, '--pal-grad2': pal.grad2, '--pal-bar': pal.bar,
        }}>
            <div className="ec-hero-topline" />

            {/* Clean floating image — no rings, no dark circle */}
            <div className="ec-hero-img-area">
                <div className="ec-hero-img-bg" />
                {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="ec-hero-img" />
                    : <span className="ec-hero-emoji">🍬</span>
                }
                <div className="ec-hero-img-shadow" />
            </div>

            {/* Divider with centred strain pill straddling the line */}
            <div className="ec-hero-divider-wrap">
                <div className="ec-hero-divider" />
                <span className="ec-hero-strain-pill">{pal.label}</span>
            </div>

            {/* Text content */}
            <div className="ec-hero-content">
                {product.brand && <div className="ec-hero-brand">{product.brand}</div>}
                <div className="ec-hero-name">{product.name}</div>
                {effects.length > 0 && (
                    <div className="ec-hero-effects">
                        {effects.map(e => <span key={e} className="ec-chip">{e}</span>)}
                    </div>
                )}
                {product.notes && <div className="ec-hero-notes">{product.notes}</div>}
            </div>

            {/* Bottom strip: strain | mg THC | pcs | price */}
            <div className="ec-hero-bottom-row">
                <div className="ec-hero-meta">
                    {thcMg > 0 && (
                        <div className="ec-hero-thc">
                            <span className="ec-hero-thc-val">{thcMg}</span>
                            <span className="ec-hero-thc-unit">mg THC</span>
                        </div>
                    )}
                    {pieces && (
                        <div className="ec-hero-pieces">
                            <span className="ec-hero-pieces-val">{pieces}</span>
                            <span className="ec-hero-pieces-unit">pcs</span>
                        </div>
                    )}
                </div>
                <div className="ec-hero-price">${price}</div>
            </div>
        </div>
    );
}

/* ── Side Card ──────────────────────────────────────────────────── */
function SideCard({ product }) {
    const strain = getStrain(product);
    const extracted = useImagePalette(product.imageUrl);
    const pal = extracted || PALETTES[strain];
    const thcMg = product.thcMg || product.thc || 0;
    const pieces = product.pieceCount;
    const price = Number(product.price || 0).toFixed(2);

    return (
        <div className="ec-side-card" style={{
            '--pal-halo': pal.halo, '--pal-glow': pal.glow, '--pal-border': pal.border,
            '--pal-mg': pal.mg, '--pal-mg-bg': pal.mgBg,
            '--pal-grad1': pal.grad1, '--pal-grad2': pal.grad2,
        }}>
            <div className="ec-side-topline" />
            <div className="ec-side-img-area">
                {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="ec-side-img" />
                    : <span className="ec-side-emoji">🍬</span>
                }
            </div>
            <div className="ec-side-divider-wrap">
                <div className="ec-side-divider" />
                <span className="ec-side-strain">{pal.label}</span>
            </div>
            <div className="ec-side-content">
                {product.brand && <div className="ec-side-brand">{product.brand}</div>}
                <div className="ec-side-name">{product.name}</div>
            </div>
            <div className="ec-side-bottom-row">
                <div className="ec-side-meta">
                    {thcMg > 0 && (
                        <div className="ec-side-thc">
                            <span className="ec-side-thc-val">{thcMg}</span>
                            <span className="ec-side-thc-unit">mg THC</span>
                        </div>
                    )}
                    {pieces && (
                        <div className="ec-side-thc">
                            <span className="ec-side-thc-val">{pieces}</span>
                            <span className="ec-side-thc-unit">pcs</span>
                        </div>
                    )}
                </div>
                <div className="ec-side-price">${price}</div>
            </div>
        </div>
    );
}

/* ── Carousel slot definitions ──────────────────────────────────── */
const SLOTS = [
    { offset: -2, xFrac: -0.310, scale: 0.44, opacity: 0.20, z: 1, blur: 3.5 },
    { offset: -1, xFrac: -0.195, scale: 0.66, opacity: 0.56, z: 2, blur: 1.5 },
    { offset:  0, xFrac:  0,     scale: 1.00, opacity: 1.00, z: 5, blur: 0   },
    { offset:  1, xFrac:  0.195, scale: 0.66, opacity: 0.56, z: 2, blur: 1.5 },
    { offset:  2, xFrac:  0.310, scale: 0.44, opacity: 0.20, z: 1, blur: 3.5 },
];

const AUTO_INTERVAL = 5000;

/* ── Main carousel ──────────────────────────────────────────────── */
export default function NeuralConstellation({ products = [], categoryTheme, onAllShown }) {
    const containerRef = useRef(null);
    const [dim, setDim] = useState({ W: 1280, H: 720 });
    const [activeIdx, setActiveIdx] = useState(0);
    const timerRef = useRef(null);
    const onAllShownRef = useRef(onAllShown);
    const prevActiveIdxRef = useRef(0);
    const n = products.length;

    useEffect(() => { onAllShownRef.current = onAllShown; }, [onAllShown]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => { if (el) setDim({ W: el.clientWidth || 1280, H: el.clientHeight || 720 }); };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const startTimer = useCallback(() => {
        clearInterval(timerRef.current);
        if (n === 0) return;
        if (n === 1) {
            timerRef.current = setInterval(() => onAllShownRef.current?.(), AUTO_INTERVAL);
            return;
        }
        timerRef.current = setInterval(() => setActiveIdx(i => (i + 1) % n), AUTO_INTERVAL);
    }, [n]);

    // Detect full cycle (activeIdx wraps from any non-zero back to 0)
    useEffect(() => {
        if (n > 1 && prevActiveIdxRef.current > 0 && activeIdx === 0) {
            onAllShownRef.current?.();
        }
        prevActiveIdxRef.current = activeIdx;
    }, [activeIdx, n]);

    useEffect(() => {
        startTimer();
        return () => clearInterval(timerRef.current);
    }, [startTimer]);

    const goTo = useCallback((idx) => {
        setActiveIdx(((idx % n) + n) % n);
        startTimer();
    }, [n, startTimer]);

    if (n === 0) return <div className="ec-scene"><div className="ec-bg" /></div>;

    const { W, H } = dim;
    const activePal = PALETTES[getStrain(products[activeIdx])];

    const visibleCards = SLOTS.map(slot => ({
        ...slot,
        prodIdx: ((activeIdx + slot.offset) % n + n) % n,
        x: W / 2 + slot.xFrac * W,
    }));

    return (
        <div ref={containerRef} className="ec-scene"
            style={{ width: '100%', height: '100%', '--accent': categoryTheme?.accent || '#c06c84' }}>

            <div className="ec-bg" />
            <AuroraOrbs W={W} H={H} />
            <Sparkles W={W} H={H} />

            {/* Dynamic spotlight behind center card */}
            <div className="ec-spotlight" style={{
                background: `radial-gradient(ellipse 38% 62% at 50% 58%, ${activePal.spotlight} 0%, transparent 72%)`,
            }} />

            {/* Carousel track */}
            <div className="ec-track">
                {visibleCards.map(({ offset, prodIdx, x, scale, opacity, z, blur }) => {
                    const product = products[prodIdx];
                    const isHero = offset === 0;
                    const cardW = isHero ? Math.min(W * 0.224, 544) : Math.min(W * 0.16, 400);
                    const cardH = Math.min(H * 0.592, 656);
                    return (
                        <div
                            key={`slot-${offset}`}
                            className="ec-card-slot"
                            style={{
                                position: 'absolute',
                                left: x - cardW / 2,
                                top: '52%',
                                ...(isHero
                                    ? { transform: `translateY(-50%) scale(${scale})` }
                                    : { marginTop: -cardH / 2, height: cardH, transform: `scale(${scale})` }
                                ),
                                width: cardW,
                                transformOrigin: 'center center',
                                opacity,
                                zIndex: z,
                                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                                cursor: offset !== 0 ? 'pointer' : 'default',
                                transition: 'left 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1), opacity 0.55s cubic-bezier(0.16,1,0.3,1), filter 0.55s ease',
                            }}
                            onClick={() => offset !== 0 && goTo(prodIdx)}
                        >
                            {isHero ? <HeroCard product={product} /> : <SideCard product={product} />}
                        </div>
                    );
                })}
            </div>

            {/* Prev / Next arrows */}
            {n > 1 && (
                <>
                    <button className="ec-arrow ec-arrow--prev" onClick={() => goTo(activeIdx - 1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button className="ec-arrow ec-arrow--next" onClick={() => goTo(activeIdx + 1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </>
            )}

        </div>
    );
}
