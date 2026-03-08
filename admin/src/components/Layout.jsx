import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useLocation, LOCATIONS } from '../contexts/LocationContext'
import toast from 'react-hot-toast'
import {
    LayoutDashboard,
    Layers,
    Package,
    Tag,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    MapPin,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation as useRouterLocation } from 'react-router-dom'

const CATEGORIES = [
    { slug: 'exotic-flowers', label: 'Flowers' },
    { slug: 'edibles', label: 'Edibles' },
    { slug: 'disposables-vapes', label: 'Vapes' },
    { slug: 'cartridges', label: 'Cartridges' },
    { slug: 'prerolls', label: 'Pre-Rolls' },
    { slug: 'concentrates', label: 'Concentrates' },
    { slug: 'accessories', label: 'Accessories' },
]

export default function Layout() {
    const { user } = useAuth()
    const { selectedLocation, setSelectedLocation, currentLocation } = useLocation()
    const navigate = useNavigate()
    const routerLocation = useRouterLocation()
    const [productsOpen, setProductsOpen] = useState(
        routerLocation.pathname.startsWith('/products')
    )
    const [locationOpen, setLocationOpen] = useState(false)

    const handleLogout = async () => {
        try {
            await signOut(auth)
            toast.success('Logged out')
            navigate('/login')
        } catch {
            toast.error('Failed to log out')
        }
    }

    const handleSelectLocation = (id) => {
        setSelectedLocation(id)
        setLocationOpen(false)
        toast.success(`Switched to ${LOCATIONS.find(l => l.id === id)?.name}`)
    }

    const isProductsActive = routerLocation.pathname.startsWith('/products')

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <aside className="sidebar glass-panel">
                <div className="sidebar-logo">
                    <img src="/main_logo.webp" alt="Logo" style={{ height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }} />
                </div>

                {/* Location Selector */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--text-muted)',
                            marginBottom: 6,
                            paddingLeft: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <MapPin size={10} />
                        Location
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setLocationOpen(o => !o)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '9px 12px',
                                background: 'var(--accent-dim)',
                                border: '1px solid var(--accent)',
                                borderRadius: 8,
                                color: 'var(--accent)',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                transition: 'all 0.15s',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={13} />
                                {currentLocation.name}
                            </span>
                            <ChevronDown size={13} style={{ transform: locationOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                        </button>

                        {locationOpen && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 6px)',
                                    left: 0,
                                    right: 0,
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    zIndex: 200,
                                    boxShadow: 'var(--shadow-lg)',
                                }}
                            >
                                {LOCATIONS.map((loc) => (
                                    <button
                                        key={loc.id}
                                        onClick={() => handleSelectLocation(loc.id)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 14px',
                                            background: loc.id === selectedLocation ? 'var(--accent-dim)' : 'transparent',
                                            border: 'none',
                                            borderBottom: '1px solid var(--border)',
                                            color: loc.id === selectedLocation ? 'var(--accent)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            fontWeight: loc.id === selectedLocation ? 600 : 400,
                                            textAlign: 'left',
                                            transition: 'all 0.12s',
                                        }}
                                        onMouseEnter={e => { if (loc.id !== selectedLocation) e.currentTarget.style.background = 'var(--surface-3)' }}
                                        onMouseLeave={e => { if (loc.id !== selectedLocation) e.currentTarget.style.background = 'transparent' }}
                                    >
                                        <MapPin size={12} />
                                        {loc.name}
                                        {loc.id === selectedLocation && (
                                            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main</div>

                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={17} />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/categories"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Layers size={17} />
                        Categories
                    </NavLink>

                    {/* Products with sub-menu */}
                    <button
                        className={`nav-item ${isProductsActive ? 'active' : ''}`}
                        onClick={() => setProductsOpen((p) => !p)}
                        style={{ justifyContent: 'space-between' }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Package size={17} />
                            Products
                        </span>
                        {productsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {productsOpen && (
                        <div style={{ paddingLeft: 20 }}>
                            {CATEGORIES.map((cat) => (
                                <NavLink
                                    key={cat.slug}
                                    to={`/products/${cat.slug}`}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                    style={{ fontSize: 13, paddingLeft: 24 }}
                                >
                                    {cat.label}
                                </NavLink>
                            ))}
                        </div>
                    )}

                    <NavLink
                        to="/deals"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Tag size={17} />
                        Deals
                    </NavLink>

                    <div className="sidebar-section-label">System</div>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Settings size={17} />
                        Settings
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginBottom: 10,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {user?.email}
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={15} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Page content */}
            <div className="main-content">
                <div className="page-body">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
