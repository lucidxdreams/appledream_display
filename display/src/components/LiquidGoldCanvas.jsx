import { useRef, useEffect } from 'react';

export default function LiquidGoldCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        // Match the extremely dark ambient level of other categories
        const bgClear = '#040200';

        const blobs = Array.from({ length: 12 }, () => {
            return {
                x: Math.random(), // 0 to 1
                y: Math.random(),
                vx: (Math.random() - 0.5) * 0.0018,
                vy: (Math.random() - 0.5) * 0.0018,
                r: 0.2 + Math.random() * 0.35, // huge radius
                hue: 35 + Math.random() * 12, // 35-47 (deep amber to raw honey)
                sat: 85 + Math.random() * 15,
                lit: 25 + Math.random() * 15, // Much darker base lightness
                pulseSpd: 0.005 + Math.random() * 0.015,
                pulseTh: Math.random() * Math.PI * 2
            };
        });

        let w, h;
        const resize = () => {
            w = canvas.offsetWidth;
            h = canvas.offsetHeight;
            // Limit to 1080p equivalent internally to ensure blazing fast CPU canvas drawing
            const scaleW = Math.min(1920, w) / w;
            const scaleH = Math.min(1080, h) / h;
            const scale = Math.min(scaleW, scaleH, window.devicePixelRatio || 1);
            canvas.width = w * scale;
            canvas.height = h * scale;
            ctx.scale(scale, scale);
        };
        resize();
        
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        let raf;
        const draw = () => {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = bgClear;
            ctx.fillRect(0, 0, w, h);
            
            // Subtle ambient additive blending
            ctx.globalCompositeOperation = 'screen';
            
            for (const b of blobs) {
                b.x += b.vx;
                b.y += b.vy;
                b.pulseTh += b.pulseSpd;

                // Seamless wraparound
                if (b.x < -0.4) b.x = 1.4;
                if (b.x > 1.4) b.x = -0.4;
                if (b.y < -0.4) b.y = 1.4;
                if (b.y > 1.4) b.y = -0.4;

                // Pulsate size slightly mimicking heat expansion
                const animR = b.r * (1 + 0.1 * Math.sin(b.pulseTh));

                const rad = animR * Math.max(w, h);
                const cx = b.x * w;
                const cy = b.y * h;

                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
                grad.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, ${b.lit}%, 0.18)`);
                grad.addColorStop(0.4, `hsla(${b.hue}, ${b.sat}%, ${b.lit - 10}%, 0.05)`);
                grad.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, 2%, 0)`);

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, rad, 0, Math.PI * 2);
                ctx.fill();
            }

            raf = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            ro.disconnect();
            cancelAnimationFrame(raf);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}
