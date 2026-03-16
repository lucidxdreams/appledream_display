import React from 'react'
import './PreRollsLayout.css'

export default function PreRollsLayout({ products = [] }) {
    if (!products || products.length === 0) {
        return (
            <div className="prerolls-scene empty-state">
                <div className="empty-message">No pre-rolls currently available</div>
            </div>
        )
    }

    // Sort by name so it's consistent
    const sortedProducts = [...products].sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    return (
        <div className="prerolls-scene">
            <div className="prerolls-grid-container">
                <div className="prerolls-grid">
                    {sortedProducts.map((item, index) => {
                        const typeColor =
                            item.type === 'Sativa' ? 'var(--sativa, #f39c12)'
                                : item.type === 'Indica' ? 'var(--indica, #8e44ad)'
                                    : 'var(--hybrid, #27ae60)'

                        return (
                            <div
                                key={item.id}
                                className="prerolls-card"
                                style={{
                                    '--strain-color': typeColor,
                                    animationDelay: `${index * 0.05}s`
                                }}
                            >
                                <div className="prerolls-image-wrapper">
                                    <div className="prerolls-glow-backdrop" />
                                    <img
                                        src={item.imageUrl || '/placeholder.png'}
                                        alt={item.name}
                                        className="prerolls-image"
                                    />
                                    {item.badge && <div className="prerolls-badge">{item.badge}</div>}
                                </div>

                                <div className="prerolls-content">
                                    <div className="prerolls-header">
                                        <h3 className="prerolls-brand">{item.brand || 'Premium Brand'}</h3>
                                        <h2 className="prerolls-name">{item.name}</h2>
                                    </div>

                                    <div className="prerolls-pills">
                                        <span className="pill strain" style={{ background: typeColor }}>{item.type || 'Hybrid'}</span>
                                        {item.weight && <span className="pill property">{item.weight}</span>}
                                        {item.thc > 0 && <span className="pill property">THC {item.thc}%</span>}
                                        {item.cbd > 0 && <span className="pill property">CBD {item.cbd}%</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
