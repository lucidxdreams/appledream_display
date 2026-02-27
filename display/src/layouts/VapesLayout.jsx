/**
 * VapesLayout.jsx — "The Smoke Shelf"
 * 
 * Products on floating 3D perspective shelves.
 * Slow camera pan with smoke wisps effect.
 */

import './VapesLayout.css';
import ProductCard from '../components/ProductCard';

export default function VapesLayout({ products = [] }) {
    const perShelf = Math.ceil(products.length / 2);
    const shelf1 = products.slice(0, perShelf);
    const shelf2 = products.slice(perShelf);

    const cardW = Math.min(
        Math.max(Math.floor((window.innerWidth * 0.9) / Math.max(perShelf, 1)), 100),
        220
    );

    return (
        <div className="vapes-scene">
            <div className="vapes-shelf-wrapper">
                {[shelf1, shelf2].map((shelf, shelfIdx) => (
                    <div
                        key={shelfIdx}
                        className={`vapes-shelf vapes-shelf--${shelfIdx}`}
                    >
                        <div className="vapes-shelf__plank" />
                        <div className="vapes-shelf__products">
                            {shelf.map((product, i) => (
                                <div key={product.id} className="vapes-product-slot" style={{ animationDelay: `${i * 0.2}s` }}>
                                    <ProductCard product={product} size={cardW} variant="vertical" />
                                    <div className="vapes-smoke" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Amber radial lighting overlay */}
            <div className="vapes-light-overlay" />
        </div>
    );
}
