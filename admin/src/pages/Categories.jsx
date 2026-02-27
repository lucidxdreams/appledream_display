import { useState, useEffect, useRef } from 'react'
import { logAuditEvent } from '../lib/auditLog'
import {
    collection, getDocs, doc, updateDoc, writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'
import toast from 'react-hot-toast'
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
    SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove as dndArrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HexColorPicker } from 'react-colorful'
import { GripVertical, ChevronDown, ChevronUp, Package } from 'lucide-react'
import { Link } from 'react-router-dom'

function ColorPickerField({ label, value, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div className="form-group" ref={ref} style={{ position: 'relative' }}>
            <label className="form-label">{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                    className="color-swatch"
                    style={{ background: value || '#4a7c59' }}
                    onClick={() => setOpen((o) => !o)}
                />
                <input
                    type="text"
                    className="form-input"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#4a7c59"
                    style={{ width: 100, flexShrink: 0 }}
                />
            </div>
            {open && (
                <div className="color-picker-popup">
                    <HexColorPicker color={value || '#4a7c59'} onChange={onChange} />
                </div>
            )}
        </div>
    )
}

function Toggle({ checked, onChange, label }) {
    return (
        <div className="toggle-wrap" onClick={() => onChange(!checked)}>
            <div className={`toggle-track ${checked ? 'on' : ''}`}>
                <div className="toggle-thumb" />
            </div>
            {label && <span className="toggle-label">{label}</span>}
        </div>
    )
}

function SortableCategoryCard({ cat, onUpdate }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
    const [expanded, setExpanded] = useState(false)
    const [saving, setSaving] = useState(false)
    const updateTimer = useRef(null)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
    }

    const handleUpdate = async (field, value) => {
        onUpdate(cat.id, field, value) // optimistic local update

        // Debounce Firestore write
        clearTimeout(updateTimer.current)
        updateTimer.current = setTimeout(async () => {
            setSaving(true)
            try {
                await updateDoc(doc(db, 'categories', cat.id), { [field]: value })
                if (field === 'active') {
                    logAuditEvent({ action: 'category.toggled', entity: 'category', entityId: cat.id, details: { name: cat.name, active: value } })
                }
            } catch (err) {
                toast.error(`Failed to update ${field}`)
            } finally {
                setSaving(false)
            }
        }, 600)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`category-card ${!cat.active ? 'inactive' : ''}`}
        >
            {/* Drag handle */}
            <div className="drag-handle" {...attributes} {...listeners}>
                <GripVertical size={18} />
            </div>

            {/* Color dot */}
            <div
                style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: cat.themeColor || '#4a7c59',
                    flexShrink: 0,
                    border: '1px solid var(--border)',
                }}
            />

            {/* Name + status */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {cat.active ? 'Active' : 'Inactive'} · {cat.duration || 15}s
                </div>
            </div>

            {/* Active toggle */}
            <Toggle
                checked={!!cat.active}
                onChange={(v) => handleUpdate('active', v)}
            />

            {/* Products link */}
            <Link to={`/products/${cat.slug || cat.id}`}>
                <button className="btn btn-ghost btn-sm" title="Manage Products">
                    <Package size={14} />
                </button>
            </Link>

            {/* Expand settings */}
            <button
                className="btn btn-ghost btn-sm"
                onClick={() => setExpanded((e) => !e)}
                style={{ padding: '6px' }}
            >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Expanded settings panel */}
            {expanded && (
                <div
                    style={{
                        width: '100%',
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid var(--border)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 20,
                        alignItems: 'start',
                    }}
                >
                    {/* Duration */}
                    <div className="form-group">
                        <label className="form-label">Duration: {cat.duration || 15}s</label>
                        <input
                            type="range"
                            className="range-slider"
                            min={10}
                            max={60}
                            step={5}
                            value={cat.duration || 15}
                            onChange={(e) => handleUpdate('duration', Number(e.target.value))}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>10s</span><span>60s</span>
                        </div>
                    </div>

                    {/* Primary color */}
                    <ColorPickerField
                        label="Primary Color"
                        value={cat.themeColor}
                        onChange={(v) => handleUpdate('themeColor', v)}
                    />

                    {/* Accent color */}
                    <ColorPickerField
                        label="Accent Color"
                        value={cat.accentColor}
                        onChange={(v) => handleUpdate('accentColor', v)}
                    />
                </div>
            )}
        </div>
    )
}

export default function Categories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        setLoading(true)
        try {
            const snap = await getDocs(collection(db, 'categories'))
            const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
            cats.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
            setCategories(cats)
        } catch {
            toast.error('Failed to load categories')
        } finally {
            setLoading(false)
        }
    }

    const handleDragEnd = async ({ active, over }) => {
        if (!over || active.id === over.id) return

        const oldIndex = categories.findIndex((c) => c.id === active.id)
        const newIndex = categories.findIndex((c) => c.id === over.id)
        const reordered = dndArrayMove(categories, oldIndex, newIndex)

        // Optimistic update
        setCategories(reordered)

        // Persist new order to Firestore
        setSaving(true)
        try {
            const batch = writeBatch(db)
            reordered.forEach((cat, idx) => {
                batch.update(doc(db, 'categories', cat.id), { order: idx })
            })
            await batch.commit()
            toast.success('Order saved')
        } catch {
            toast.error('Failed to save order')
            loadCategories() // revert
        } finally {
            setSaving(false)
        }
    }

    const handleFieldUpdate = (id, field, value) => {
        setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        )
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Categories</h1>
                    <p className="page-subtitle">Drag to reorder · Toggle to activate · Expand to configure</p>
                </div>
                {saving && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                        <div className="spinner" style={{ width: 14, height: 14 }} />
                        Saving…
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            style={{
                                height: 68,
                                background: 'var(--surface)',
                                borderRadius: 10,
                                border: '1px solid var(--border)',
                                animation: 'pulse 1.5s infinite',
                            }}
                        />
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Package size={28} /></div>
                    <div className="empty-state-title">No categories found</div>
                    <div className="empty-state-desc">Run the seed script to populate categories</div>
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                        {categories.map((cat) => (
                            <SortableCategoryCard
                                key={cat.id}
                                cat={cat}
                                onUpdate={handleFieldUpdate}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            )}
        </div>
    )
}
