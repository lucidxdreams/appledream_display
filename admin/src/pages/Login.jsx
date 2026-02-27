import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import toast from 'react-hot-toast'
import { Lock, Mail, Leaf, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export default function Login() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)

    // Already logged in
    if (user) return <Navigate to="/dashboard" replace />

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email || !password) {
            toast.error('Please enter email and password')
            return
        }
        setLoading(true)
        try {
            await signInWithEmailAndPassword(auth, email, password)
            toast.success('Welcome back!')
            navigate('/dashboard')
        } catch (err) {
            const msg =
                err.code === 'auth/invalid-credential' ||
                    err.code === 'auth/wrong-password'
                    ? 'Invalid email or password'
                    : err.code === 'auth/too-many-requests'
                        ? 'Too many attempts. Try again later.'
                        : 'Login failed. Check your credentials.'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">🌿</div>
                    <div>
                        <div className="login-logo-text">GreenCMS</div>
                        <div className="login-logo-sub">Admin Panel — Staff Only</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail
                                size={15}
                                style={{
                                    position: 'absolute',
                                    left: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                }}
                            />
                            <input
                                type="email"
                                className="form-input"
                                placeholder="admin@dispensary.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                style={{ paddingLeft: 40 }}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={15}
                                style={{
                                    position: 'absolute',
                                    left: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                }}
                            />
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                style={{ paddingLeft: 40, paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((p) => !p)}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: 8, padding: '13px', justifyContent: 'center', fontSize: 14 }}
                        disabled={loading}
                    >
                        {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</> : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 24 }}>
                    Contact your administrator for access
                </p>
            </div>
        </div>
    )
}
