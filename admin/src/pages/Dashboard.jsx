import { useState, useEffect } from 'react'
import { logAuditEvent } from '../lib/auditLog'
import {
    collection, getDocs, doc, updateDoc, setDoc,
    serverTimestamp, onSnapshot,
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import toast from 'react-hot-toast'
import {
    Layers, Package, Tag, Clock, Radio,
    ChevronRight, Zap, AlertCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalCategories: 0,
        activeCategories: 0,
        totalProducts: 0,
        inStockProducts: 0,
        activeDeals: 0,
    })
    const [lastPushed, setLastPushed] = useState(null)
    const [pushing, setPushing] = useState(false)
    const [categories, setCategories] = useState([])
    const [productCounts, setProductCounts] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()

        // Listen for lastPushed updates
        const unsub = onSnapshot(doc(db, 'settings', 'display'), (snap) => {
            if (snap.exists()) {
                const data = snap.data()
                setLastPushed(data.lastPushed?.toDate?.() || null)
            }
        })
        return unsub
    }, [])

    const loadData = async () => {
        try {
            // Load categories
            const catSnap = await getDocs(collection(db, 'categories'))
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
                    collection(db, 'products', cat.slug || cat.id, 'items')
                )
                const prods = prodSnap.docs.map((d) => d.data())
                counts[cat.slug || cat.id] = prods.length
                totalProducts += prods.length
                inStockProducts += prods.filter((p) => p.inStock).length
            }

            setProductCounts(counts)

            // Load deals
            const dealSnap = await getDocs(collection(db, 'deals'))
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
            await updateDoc(doc(db, 'settings', 'display'), {
                lastPushed: serverTimestamp(),
                pushedBy: auth.currentUser?.email || 'admin',
            })
            toast.success('Display updated! Changes are now live.', { duration: 4000 })
            logAuditEvent({ action: 'display.pushed', entity: 'display', entityId: 'display' })
        } catch (err) {
            console.error(err)
            // If doc doesn't exist, create it instead
            try {
                await setDoc(doc(db, 'settings', 'display'), {
                    lastPushed: serverTimestamp(),
                    pushedBy: auth.currentUser?.email || 'admin',
                })
                toast.success('Display updated! Changes are now live.')
                logAuditEvent({ action: 'display.pushed', entity: 'display', entityId: 'display' })
            } catch (err2) {
                toast.error('Failed to push to display')
            }
        } finally {
            setPushing(false)
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
                <button className="btn btn-ghost btn-sm" onClick={loadData}>
                    Refresh
                </button>
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
                        Last pushed {dayjs(lastPushed).fromNow()} by{' '}
                        {lastPushed.pushedBy || 'admin'}
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
