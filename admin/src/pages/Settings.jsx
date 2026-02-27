import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import toast from 'react-hot-toast'
import { Save, RotateCcw } from 'lucide-react'

const TRANSITION_STYLES = [
    { value: 'fade', label: 'Fade', desc: 'Smooth crossfade between categories' },
    { value: 'slide', label: 'Slide', desc: 'Slides each category in from the side' },
    { value: 'particle', label: 'Particle', desc: 'Particle burst transition effect' },
]

function Toggle({ checked, onChange, label, desc }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: '1px solid var(--border)',
            }}
        >
            <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
                {desc && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
            </div>
            <div className="toggle-wrap" onClick={() => onChange(!checked)}>
                <div className={`toggle-track ${checked ? 'on' : ''}`}>
                    <div className="toggle-thumb" />
                </div>
            </div>
        </div>
    )
}

const DEFAULT_SETTINGS = {
    rotationSpeed: 15,
    transitionStyle: 'fade',
    showClock: true,
    autoRotate: true,
}

export default function Settings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const snap = await getDoc(doc(db, 'settings', 'display'))
            if (snap.exists()) {
                const data = snap.data()
                setSettings({
                    rotationSpeed: data.rotationSpeed ?? DEFAULT_SETTINGS.rotationSpeed,
                    transitionStyle: data.transitionStyle ?? DEFAULT_SETTINGS.transitionStyle,
                    showClock: data.showClock ?? DEFAULT_SETTINGS.showClock,
                    autoRotate: data.autoRotate ?? DEFAULT_SETTINGS.autoRotate,
                })
            }
        } catch {
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const update = (field, value) => {
        setSettings((prev) => ({ ...prev, [field]: value }))
        setDirty(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await setDoc(
                doc(db, 'settings', 'display'),
                {
                    ...settings,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            )
            toast.success('Settings saved!')
            setDirty(false)
        } catch {
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS)
        setDirty(true)
    }

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Display Settings</h1>
                    <p className="page-subtitle">Configure global display behavior</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={handleReset}>
                        <RotateCcw size={14} /> Reset Defaults
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving || !dirty}
                    >
                        {saving ? (
                            <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                        ) : (
                            <><Save size={14} /> Save Settings</>
                        )}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* Rotation */}
                <div className="card">
                    <h2 className="card-title" style={{ marginBottom: 20 }}>Rotation</h2>

                    <div className="form-group" style={{ marginBottom: 24 }}>
                        <label className="form-label">
                            Global Rotation Speed Override: {settings.rotationSpeed}s
                        </label>
                        <input
                            type="range"
                            className="range-slider"
                            min={5}
                            max={60}
                            step={5}
                            value={settings.rotationSpeed}
                            onChange={(e) => update('rotationSpeed', Number(e.target.value))}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            <span>5s (fast)</span>
                            <span>60s (slow)</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                            Per-category durations override this when set. This applies to categories without a specific duration.
                        </div>
                    </div>

                    <Toggle
                        checked={settings.autoRotate}
                        onChange={(v) => update('autoRotate', v)}
                        label="Auto-Rotate"
                        desc="Automatically cycle through categories"
                    />

                    <Toggle
                        checked={settings.showClock}
                        onChange={(v) => update('showClock', v)}
                        label="Show Clock"
                        desc="Display current time on screen"
                    />
                </div>

                {/* Transitions */}
                <div className="card">
                    <h2 className="card-title" style={{ marginBottom: 20 }}>Transitions</h2>

                    <div className="form-group">
                        <label className="form-label">Transition Style</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                            {TRANSITION_STYLES.map((style) => (
                                <label
                                    key={style.value}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '14px 16px',
                                        background:
                                            settings.transitionStyle === style.value
                                                ? 'var(--accent-dim)'
                                                : 'var(--surface-2)',
                                        border: `1px solid ${settings.transitionStyle === style.value
                                                ? 'var(--accent)'
                                                : 'var(--border)'
                                            }`,
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onClick={() => update('transitionStyle', style.value)}
                                >
                                    <input
                                        type="radio"
                                        name="transitionStyle"
                                        value={style.value}
                                        checked={settings.transitionStyle === style.value}
                                        onChange={() => update('transitionStyle', style.value)}
                                        style={{ accentColor: 'var(--accent)' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: settings.transitionStyle === style.value ? 'var(--accent)' : 'var(--text)' }}>
                                            {style.label}
                                        </div>
                                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{style.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Unsaved changes bar */}
            {dirty && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 200,
                        animation: 'slideUp 0.2s ease',
                    }}
                >
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
                        You have unsaved changes
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={loadSettings}>
                        Discard
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Now'}
                    </button>
                </div>
            )}
        </div>
    )
}
