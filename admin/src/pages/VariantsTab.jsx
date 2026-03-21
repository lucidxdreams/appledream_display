import { useState, useEffect } from 'react'
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import toast from 'react-hot-toast'
import { Plus, Trash2, Check, Layers, Pencil } from 'lucide-react'

function Toggle({ checked, onChange, label }) {
    return (
        <div className="toggle-wrap" onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div className={`toggle-track ${checked ? 'on' : ''}`}>
                <div className="toggle-thumb" />
            </div>
            {label && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>}
        </div>
    )
}

const EMPTY_FORM = { name: '', mainProductId: '', variantIds: [], enabled: true }

export default function VariantsTab({ products, categorySlug, locationId }) {
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null) // null | 'new' | groupId
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadGroups() }, [categorySlug, locationId])

    const loadGroups = async () => {
        setLoading(true)
        try {
            const snap = await getDocs(
                collection(db, 'locations', locationId, 'products', categorySlug, 'variantGroups')
            )
            setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch {
            toast.error('Failed to load variant groups')
        } finally {
            setLoading(false)
        }
    }

    const openNew = () => {
        setForm(EMPTY_FORM)
        setEditingId('new')
    }

    const openEdit = (g) => {
        setForm({
            name: g.name || '',
            mainProductId: g.mainProductId || '',
            variantIds: g.variantIds || [],
            enabled: g.enabled !== false,
        })
        setEditingId(g.id)
    }

    const closePanel = () => setEditingId(null)

    const handleSave = async () => {
        if (!form.mainProductId) { toast.error('Select a main product'); return }
        if (form.variantIds.length === 0) { toast.error('Add at least one variant'); return }
        setSaving(true)
        try {
            if (editingId === 'new') {
                await addDoc(
                    collection(db, 'locations', locationId, 'products', categorySlug, 'variantGroups'),
                    { ...form, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
                )
                toast.success('Variant group created!')
            } else {
                await updateDoc(
                    doc(db, 'locations', locationId, 'products', categorySlug, 'variantGroups', editingId),
                    { ...form, updatedAt: serverTimestamp() }
                )
                toast.success('Variant group updated!')
            }
            closePanel()
            loadGroups()
        } catch {
            toast.error('Failed to save variant group')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (groupId, groupName) => {
        if (!confirm(`Delete variant group "${groupName}"? This won't delete the products.`)) return
        try {
            await deleteDoc(
                doc(db, 'locations', locationId, 'products', categorySlug, 'variantGroups', groupId)
            )
            toast.success('Variant group deleted')
            setGroups(prev => prev.filter(g => g.id !== groupId))
        } catch {
            toast.error('Failed to delete')
        }
    }

    const handleToggleEnabled = async (group) => {
        const newVal = group.enabled === false ? true : false
        setGroups(prev => prev.map(g => g.id === group.id ? { ...g, enabled: newVal } : g))
        try {
            await updateDoc(
                doc(db, 'locations', locationId, 'products', categorySlug, 'variantGroups', group.id),
                { enabled: newVal, updatedAt: serverTimestamp() }
            )
        } catch {
            toast.error('Failed to update')
            loadGroups()
        }
    }

    const toggleVariant = (id) => {
        setForm(f => ({
            ...f,
            variantIds: f.variantIds.includes(id)
                ? f.variantIds.filter(v => v !== id)
                : [...f.variantIds, id]
        }))
    }

    const getProduct = (id) => products.find(p => p.id === id)

    // Products available as variants: exclude the current main product
    const availableAsVariant = products.filter(p => p.id !== form.mainProductId)

    return (
        <div>
            {/* Tab header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Variant Groups</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                        Group a main product with its flavor/size variants. On the display, each group<br />
                        renders as one stunning card — the hero product + a compact list of variants.
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openNew} style={{ flexShrink: 0 }}>
                    <Plus size={16} /> New Group
                </button>
            </div>

            {loading ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
            ) : groups.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Layers size={28} /></div>
                    <div className="empty-state-title">No variant groups yet</div>
                    <div className="empty-state-desc">
                        Create a group to combine a base product with its flavors or sizes into one display card.
                        Great for brands with many SKUs — e.g., dompen™ with 20+ cartridge flavors.
                    </div>
                    <button className="btn btn-primary" onClick={openNew} style={{ marginTop: 16 }}>
                        <Plus size={16} /> Create First Group
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {groups.map(g => {
                        const main = getProduct(g.mainProductId)
                        const isEnabled = g.enabled !== false
                        return (
                            <div
                                key={g.id}
                                className="card"
                                style={{
                                    padding: '14px 18px',
                                    opacity: isEnabled ? 1 : 0.55,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                    {/* Enable dot */}
                                    <div
                                        style={{
                                            width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                                            background: isEnabled ? 'var(--success)' : 'var(--text-muted)',
                                            boxShadow: isEnabled ? '0 0 8px var(--success)' : 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        title={isEnabled ? 'Visible on display — click to hide' : 'Hidden — click to show'}
                                        onClick={() => handleToggleEnabled(g)}
                                    />

                                    {/* Main image */}
                                    {main?.imageUrl && (
                                        <img
                                            src={main.imageUrl}
                                            alt=""
                                            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                                        />
                                    )}

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                {g.name || main?.name || 'Unnamed Group'}
                                            </span>
                                            {!isEnabled && (
                                                <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                                                    HIDDEN
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                            Main: {main?.name || g.mainProductId} · {(g.variantIds || []).length} variant{(g.variantIds || []).length !== 1 ? 's' : ''}
                                        </div>
                                        {(g.variantIds || []).length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                                {(g.variantIds || []).slice(0, 8).map(vid => {
                                                    const vp = getProduct(vid)
                                                    return (
                                                        <span
                                                            key={vid}
                                                            style={{
                                                                padding: '2px 8px',
                                                                background: 'var(--surface-2)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: 20,
                                                                fontSize: 11,
                                                                color: 'var(--text-secondary)',
                                                            }}
                                                        >
                                                            {vp?.name || vid}
                                                        </span>
                                                    )
                                                })}
                                                {(g.variantIds || []).length > 8 && (
                                                    <span style={{ padding: '2px 8px', fontSize: 11, color: 'var(--text-muted)' }}>
                                                        +{(g.variantIds || []).length - 8} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)} title="Edit">
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(g.id, g.name || main?.name || 'this group')}
                                            title="Delete"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Editor panel */}
            {editingId !== null && (
                <>
                    <div className="panel-overlay" onClick={closePanel} />
                    <div className="panel panel-lg">
                        <div className="panel-header">
                            <h2 className="panel-title">
                                {editingId === 'new' ? 'New Variant Group' : 'Edit Variant Group'}
                            </h2>
                            <button className="btn btn-ghost btn-sm" onClick={closePanel}>✕</button>
                        </div>

                        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22, overflowY: 'auto', flex: 1 }}>
                            {/* Group name */}
                            <div className="form-group">
                                <label className="form-label">Group Label <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. dompen™ Cartridges"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                />
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Shown as the group heading on the display card. Defaults to main product name if left blank.
                                </div>
                            </div>

                            {/* Main product */}
                            <div className="form-group">
                                <label className="form-label">
                                    Main Product (Hero) <span style={{ color: 'var(--danger)' }}>*</span>
                                </label>
                                <select
                                    className="form-select"
                                    value={form.mainProductId}
                                    onChange={e => setForm(f => ({
                                        ...f,
                                        mainProductId: e.target.value,
                                        variantIds: f.variantIds.filter(v => v !== e.target.value)
                                    }))}
                                >
                                    <option value="">— Select main product —</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}{p.brand ? ` (${p.brand})` : ''} — ${Number(p.price || 0).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                    The hero product shown prominently on the left side of the display card.
                                </div>
                            </div>

                            {/* Visible on display */}
                            <div className="form-group">
                                <label className="form-label">Display Visibility</label>
                                <Toggle
                                    checked={form.enabled}
                                    onChange={v => setForm(f => ({ ...f, enabled: v }))}
                                    label={form.enabled ? 'Active — this group appears on the display' : 'Hidden — not shown on display'}
                                />
                            </div>

                            {/* Variants picker */}
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    Variants (Flavors / Sizes)
                                    <span style={{ color: 'var(--danger)' }}>*</span>
                                    {form.variantIds.length > 0 && (
                                        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 10 }}>
                                            {form.variantIds.length} selected
                                        </span>
                                    )}
                                </label>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                                    Select all products that are flavor/size variants of the main product above.
                                </div>
                                <div style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)',
                                    overflow: 'hidden',
                                    maxHeight: 340,
                                    overflowY: 'auto',
                                }}>
                                    {!form.mainProductId ? (
                                        <div style={{ padding: '16px 14px', color: 'var(--text-muted)', fontSize: 13 }}>
                                            Select a main product first.
                                        </div>
                                    ) : availableAsVariant.length === 0 ? (
                                        <div style={{ padding: '16px 14px', color: 'var(--text-muted)', fontSize: 13 }}>
                                            No other products in this category.
                                        </div>
                                    ) : (
                                        availableAsVariant.map(p => {
                                            const selected = form.variantIds.includes(p.id)
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => toggleVariant(p.id)}
                                                    style={{
                                                        padding: '10px 14px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        borderBottom: '1px solid var(--border)',
                                                        background: selected ? 'var(--accent-dim)' : 'transparent',
                                                        transition: 'background 0.12s',
                                                    }}
                                                >
                                                    {/* Checkbox */}
                                                    <div style={{
                                                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                                        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-light)'}`,
                                                        background: selected ? 'var(--accent)' : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.12s',
                                                    }}>
                                                        {selected && <Check size={11} color="white" strokeWidth={3} />}
                                                    </div>

                                                    {/* Thumbnail */}
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                                                    ) : (
                                                        <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--surface-2)', flexShrink: 0 }} />
                                                    )}

                                                    {/* Name + meta */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {p.name}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                                            ${Number(p.price || 0).toFixed(2)} · THC {p.thc || 0}% · {p.type || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Footer actions */}
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                <button className="btn btn-ghost" onClick={closePanel}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving…' : editingId === 'new' ? 'Create Group' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
