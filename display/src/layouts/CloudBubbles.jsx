import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import './CloudBubbles.css';

export default function CloudBubbles({ products, categoryTheme }) {
    const containerRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);
    const [bodies, setBodies] = useState([]);

    useEffect(() => {
        if (!containerRef.current || products.length === 0) return;

        const Engine = Matter.Engine,
            Runner = Matter.Runner,
            World = Matter.World,
            Bodies = Matter.Bodies,
            Body = Matter.Body;

        const engine = Engine.create();
        // Zero gravity, we will use a central attractor force
        engine.world.gravity.y = 0;
        engine.world.gravity.x = 0;
        engineRef.current = engine;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Smart Scaling: Base radius based on product count to ensure fitting
        const area = width * height;
        const targetCoverage = 0.45; // 45% of screen area
        const perProductArea = (area * targetCoverage) / products.length;
        const baseRadius = Math.min(Math.sqrt(perProductArea / Math.PI), 160);

        const newBodies = products.map((p) => {
            const isLimited = (p.badge || '').toLowerCase() === 'limited';
            const r = isLimited ? baseRadius * 1.35 : baseRadius;

            // Start scattered in a wide circle
            const angle = Math.random() * Math.PI * 2;
            const dist = (Math.random() * width * 0.4) + width * 0.2;
            const x = width / 2 + Math.cos(angle) * dist;
            const y = height / 2 + Math.sin(angle) * dist;

            const body = Bodies.circle(x, y, r, {
                restitution: 0.8, // Bouncy
                friction: 0.05,
                frictionAir: 0.04,
                density: isLimited ? 0.002 : 0.001, // Heavier limited items
                render: { visible: false } // We render via React DOM
            });
            body.product = p;
            body.radius = r;
            return body;
        });

        World.add(engine.world, newBodies);

        // Invisible walls to absolutely constrain bubbles
        const wallOptions = { isStatic: true, render: { visible: false } };
        World.add(engine.world, [
            Bodies.rectangle(width / 2, -100, width * 2, 200, wallOptions),
            Bodies.rectangle(width / 2, height + 100, width * 2, 200, wallOptions),
            Bodies.rectangle(-100, height / 2, 200, height * 2, wallOptions),
            Bodies.rectangle(width + 100, height / 2, 200, height * 2, wallOptions),
        ]);

        const runner = Runner.create();
        Runner.run(runner, engine);

        const cx = width / 2;
        const cy = height / 2;

        const updateFn = () => {
            // Apply slight force towards the center dynamically
            newBodies.forEach(b => {
                const dx = cx - b.position.x;
                const dy = cy - b.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Normalize and apply force
                if (dist > 10) {
                    const forceMag = 0.000015 * b.mass; // pull mass evenly
                    const force = { x: (dx / dist) * forceMag, y: (dy / dist) * forceMag };
                    Body.applyForce(b, b.position, force);
                }

                // Apply a tiny bit of "cloud drift"
                const drift = { x: (Math.random() - 0.5) * 0.0003, y: (Math.random() - 0.5) * 0.0003 };
                Body.applyForce(b, b.position, drift);
            });

            setBodies([...newBodies]); // trigger React DOM render
            renderRef.current = requestAnimationFrame(updateFn);
        };
        updateFn();

        return () => {
            cancelAnimationFrame(renderRef.current);
            Runner.stop(runner);
            Engine.clear(engine);
        };
    }, [products]);

    return (
        <div className="cloud-bubbles-container" ref={containerRef}>
            {bodies.map((b) => {
                const isLimited = (b.product.badge || '').toLowerCase() === 'limited';

                // Scale factor for font responsiveness relative to bubble size
                const fontScale = b.radius / 100;

                return (
                    <div
                        key={b.product.id}
                        className="cloud-bubble-wrapper"
                        style={{
                            width: b.radius * 2,
                            height: b.radius * 2,
                            transform: `translate(${b.position.x - b.radius}px, ${b.position.y - b.radius}px)`,
                            '--theme-primary': categoryTheme?.primary || '#122418',
                            '--theme-accent': categoryTheme?.accent || '#6ab04c',
                            zIndex: isLimited ? 10 : 1
                        }}
                    >
                        <div className={`cloud-bubble ${isLimited ? 'cloud-bubble-limited' : ''}`}>
                            <div className="cloud-bubble-inner">
                                {/* SVG Background arcs for curved text badges */}
                                <svg className="bubble-arcs" viewBox="0 0 100 100">
                                    <defs>
                                        <path id={`leftArc-${b.product.id}`} d="M 50,98 A 48,48 0 0,1 50,2" fill="none" />
                                        <path id={`rightArc-${b.product.id}`} d="M 50,2 A 48,48 0 0,1 50,98" fill="none" />
                                    </defs>

                                    {/* CBD Badge */}
                                    {b.product.cbd > 0 && (
                                        <>
                                            <text stroke="#FFC107" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="#FFC107" fontSize="5.5" fontWeight="900" style={{ fontFamily: 'var(--font-display)' }}>
                                                <textPath href={`#leftArc-${b.product.id}`} startOffset="78%" textAnchor="middle">
                                                    CBD: {b.product.cbd}%
                                                </textPath>
                                            </text>
                                            <text fill="#ffffff" fontSize="5.5" fontWeight="900" style={{ fontFamily: 'var(--font-display)' }}>
                                                <textPath href={`#leftArc-${b.product.id}`} startOffset="78%" textAnchor="middle">
                                                    CBD: {b.product.cbd}%
                                                </textPath>
                                            </text>
                                        </>
                                    )}

                                    {/* THC Badge */}
                                    {b.product.thc > 0 && (
                                        <>
                                            <text stroke="#FF7043" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="#FF7043" fontSize="5.5" fontWeight="900" style={{ fontFamily: 'var(--font-display)' }}>
                                                <textPath href={`#leftArc-${b.product.id}`} startOffset="24%" textAnchor="middle">
                                                    THC: {b.product.thc}%
                                                </textPath>
                                            </text>
                                            <text fill="#ffffff" fontSize="5.5" fontWeight="900" style={{ fontFamily: 'var(--font-display)' }}>
                                                <textPath href={`#leftArc-${b.product.id}`} startOffset="24%" textAnchor="middle">
                                                    THC: {b.product.thc}%
                                                </textPath>
                                            </text>
                                        </>
                                    )}

                                    {/* Strain Type Badge */}
                                    {b.product.type && b.product.type !== 'N/A' && (
                                        <>
                                            <text stroke="#FF9800" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="#FF9800" fontSize="5.5" fontWeight="900" style={{ fontFamily: 'var(--font-display)' }}>
                                                <textPath href={`#rightArc-${b.product.id}`} startOffset="22%" textAnchor="middle">
                                                    {b.product.type}
                                                </textPath>
                                            </text>
                                            <text fill="#ffffff" fontSize="5.5" fontWeight="900" style={{ fontFamily: 'var(--font-display)' }}>
                                                <textPath href={`#rightArc-${b.product.id}`} startOffset="22%" textAnchor="middle">
                                                    {b.product.type}
                                                </textPath>
                                            </text>
                                        </>
                                    )}
                                </svg>

                                <div className="product-image-container">
                                    {b.product.imageUrl ? (
                                        <img src={b.product.imageUrl} alt={b.product.name} />
                                    ) : (
                                        <div className="cloud-bubble-placeholder">🌿</div>
                                    )}
                                </div>

                                <div className="cloud-bubble-info" style={{ fontSize: `${Math.max(0.7, fontScale)}rem` }}>
                                    <h3>{b.product.name}</h3>
                                    {b.product.notes && <div className="product-notes">{b.product.notes}</div>}
                                    <div className="price">
                                        ${Number(b.product.price || 0).toFixed(2)}
                                        {b.product.sellType === 'Weighted' ? '/g' : ''}
                                    </div>
                                </div>
                            </div>
                            {b.product.badge && <div className="cloud-badge">{b.product.badge}</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
