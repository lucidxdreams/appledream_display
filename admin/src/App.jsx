import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Products from './pages/Products'
import Deals from './pages/Deals'
import Settings from './pages/Settings'

export default function App() {
  const { loading, authError } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f0f0f',
        flexDirection: 'column',
        gap: 16,
        color: '#9a9a9a',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
      }}>
        <div style={{
          width: 20, height: 20,
          border: '2px solid #2e2e2e',
          borderTopColor: '#4a7c59',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span>Loading...</span>
      </div>
    )
  }

  if (authError) {
    const missingEnv = !import.meta.env.VITE_FIREBASE_PROJECT_ID
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f0f0f', flexDirection: 'column',
        gap: 16, color: '#e8e8e8', fontFamily: 'Inter, sans-serif', padding: 24,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <h2 style={{ color: '#f39c12', margin: 0 }}>
          {missingEnv ? 'Firebase Not Configured' : 'Authentication Error'}
        </h2>
        {missingEnv ? (
          <p style={{ color: '#9a9a9a', maxWidth: 480, lineHeight: 1.6 }}>
            Create <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> in{' '}
            <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: 4 }}>admin/</code>{' '}
            with your Firebase credentials (copy from <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: 4 }}>.env.example</code>),
            then restart the dev server.
          </p>
        ) : (
          <p style={{ color: '#9a9a9a' }}>{authError}</p>
        )}
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="products/:categorySlug" element={<Products />} />
        <Route path="deals" element={<Deals />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
