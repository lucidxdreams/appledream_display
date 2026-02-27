import { useState, useEffect } from 'react'
import {
    collection, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc, serverTimestamp
} from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { logAuditEvent } from '../lib/auditLog'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Tag, Clock } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import DealForm from '../components/DealForm'
import dayjs from 'dayjs'

function Toggle({ checked, onChange }) {
    return (
        <div className="toggle-wrap" onClick={() => onChange(!checked)}>
            <div className={`toggle-track ${checked ? 'on' : ''}`}>
                <div className="toggle-thumb" />
            </div>
        </div>
    )
}

const DEAL_TYPE_COLORS = {
    BOGO: 'badge-success',
    Discount: 'badge-warning',
    Bundle: 'badge-info',
    'Flash Sale': 'badge-danger',
    Custom: '',
}

export default function Deals() {
    const [deals, setDeals] = useState([])
    const [loading, setLoading] = useState(true)
    const [panelOpen, setPanelOpen] = useState(false)
    const [editingDeal, setEditingDeal] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)

    useEffect(() => {
        loadDeals()
    }, [])

    const loadDeals = async () => {
        setLoading(true)
        try {
            const snap = await getDocs(collection(db, 'deals'))
            const d = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            d.sort((a, b) => (a.displayPriority ?? 99) - (b.displayPriority ?? 99))
            setDeals(d)
        } catch {
            toast.error('Failed to load deals')
        } finally {
            setLoading(false)
        }
    }

    const openAdd = () => { setEditingDeal(null); setPanelOpen(true) }
    const openEdit = (deal) => { setEditingDeal(deal); setPanelOpen(true) }
    const closePanel = () => { setPanelOpen(false); setEditingDeal(null) }

    const handleSave = async (data, existingId) => {
        try {
            if (existingId) {
                // Optimistic locking: check if doc was modified since we loaded it
                const currentDoc = await getDoc(doc(db, 'deals', existingId))
                if (currentDoc.exists()) {
                    const currentUpdatedAt = currentDoc.data().updatedAt?.toMillis?.() || 0
                    const loadedUpdatedAt = editingDeal?.updatedAt?.toMillis?.() || editingDeal?.updatedAt?.seconds * 1000 || 0
                    if (currentUpdatedAt > 0 && loadedUpdatedAt > 0 && currentUpdatedAt !== loadedUpdatedAt) {
                        toast.error('This deal was modified by another admin. Please close and reopen to get the latest version.', { duration: 5000 })
                        return
                    }
                }

                await updateDoc(doc(db, 'deals', existingId), { ...data, updatedAt: serverTimestamp() })
                toast.success('Deal updated!')
                logAuditEvent({ action: 'deal.updated', entity: 'deal', entityId: existingId, details: { title: data.title } })
            } else {
                const docRef = await addDoc(collection(db, 'deals'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
                toast.success('Deal created!')
                logAuditEvent({ action: 'deal.created', entity: 'deal', entityId: docRef.id, details: { title: data.title } })
            }
            closePanel()
            loadDeals()
        } catch (err) {
            console.error(err)
            toast.error('Failed to save deal')
        }
    }

    const handleToggleActive = async (deal) => {
        const next = !deal.active
        setDeals((prev) => prev.map((d) => d.id === deal.id ? { ...d, active: next } : d))
        try {
            await updateDoc(doc(db, 'deals', deal.id), { active: next, updatedAt: serverTimestamp() })
            logAuditEvent({ action: 'deal.toggled', entity: 'deal', entityId: deal.id, details: { active: next, title: deal.title } })
        } catch {
            toast.error('Failed to update')
            loadDeals()
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            // Clean up image from Firebase Storage (best-effort)
            try {
                const imageRef = ref(storage, `deals/${deleteTarget.id}/image.webp`)
                await deleteObject(imageRef)
            } catch {
                // Image may not exist — that's fine
            }

            await deleteDoc(doc(db, 'deals', deleteTarget.id))
            toast.success('Deal deleted')
            setDeals((prev) => prev.filter((d) => d.id !== deleteTarget.id))
            logAuditEvent({ action: 'deal.deleted', entity: 'deal', entityId: deleteTarget.id, details: { title: deleteTarget.title } })
        } catch {
            toast.error('Failed to delete deal')
        } finally {
            setDeleteTarget(null)
        }
    }

    const isExpired = (deal) => {
        if (!deal.endTime) return false
        const end = deal.endTime?.toDate?.() || new Date(deal.endTime)
        return end < new Date()
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Deals</h1>
                    <p className="page-subtitle">
                        {deals.filter(d => d.active && !isExpired(d)).length} active deals
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={16} /> Add Deal
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : deals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><Tag size={28} /></div>
                        <div className="empty-state-title">No deals yet</div>
                        <div className="empty-state-desc">Click "Add Deal" to create your first deal</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Price</th>
                                <th>Priority</th>
                                <th>End Time</th>
                                <th style={{ width: 80 }}>Active</th>
                                <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deals.map((deal) => {
                                const expired = isExpired(deal)
                                return (
                                    <tr key={deal.id} style={{ opacity: expired ? 0.5 : 1 }}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{deal.title}</div>
                                            {deal.description && (
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }} className="truncate">
                                                    {deal.description}
                                                </div>
                                            )}
                                            {expired && (
                                                <span className="badge badge-danger" style={{ marginTop: 4 }}>Expired</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${DEAL_TYPE_COLORS[deal.dealType] || ''}`}>
                                                {deal.dealType || 'Custom'}
                                            </span>
                                        </td>
                                        <td>
                                            {deal.dealPrice ? (
                                                <div>
                                                    <span style={{ fontWeight: 600 }}>${deal.dealPrice}</span>
                                                    {deal.originalPrice && (
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>
                                                            ${deal.originalPrice}
                                                        </span>
                                                    )}
                                                    {deal.originalPrice && deal.dealPrice && (
                                                        <span className="badge badge-success" style={{ marginLeft: 6 }}>
                                                            -{Math.round((1 - deal.dealPrice / deal.originalPrice) * 100)}%
                                                        </span>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                                                #{deal.displayPriority ?? '—'}
                                            </span>
                                        </td>
                                        <td>
                                            {deal.endTime ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                                                    <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                                                    {dayjs(deal.endTime?.toDate?.() || deal.endTime).format('MMM D, h:mm A')}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Ongoing</span>
                                            )}
                                        </td>
                                        <td>
                                            <Toggle
                                                checked={!!deal.active}
                                                onChange={() => handleToggleActive(deal)}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(deal)}>
                                                    <Pencil size={14} />
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(deal)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Panel */}
            {panelOpen && (
                <>
                    <div className="panel-overlay" onClick={closePanel} />
                    <div className="panel panel-lg">
                        <div className="panel-header">
                            <h2 className="panel-title">
                                {editingDeal ? `Edit: ${editingDeal.title}` : 'Create New Deal'}
                            </h2>
                            <button className="btn btn-ghost btn-sm" onClick={closePanel}>✕</button>
                        </div>
                        <DealForm
                            defaultValues={editingDeal}
                            onSave={handleSave}
                            onCancel={closePanel}
                        />
                    </div>
                </>
            )}

            {deleteTarget && (
                <ConfirmDialog
                    title="Delete Deal"
                    message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
                    confirmLabel="Delete Deal"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    )
}
