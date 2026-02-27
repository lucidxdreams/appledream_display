import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
    LayoutDashboard,
    Layers,
    Package,
    Tag,
    Settings,
    LogOut,
    Leaf,
    ChevronDown,
    ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'

const CATEGORIES = [
    { slug: 'flowers', label: 'Flowers' },
    { slug: 'edibles', label: 'Edibles' },
    { slug: 'vapes', label: 'Vapes' },
    { slug: 'cartridges', label: 'Cartridges' },
    { slug: 'pre-rolls', label: 'Pre-Rolls' },
    { slug: 'concentrates', label: 'Concentrates' },
    { slug: 'accessories', label: 'Accessories' },
]

export default function Layout() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [productsOpen, setProductsOpen] = useState(
        location.pathname.startsWith('/products')
    )

    const handleLogout = async () => {
        try {
            await signOut(auth)
            toast.success('Logged out')
            navigate('/login')
        } catch {
            toast.error('Failed to log out')
        }
    }

    const isProductsActive = location.pathname.startsWith('/products')

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🌿</div>
                    <div>
                        <div className="sidebar-logo-text">GreenCMS</div>
                        <div className="sidebar-logo-sub">Admin Panel</div>
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
