import { useState, useEffect } from 'react'
import { logAuditEvent } from '../lib/auditLog'
import {
    collection, getDocs, doc, updateDoc, setDoc, deleteDoc, addDoc,
    serverTimestamp, onSnapshot, query, where
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useLocation } from '../contexts/LocationContext'
import toast from 'react-hot-toast'
import {
    Layers, Package, Tag, Clock, Radio,
    ChevronRight, Zap, AlertCircle, Database, RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { fetchFlowhubInventory } from '../lib/flowhub'

dayjs.extend(relativeTime)

export default function Dashboard() {
    const { selectedLocation } = useLocation()
    const [stats, setStats] = useState({
        totalCategories: 0,
        activeCategories: 0,
        totalProducts: 0,
        inStockProducts: 0,
        activeDeals: 0,
    })
    const [lastPushed, setLastPushed] = useState(null)
    const [pushing, setPushing] = useState(false)
    const [syncingFlowhub, setSyncingFlowhub] = useState(false)
    const [categories, setCategories] = useState([])
    const [productCounts, setProductCounts] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()

        // Listen for lastPushed updates — scoped to selected location
        const unsub = onSnapshot(doc(db, 'locations', selectedLocation, 'settings', 'display'), (snap) => {
            if (snap.exists()) {
                const data = snap.data()
                setLastPushed(data.lastPushed?.toDate?.() || null)
            } else {
                setLastPushed(null)
            }
        })
        return unsub
    }, [selectedLocation])

    const loadData = async () => {
        setLoading(true)
        try {
            // Load categories for this location
            const catSnap = await getDocs(collection(db, 'locations', selectedLocation, 'categories'))
            const cats = catSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
            cats.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
            setCategories(cats)

            const totalCategories = cats.length
            const activeCategories = cats.filter((c) => c.active).length

            // Load product counts per category
            let totalProducts = 0
            let inStockProducts = 0
            const counts = {}

            for (const cat of cats) {
                const prodSnap = await getDocs(
                    collection(db, 'locations', selectedLocation, 'products', cat.slug || cat.id, 'items')
                )
                const prods = prodSnap.docs.map((d) => d.data())
                counts[cat.slug || cat.id] = prods.length
                totalProducts += prods.length
                inStockProducts += prods.filter((p) => p.inStock).length
            }

            setProductCounts(counts)

            // Load deals
            const dealSnap = await getDocs(collection(db, 'locations', selectedLocation, 'deals'))
            const deals = dealSnap.docs.map((d) => d.data())
            const now = new Date()
            const activeDeals = deals.filter((deal) => {
                if (!deal.active) return false
                if (!deal.endTime) return true
                return deal.endTime.toDate?.() > now
            }).length

            setStats({ totalCategories, activeCategories, totalProducts, inStockProducts, activeDeals })
            setLoading(false)
        } catch (err) {
            console.error(err)
            toast.error('Failed to load dashboard data')
            setLoading(false)
        }
    }

    const pushToDisplay = async () => {
        setPushing(true)
        try {
            await setDoc(
                doc(db, 'locations', selectedLocation, 'settings', 'display'),
                {
                    lastPushed: serverTimestamp(),
                    pushedBy: auth.currentUser?.email || 'admin',
                },
                { merge: true }
            )
            toast.success('Display updated! Changes are now live.', { duration: 4000 })
            logAuditEvent({ action: 'display.pushed', entity: 'display', entityId: selectedLocation })
        } catch (err) {
            console.error(err)
            toast.error('Failed to push to display')
        } finally {
            setPushing(false)
        }
    }

    const handleSyncAllFlowhub = async () => {
        if (!confirm("This will securely fetch products from Flowhub for ALL categories. It will ADD new items, and DELETE items that were previously synced but are no longer in Flowhub. Manually created products will be preserved. Proceed?")) return;
        setSyncingFlowhub(true);
        try {
            let totalAdded = 0;
            let totalSkipped = 0;
            let totalDeleted = 0;

            const APP_CATEGORY_SLUGS = [
                'exotic-flowers',
                'edibles',
                'disposables-vapes',
                'cartridges',
                'pre-rolls',
                'concentrates',
                'accessories'
            ];

            for (const slug of APP_CATEGORY_SLUGS) {
                let flowhubItems = [];
                try {
                    const fetchedItems = await fetchFlowhubInventory(selectedLocation, slug);
                    if (fetchedItems) flowhubItems = fetchedItems;
                } catch (err) {
                    throw new Error(`Connection to Flowhub blocked. This is typically caused by browser security headers missing on their API. Details: ${err.message}`);
                }
                
                const snap = await getDocs(collection(db, 'locations', selectedLocation, 'products', slug, 'items'));
                const existingProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                const flowhubSkus = new Set(flowhubItems.map(item => item.sku).filter(Boolean));
                
                // 1. Delete Flowhub products that are no longer in Flowhub
                for (const existing of existingProducts) {
                    if (existing.sku && existing.sku.trim() !== '') {
                        if (!flowhubSkus.has(existing.sku)) {
                            try {
                                await deleteDoc(doc(db, 'locations', selectedLocation, 'products', slug, 'items', existing.id));
                                totalDeleted++;
                            } catch (e) {
                                console.error('Delete error for', existing.id, e);
                            }
                        }
                    }
                }

                // 2. Add or Link new products
                for (const item of flowhubItems) {
                    if (!item.sku) continue;
                    
                    const existingBySku = existingProducts.find(p => p.sku === item.sku);
                    const existingByName = existingProducts.find(p => p.name && item.name && p.name.toLowerCase() === item.name.toLowerCase());
                    
                    const exists = existingBySku || existingByName;

                    if (!exists) {
                        let defaultData = {};
                        if (slug === 'exotic-flowers') defaultData = { sellType: 'Pre-packed', type: item.type || 'Hybrid' };
                        if (slug === 'edibles') defaultData = { pieceCount: 10, type: item.type || 'Hybrid', thcMg: item.thc || 0 };
                        if (slug === 'disposables-vapes') defaultData = { cartSize: '1g', vapeType: 'Classic THC', type: item.type || 'Hybrid' };
                        if (slug === 'cartridges') defaultData = { cartSize: '1g', extractType: 'Distillate', type: item.type || 'Hybrid', effects: [] };
                        if (slug === 'pre-rolls') defaultData = { weight: '1g', type: item.type || 'Hybrid' };
                        if (slug === 'concentrates') defaultData = { weight: '1g', extractType: 'Badder', type: item.type || 'Hybrid' };

                        try {
                            await addDoc(
                                collection(db, 'locations', selectedLocation, 'products', slug, 'items'),
                                { ...item, ...defaultData, active: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
                            );
                            totalAdded++;
                        } catch (e) {
                            console.error('Add error for', item.sku, e);
                        }
                    } else {
                        // Auto-link old manual imports to Flowhub SKU and backfill missing images
                        let updates = { updatedAt: serverTimestamp() };
                        
                        if (existingByName && (!existingByName.sku || existingByName.sku.trim() === '')) {
                            updates.sku = item.sku;
                        }
                        
                        if (!exists.imageUrl && item.imageUrl) {
                            updates.imageUrl = item.imageUrl;
                        }

                        if (Object.keys(updates).length > 1) {
                            try {
                                await updateDoc(
                                    doc(db, 'locations', selectedLocation, 'products', slug, 'items', exists.id),
                                    updates
                                );
                            } catch (e) {
                                console.error('Link/Image update error for', exists.id, e);
                            }
                        }
                        totalSkipped++;
                    }
                }
            }

            toast.success(`Global Sync Complete! Added: ${totalAdded}, Deleted: ${totalDeleted}, Skipped: ${totalSkipped}`, { duration: 6000 });
            loadData(); // refresh counts
        } catch (err) {
            console.error('Global sync error:', err);
            toast.error(err.message || "Failed to sync all from Flowhub");
        } finally {
            setSyncingFlowhub(false);
        }
    }

    const statCards = [
        {
            icon: <Layers size={20} />,
            iconClass: 'stat-icon-green',
            value: stats.totalCategories,
            label: 'Categories',
            sub: `${stats.activeCategories} active`,
        },
        {
            icon: <Package size={20} />,
            iconClass: 'stat-icon-blue',
            value: stats.totalProducts,
            label: 'Products',
            sub: `${stats.inStockProducts} in stock`,
        },
        {
            icon: <Tag size={20} />,
            iconClass: 'stat-icon-yellow',
            value: stats.activeDeals,
            label: 'Active Deals',
            sub: 'Currently live',
        },
        {
            icon: <Clock size={20} />,
            iconClass: 'stat-icon-red',
            value: lastPushed ? dayjs(lastPushed).fromNow() : '—',
            label: 'Last Pushed',
            sub: lastPushed ? dayjs(lastPushed).format('MMM D, h:mm A') : 'Never pushed',
            isTime: true,
        },
    ]

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Overview of your display system</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={handleSyncAllFlowhub} disabled={syncingFlowhub}>
                        {syncingFlowhub ? <RefreshCw size={16} className="spin" /> : <Database size={16} />}
                        {syncingFlowhub ? 'Syncing Flowhub...' : 'Sync From Flowhub'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={loadData}>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16,
                    marginBottom: 28,
                }}
            >
                {statCards.map((s, i) => (
                    <div className="stat-card" key={i}>
                        <div className={`stat-icon ${s.iconClass}`}>{s.icon}</div>
                        <div>
                            <div
                                className="stat-value"
                                style={s.isTime ? { fontSize: 18, marginTop: 4 } : {}}
                            >
                                {loading ? (
                                    <div
                                        style={{
                                            width: 48,
                                            height: 28,
                                            background: 'var(--surface-3)',
                                            borderRadius: 4,
                                            animation: 'pulse 1.5s infinite',
                                        }}
                                    />
                                ) : (
                                    s.value
                                )}
                            </div>
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-sub">{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Push to Display */}
            <div
                className="card"
                style={{ marginBottom: 28, textAlign: 'center', padding: '36px 24px' }}
            >
                <div style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: 13.5 }}>
                    <Radio size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    Push all category, product, and deal changes to the live display
                </div>
                <button
                    className="push-btn"
                    onClick={pushToDisplay}
                    disabled={pushing}
                >
                    {pushing ? (
                        <>
                            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                            Pushing…
                        </>
                    ) : (
                        <>
                            <Zap size={20} />
                            PUSH TO DISPLAY
                        </>
                    )}
                </button>
                {lastPushed && (
                    <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 12 }}>
                        Last pushed {dayjs(lastPushed).fromNow()}
                    </div>
                )}
            </div>

            {/* Active Categories */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Active Category Rotation</h2>
                    <Link to="/categories">
                        <button className="btn btn-ghost btn-sm">
                            Manage <ChevronRight size={14} />
                        </button>
                    </Link>
                </div>

                {loading ? (
                    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                style={{
                                    height: 52,
                                    background: 'var(--surface-2)',
                                    borderRadius: 8,
                                    animation: 'pulse 1.5s infinite',
                                }}
                            />
                        ))}
                    </div>
                ) : categories.filter((c) => c.active).length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 0' }}>
                        <AlertCircle size={28} />
                        <div className="empty-state-title">No active categories</div>
                        <div className="empty-state-desc">
                            Go to Categories to activate some
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {categories
                            .filter((c) => c.active)
                            .map((cat, idx) => {
                                const slug = cat.slug || cat.id
                                const count = productCounts[slug] ?? 0
                                return (
                                    <div
                                        key={cat.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 14,
                                            padding: '12px 16px',
                                            background: 'var(--surface-2)',
                                            borderRadius: 8,
                                            border: '1px solid var(--border)',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                background: 'var(--accent-dim)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: 'var(--accent)',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {idx + 1}
                                        </span>
                                        <div
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                background: cat.themeColor || 'var(--accent)',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>
                                            {cat.name}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                                            {count} products
                                        </span>
                                        <span
                                            style={{
                                                background: 'var(--surface-3)',
                                                borderRadius: 4,
                                                padding: '3px 8px',
                                                fontSize: 12,
                                                color: 'var(--text-secondary)',
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            {cat.duration || 15}s
                                        </span>
                                        <Link to={`/products/${slug}`}>
                                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                                                <ChevronRight size={14} />
                                            </button>
                                        </Link>
                                    </div>
                                )
                            })}
                    </div>
                )}
            </div>
        </div>
    )
}
