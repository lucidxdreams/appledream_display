/**
 * PreRollsLayout.jsx — "The Smoke Shelf" (vertical card variant)
 * 
 * Products displayed as vertical cards on a single wide shelf with warm amber lighting.
 */

import ProductCard from '../components/ProductCard';
import './PreRollsLayout.css';

export default function PreRollsLayout({ products = [] }) {
    const W = window.innerWidth;
    const cardW = Math.min(
        Math.max(Math.floor((W * 0.88) / Math.max(products.length, 1)), 90),
        200
    );

    return (
        <div className="preroll-scene">
            <div className="preroll-shelf">
                <div className="preroll-shelf__products">
                    {products.map((product, i) => (
                        <div
                            key={product.id}
                            className="preroll-slot"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            <ProductCard product={product} size={cardW} variant="vertical" />
                            {/* Ember wisps */}
                            <div className="preroll-ember" style={{ animationDelay: `${i * 0.3}s` }} />
                        </div>
                    ))}
                </div>
                <div className="preroll-shelf__plank" />
            </div>
            <div className="preroll-warmlight" />
        </div>
    );
}
