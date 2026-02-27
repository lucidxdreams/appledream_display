import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, onIdTokenChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState(null)

    useEffect(() => {
        let unsubAuth = () => { }
        let unsubToken = () => { }
        let tokenCheckInterval = null

        // If Firebase didn't initialize (missing .env.local), bail immediately
        if (!auth) {
            setAuthError('missing_config')
            setLoading(false)
            return
        }

        // Failsafe: resolve loading after 8s if Firebase auth hangs
        const timeout = setTimeout(() => {
            setLoading(false)
        }, 8000)

        try {
            unsubAuth = onAuthStateChanged(
                auth,
                (u) => {
                    clearTimeout(timeout)
                    setUser(u)
                    setLoading(false)
                },
                (error) => {
                    clearTimeout(timeout)
                    console.error('Auth state error:', error)
                    setAuthError(error.message)
                    setLoading(false)
                }
            )

            // Listen for token changes (catches revocation)
            unsubToken = onIdTokenChanged(auth, async (u) => {
                if (!u && user) {
                    // Token was revoked or expired and couldn't refresh
                    setUser(null)
                }
            })

            // Periodic token freshness check every 5 minutes
            tokenCheckInterval = setInterval(async () => {
                const currentUser = auth.currentUser
                if (!currentUser) return

                try {
                    // Force-refresh the token; if it fails, user session is invalid
                    await currentUser.getIdToken(true)
                } catch (err) {
                    console.warn('[Auth] Token refresh failed, signing out:', err.message)
                    try {
                        await signOut(auth)
                    } catch { /* ignore */ }
                    setUser(null)
                }
            }, 5 * 60 * 1000) // 5 minutes

        } catch (err) {
            clearTimeout(timeout)
            console.error('Failed to initialize auth listener:', err)
            setAuthError(err.message)
            setLoading(false)
        }

        return () => {
            clearTimeout(timeout)
            clearInterval(tokenCheckInterval)
            unsubAuth()
            unsubToken()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, authError }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
