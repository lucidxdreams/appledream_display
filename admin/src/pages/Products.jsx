import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
    collection, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc, serverTimestamp
} from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { logAuditEvent } from '../lib/auditLog'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ChevronLeft, Star, Package } from 'lucide-react'
import ProductForm from '../components/ProductForm'
import ConfirmDialog from '../components/ConfirmDialog'

function Toggle({ checked, onChange }) {
    return (
        <div className="toggle-wrap" onClick={() => onChange(!checked)}>
            <div className={`toggle-track ${checked ? 'on' : ''}`}>
                <div className="toggle-thumb" />
            </div>
        </div>
    )
}

export default function Products() {
    const { categorySlug } = useParams()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [panelOpen, setPanelOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)

    const collectionPath = `products/${categorySlug}/items`

    useEffect(() => {
        loadProducts()
    }, [categorySlug])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const snap = await getDocs(collection(db, 'products', categorySlug, 'items'))
            const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
            prods.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            setProducts(prods)
        } catch (err) {
            toast.error('Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    const openAdd = () => {
        setEditingProduct(null)
        setPanelOpen(true)
    }

    const openEdit = (product) => {
        setEditingProduct(product)
        setPanelOpen(true)
    }

    const closePanel = () => {
        setPanelOpen(false)
        setEditingProduct(null)
    }

    const handleSave = async (data, existingId) => {
        try {
            if (existingId) {
                // Optimistic locking: check if doc was modified since we loaded it
                const currentDoc = await getDoc(doc(db, 'products', categorySlug, 'items', existingId))
                if (currentDoc.exists()) {
                    const currentUpdatedAt = currentDoc.data().updatedAt?.toMillis?.() || 0
                    const loadedUpdatedAt = editingProduct?.updatedAt?.toMillis?.() || editingProduct?.updatedAt?.seconds * 1000 || 0
                    if (currentUpdatedAt > 0 && loadedUpdatedAt > 0 && currentUpdatedAt !== loadedUpdatedAt) {
                        toast.error('This product was modified by another admin. Please close and reopen to get the latest version.', { duration: 5000 })
                        return
                    }
                }

                await updateDoc(doc(db, 'products', categorySlug, 'items', existingId), {
                    ...data,
                    updatedAt: serverTimestamp(),
                })
                toast.success('Product updated!')
                logAuditEvent({ action: 'product.updated', entity: 'product', entityId: existingId, details: { name: data.name, category: categorySlug } })
            } else {
                const docRef = await addDoc(collection(db, 'products', categorySlug, 'items'), {
                    ...data,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                })
                toast.success('Product added!')
                logAuditEvent({ action: 'product.created', entity: 'product', entityId: docRef.id, details: { name: data.name, category: categorySlug } })
            }
            closePanel()
            loadProducts()
        } catch (err) {
            console.error(err)
            toast.error('Failed to save product')
        }
    }

    const handleToggle = async (product, field) => {
        const newVal = !product[field]
        setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, [field]: newVal } : p))
        )
        try {
            await updateDoc(doc(db, 'products', categorySlug, 'items', product.id), {
                [field]: newVal,
                updatedAt: serverTimestamp(),
            })
        } catch {
            toast.error('Failed to update')
            loadProducts()
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            // Clean up image from Firebase Storage (best-effort)
            try {
                const imageRef = ref(storage, `products/${deleteTarget.id}/image.webp`)
                await deleteObject(imageRef)
            } catch {
                // Image may not exist — that's fine
            }

            await deleteDoc(doc(db, 'products', categorySlug, 'items', deleteTarget.id))
            toast.success('Product deleted')
            setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
            logAuditEvent({ action: 'product.deleted', entity: 'product', entityId: deleteTarget.id, details: { name: deleteTarget.name, category: categorySlug } })
        } catch {
            toast.error('Failed to delete')
        } finally {
            setDeleteTarget(null)
        }
    }

    const categoryLabel = categorySlug
        ? categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)
        : 'Products'

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Link to="/categories">
                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', gap: 4 }}>
                                <ChevronLeft size={14} /> Categories
                            </button>
                        </Link>
                    </div>
                    <h1 className="page-title">{categoryLabel}</h1>
                    <p className="page-subtitle">{products.length} products · {products.filter(p => p.inStock).length} in stock</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={16} /> Add Product
                </button>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><Package size={28} /></div>
                        <div className="empty-state-title">No products yet</div>
                        <div className="empty-state-desc">Click "Add Product" to get started</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 60 }}>Image</th>
                                <th>Name</th>
                                <th>Brand</th>
                                <th>Price</th>
                                <th>THC%</th>
                                <th>Type</th>
                                <th style={{ width: 80 }}>In Stock</th>
                                <th style={{ width: 80 }}>Featured</th>
                                <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    {/* Thumbnail */}
                                    <td>
                                        <div className="product-thumb">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} />
                                            ) : (
                                                <Package size={18} style={{ color: 'var(--text-muted)' }} />
                                            )}
                                        </div>
                                    </td>

                                    <td>
                                        <div style={{ fontWeight: 500 }}>{product.name}</div>
                                        {product.badge && (
                                            <span className="badge badge-info" style={{ marginTop: 3 }}>
                                                {product.badge}
                                            </span>
                                        )}
                                    </td>

                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {product.brand || '—'}
                                    </td>

                                    <td>${Number(product.price || 0).toFixed(2)}</td>

                                    <td>
                                        <span style={{ fontWeight: 600 }}>{product.thc || 0}%</span>
                                    </td>

                                    <td>
                                        <span
                                            className={`badge ${product.type === 'Indica'
                                                ? 'badge-info'
                                                : product.type === 'Sativa'
                                                    ? 'badge-warning'
                                                    : product.type === 'Hybrid'
                                                        ? 'badge-success'
                                                        : ''
                                                }`}
                                            style={{ textTransform: 'none' }}
                                        >
                                            {product.type || 'N/A'}
                                        </span>
                                    </td>

                                    <td>
                                        <Toggle
                                            checked={!!product.inStock}
                                            onChange={() => handleToggle(product, 'inStock')}
                                        />
                                    </td>

                                    <td>
                                        <Toggle
                                            checked={!!product.featured}
                                            onChange={() => handleToggle(product, 'featured')}
                                        />
                                    </td>

                                    <td>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => openEdit(product)}
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => setDeleteTarget(product)}
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Slide-in panel */}
            {panelOpen && (
                <>
                    <div className="panel-overlay" onClick={closePanel} />
                    <div className="panel panel-lg">
                        <div className="panel-header">
                            <h2 className="panel-title">
                                {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Product'}
                            </h2>
                            <button className="btn btn-ghost btn-sm" onClick={closePanel}>
                                ✕
                            </button>
                        </div>
                        <ProductForm
                            defaultValues={editingProduct}
                            categorySlug={categorySlug}
                            onSave={handleSave}
                            onCancel={closePanel}
                        />
                    </div>
                </>
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Delete Product"
                    message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
                    confirmLabel="Delete Product"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    )
}
