/**
 * CountdownTimer.jsx
 *
 * Live countdown to an endTime (Firestore Timestamp or JS Date or ISO string).
 * Bebas Neue font, pulsing red.
 * When < 30 min remaining: bright-red color + scale-pulse CSS animation.
 *
 * Props:
 *   endTime  {Date | string | {seconds:number} | null}  — deal expiry
 *   compact  {boolean}  — smaller display for card top-right
 */

import { useState, useEffect, useRef } from 'react';
import './CountdownTimer.css';

function toMillis(endTime) {
    if (!endTime) return null;
    // Firestore Timestamp object
    if (endTime?.seconds) return endTime.seconds * 1000 + (endTime.nanoseconds || 0) / 1e6;
    // Date object
    if (endTime instanceof Date) return endTime.getTime();
    // ISO string or numeric
    const ms = new Date(endTime).getTime();
    return isNaN(ms) ? null : ms;
}

function calculateTimeLeft(endMs) {
    const now = Date.now();
    const total = Math.max(0, endMs - now);
    const hours = Math.floor(total / 3_600_000);
    const minutes = Math.floor((total % 3_600_000) / 60_000);
    const seconds = Math.floor((total % 60_000) / 1000);
    return { total, hours, minutes, seconds };
}

export default function CountdownTimer({ endTime, compact = false }) {
    const endMs = toMillis(endTime);

    const [timeLeft, setTimeLeft] = useState(() =>
        endMs ? calculateTimeLeft(endMs) : null
    );
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!endMs) {
            setTimeLeft(null);
            return;
        }

        // Initialise immediately
        setTimeLeft(calculateTimeLeft(endMs));

        intervalRef.current = setInterval(() => {
            const t = calculateTimeLeft(endMs);
            setTimeLeft(t);
            if (t.total <= 0) clearInterval(intervalRef.current);
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [endMs]);

    if (!endMs || !timeLeft || timeLeft.total <= 0) return null;

    const isUrgent = timeLeft.total < 30 * 60_000; // < 30 min

    const pad = (n) => String(n).padStart(2, '0');

    return (
        <div className={`countdown-timer ${isUrgent ? 'countdown-timer--urgent' : ''} ${compact ? 'countdown-timer--compact' : ''}`}>
            {timeLeft.hours > 0 && (
                <>
                    <span className="countdown-timer__unit">{pad(timeLeft.hours)}</span>
                    <span className="countdown-timer__sep">h</span>
                </>
            )}
            <span className="countdown-timer__unit">{pad(timeLeft.minutes)}</span>
            <span className="countdown-timer__sep">m</span>
            <span className="countdown-timer__unit">{pad(timeLeft.seconds)}</span>
            <span className="countdown-timer__sep">s</span>
        </div>
    );
}
