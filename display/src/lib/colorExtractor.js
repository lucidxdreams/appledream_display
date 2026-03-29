import { useState, useEffect } from 'react';

function hslToRgb(h, s, l) {
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

function extractSmartColor(img) {
    const SIZE = 100;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

    const bins = {};
    let maxBin = null;
    let maxScore = -1;

    for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 128) continue;
        
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const rN = r / 255, gN = g / 255, bN = b / 255;
        const maxC = Math.max(rN, gN, bN), minC = Math.min(rN, gN, bN);
        const l = (maxC + minC) / 2;
        
        if (l < 0.05 || l > 0.95) continue;
        
        const d = maxC - minC;
        const s = maxC === 0 ? 0 : d / maxC;

        const rBin = r >> 5, gBin = g >> 5, bBin = b >> 5;
        const key = (rBin << 6) | (gBin << 3) | bBin;

        if (!bins[key]) {
            bins[key] = { r: 0, g: 0, b: 0, s: 0, count: 0 };
        }
        
        bins[key].r += r;
        bins[key].g += g;
        bins[key].b += b;
        bins[key].s += s;
        bins[key].count++;
    }

    let hasColor = false;
    for (const key in bins) {
        const bin = bins[key];
        const avgSat = bin.s / bin.count;
        const score = bin.count * (avgSat > 0.08 ? Math.pow(avgSat, 2) * 200 : 1);

        if (score > maxScore) {
            maxScore = score;
            maxBin = bin;
            if (avgSat > 0.08) hasColor = true;
        }
    }

    if (!maxBin) return null;

    const avgR = maxBin.r / maxBin.count;
    const avgG = maxBin.g / maxBin.count;
    const avgB = maxBin.b / maxBin.count;

    const rN = avgR / 255, gN = avgG / 255, bN = avgB / 255;
    const maxC = Math.max(rN, gN, bN), minC = Math.min(rN, gN, bN);
    const d = maxC - minC;
    const s = maxC === 0 ? 0 : d / maxC;
    
    let h = 0;
    if (d > 0) {
        if (maxC === rN) h = ((gN - bN) / d + 6) % 6;
        else if (maxC === gN) h = (bN - rN) / d + 2;
        else h = (rN - gN) / d + 4;
        h /= 6;
    }

    return { hue: h, sat: hasColor ? s : 0, isMonochrome: !hasColor };
}

function buildPaletteFromHue(hue, sat, isMonochrome) {
    if (isMonochrome) {
        return {
            accent: '#ffffff',
            glow:   'rgba(255, 255, 255, 0.05)',
            border: 'rgba(255, 255, 255, 0.35)',
            text:   '#e4e4e7',
            saturated: '#ffffff'
        };
    }

    const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
    
    const V  = hslToRgb(hue, clamp(sat * 1.5), 0.60);
    const L  = hslToRgb(hue, clamp(sat * 0.8), 0.85);
    const HYPER = hslToRgb(hue, clamp(sat * 2.0), 0.50);

    return {
        accent: toHex(...V),
        glow:   rgbStr(...V, 0.20),
        border: rgbStr(...V, 0.50),
        text:   toHex(...L),
        saturated: toHex(...HYPER)
    };
}

export function useImagePalette(imageUrl) {
    const [palette, setPalette] = useState(null);
    useEffect(() => {
        if (!imageUrl) { setPalette(null); return; }
        let cancelled = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (cancelled) return;
            try {
                const result = extractSmartColor(img);
                if (!result) { setPalette(null); return; }
                setPalette(buildPaletteFromHue(result.hue, result.sat, result.isMonochrome));
            } catch { 
                if (!cancelled) setPalette(null); 
            }
        };
        img.onerror = () => { if (!cancelled) setPalette(null); };
        img.src = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=100&q=50&output=webp`;
        return () => { cancelled = true; };
    }, [imageUrl]);
    return palette;
}
