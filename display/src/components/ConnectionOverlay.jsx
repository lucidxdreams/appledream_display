/**
 * ConnectionOverlay.jsx
 *
 * Full-screen overlay displayed when Firestore connectivity is lost.
 * Shows "Connection Lost" message while the display continues showing
 * the last known product data underneath.
 *
 * Props:
 *   visible {boolean} — whether to show the overlay
 */

import './ConnectionOverlay.css';

export default function ConnectionOverlay({ visible }) {
    if (!visible) return null;

    return (
        <div className="connection-overlay" role="alert">
            <div className="connection-overlay__card">
                <span className="connection-overlay__icon">📡</span>
                <div className="connection-overlay__text">
                    <h2 className="connection-overlay__title">Connection Lost</h2>
                    <p className="connection-overlay__sub">
                        Displaying last known data — reconnecting automatically…
                    </p>
                </div>
            </div>
        </div>
    );
}
