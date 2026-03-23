/**
 * BubbleCard.jsx
 *
 * Realistic 3D iridescent bubble product card for the Flowers category.
 * Uses @react-three/fiber + @react-three/drei MeshDistortMaterial.
 * Cycles info every 7s: Image+Name+Price → THC/CBD → Terpenes/Effects
 *
 * Props:
 *   product : Firestore product object
 *   size    : number (diameter in px)
 */

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment } from '@react-three/drei';
import './BubbleCard.css';

const INFO_LAYERS = ['main', 'stats', 'terpenes'];
const CYCLE_MS = 7000;

function formatPrice(price) {
    if (price == null) return '';
    return `$${Number(price).toFixed(2)}`;
}

function BubbleMesh() {
    return (
        <mesh>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshDistortMaterial
                distort={0.25}
                transmission={1.05}
                thickness={-0.5}
                roughness={0}
                iridescence={1}
                iridescenceIOR={1}
                iridescenceThicknessRange={[0, 1200]}
                clearcoat={1}
                clearcoatRoughness={0}
                envMapIntensity={1.5}
            />
        </mesh>
    );
}

export default function BubbleCard({ product, size }) {
    const [layerIndex, setLayerIndex] = useState(0);
    const [animating, setAnimating] = useState(false);
    const diameter = size || 180;

    useEffect(() => {
        let animTimeout = null;
        const timer = setInterval(() => {
            setAnimating(true);
            animTimeout = setTimeout(() => {
                setLayerIndex((i) => (i + 1) % INFO_LAYERS.length);
                setAnimating(false);
            }, 400);
        }, CYCLE_MS);
        return () => {
            clearInterval(timer);
            if (animTimeout) clearTimeout(animTimeout);
        };
    }, []);

    const layer = INFO_LAYERS[layerIndex];

    return (
        <div className="bubble-card" style={{ width: diameter, height: diameter }}>
            {/* 3D Bubble Canvas */}
            <Canvas
                gl={{ alpha: true }}
                camera={{ fov: 50, position: [0, 0, 2.8] }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
                <Float floatIntensity={1.2} speed={0.5} rotationIntensity={0.3}>
                    <BubbleMesh />
                </Float>
                <Environment preset="apartment" />
            </Canvas>

            {/* Product Info Overlay */}
            <div className={`bubble-card__overlay${animating ? ' bubble-card__overlay--fade' : ''}`}>
                {layer === 'main' && (
                    <div className="bubble-layer">
                        {product.imageUrl && (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="bubble-img"
                            />
                        )}
                        <p className="bubble-name">{product.name}</p>
                        <p className="bubble-price">{formatPrice(product.price)}</p>
                    </div>
                )}
                {layer === 'stats' && (
                    <div className="bubble-layer">
                        {product.thc != null && (
                            <div className="bubble-stat">
                                <span className="bubble-stat__label">THC</span>
                                <span className="bubble-stat__value">{product.thc}%</span>
                            </div>
                        )}
                        {product.cbd != null && (
                            <div className="bubble-stat">
                                <span className="bubble-stat__label">CBD</span>
                                <span className="bubble-stat__value">{product.cbd}%</span>
                            </div>
                        )}
                        {product.strainType && (
                            <span className="bubble-badge">{product.strainType}</span>
                        )}
                    </div>
                )}
                {layer === 'terpenes' && (
                    <div className="bubble-layer">
                        {product.terpenes?.length > 0 && (
                            <p className="bubble-terpenes">{product.terpenes.join(' · ')}</p>
                        )}
                        {product.effects?.length > 0 && (
                            <p className="bubble-effects">{product.effects.join(' · ')}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
