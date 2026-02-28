/**
 * ErrorBoundary.jsx
 *
 * Global React Error Boundary for the display app.
 * Catches render errors and shows a graceful fallback instead of a white screen.
 * Auto-retries by resetting state after 10 seconds.
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
        this.retryTimer = null;
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    componentDidUpdate(_, prevState) {
        if (this.state.hasError && !prevState.hasError) {
            // Auto-retry after 10 seconds
            this.retryTimer = setTimeout(() => {
                this.setState({ hasError: false, error: null });
            }, 10000);
        }
    }

    componentWillUnmount() {
        if (this.retryTimer) clearTimeout(this.retryTimer);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    width: '100vw',
                    background: '#080f09',
                    color: '#f0ead6',
                    fontFamily: "'Outfit', sans-serif",
                    gap: '24px',
                    textAlign: 'center',
                    padding: '40px',
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(232, 92, 43, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                    }}>
                        ⚠️
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                        fontWeight: 700,
                        margin: 0,
                        color: '#c8a951',
                    }}>
                        Display Recovering…
                    </h1>
                    <p style={{
                        fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
                        color: '#9db89e',
                        maxWidth: '500px',
                        lineHeight: 1.6,
                        margin: 0,
                    }}>
                        An unexpected error occurred. The display will automatically
                        restart in a few seconds.
                    </p>
                    <div style={{
                        width: '200px',
                        height: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #c8a951, #7cb518)',
                            animation: 'error-progress 10s linear forwards',
                        }} />
                    </div>
                    <style>{`
                        @keyframes error-progress {
                            from { width: 0%; }
                            to { width: 100%; }
                        }
                    `}</style>
                </div>
            );
        }
        return this.props.children;
    }
}
