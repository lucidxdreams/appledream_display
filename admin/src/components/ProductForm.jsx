import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { storage } from '../firebase'
import { productSchema } from '../lib/schemas'
import ImageUploader from './ImageUploader'
import { X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const PRODUCT_TYPES = ['Indica', 'Sativa', 'Hybrid', 'CBD', 'N/A']
const BADGES = ['', 'New', 'Limited', 'Best Seller', 'Staff Pick']
const WEIGHT_TIERS = ['1g', '3.5g', '7g', '14g', '28g']

async function uploadProductImage(file, productId) {
    const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        fileType: 'image/webp',
        maxWidthOrHeight: 800,
        useWebWorker: true,
    })
    const storageRef = ref(storage, `products/${productId}/image.webp`)
    await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, compressed)
        task.on('state_changed', null, reject, resolve)
    })
    return getDownloadURL(storageRef)
}

export default function ProductForm({ defaultValues, categorySlug, onSave, onCancel }) {
    const isEdit = !!defaultValues?.id
    const [imageFile, setImageFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [terpeneInput, setTerpeneInput] = useState('')
    const [terpenes, setTerpenes] = useState(defaultValues?.terpenes || [])
    const [priceByWeight, setPriceByWeight] = useState(
        defaultValues?.priceByWeight || {}
    )

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors, isSubmitting, isDirty },
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            brand: '',
            price: '',
            thc: '',
            cbd: '',
            type: 'Hybrid',
            notes: '',
            badge: '',
            featured: false,
            inStock: true,
            ...defaultValues,
        },
    })

    // Track if terpenes or priceByWeight changed (outside react-hook-form)
    const [extraDirty, setExtraDirty] = useState(false)
    const hasUnsavedChanges = isDirty || extraDirty || !!imageFile

    const onSubmit = async (data) => {
        try {
            let imageUrl = defaultValues?.imageUrl || ''

            if (imageFile) {
                setUploading(true)
                const productId = defaultValues?.id || `${categorySlug}_${Date.now()}`
                try {
                    imageUrl = await uploadProductImage(imageFile, productId)
                } catch (err) {
                    toast.error('Image upload failed — product not saved')
                    setUploading(false)
                    return
                }
                setUploading(false)
            }

            // Require image for new products
            if (!isEdit && !imageUrl) {
                toast.error('Please add a product image before saving')
                return
            }

            const productData = {
                ...data,
                price: Number(data.price) || 0,
                thc: Number(data.thc) || 0,
                cbd: Number(data.cbd) || 0,
                terpenes,
                priceByWeight,
                imageUrl,
                category: categorySlug,
            }

            await onSave(productData, defaultValues?.id)
        } catch (err) {
            console.error(err)
            toast.error('Failed to save product')
        }
    }

    const addTerpene = () => {
        const t = terpeneInput.trim()
        if (t && !terpenes.includes(t)) {
            setTerpenes((prev) => [...prev, t])
            setExtraDirty(true)
        }
        setTerpeneInput('')
    }

    const removeTerpene = (t) => {
        setTerpenes((prev) => prev.filter((x) => x !== t))
        setExtraDirty(true)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="panel-body">

                {/* Image */}
                <ImageUploader
                    value={defaultValues?.imageUrl}
                    onChange={setImageFile}
                />
                {!isEdit && !imageFile && !defaultValues?.imageUrl && (
                    <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -8, marginBottom: 8 }}>
                        Image is required for new products
                    </div>
                )}

                {/* Name + Brand */}
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Product Name *</label>
                        <input
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="Purple Punch #4"
                            {...register('name')}
                        />
                        {errors.name && <span className="form-error">{errors.name.message}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Brand</label>
                        <input className="form-input" placeholder="Brand name" {...register('brand')} />
                    </div>
                </div>

                {/* Price + Type */}
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Base Price ($) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={`form-input ${errors.price ? 'error' : ''}`}
                            placeholder="12.00"
                            {...register('price')}
                        />
                        {errors.price && <span className="form-error">{errors.price.message}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Strain Type *</label>
                        <select className="form-select" {...register('type')}>
                            {PRODUCT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* THC + CBD */}
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">THC % *</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className={`form-input ${errors.thc ? 'error' : ''}`}
                            placeholder="22.5"
                            {...register('thc')}
                        />
                        {errors.thc && <span className="form-error">{errors.thc.message}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">CBD %</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className={`form-input ${errors.cbd ? 'error' : ''}`}
                            placeholder="0.5"
                            {...register('cbd')}
                        />
                        {errors.cbd && <span className="form-error">{errors.cbd.message}</span>}
                    </div>
                </div>

                {/* Price by Weight (flower only) */}
                <div className="form-group">
                    <label className="form-label">Price by Weight (optional)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {WEIGHT_TIERS.map((w) => (
                            <div key={w} className="form-group">
                                <label className="form-label" style={{ fontSize: 11 }}>{w}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    placeholder="—"
                                    value={priceByWeight[w] || ''}
                                    onChange={(e) => {
                                        setPriceByWeight((prev) => ({
                                            ...prev,
                                            [w]: e.target.value ? Number(e.target.value) : undefined,
                                        }))
                                        setExtraDirty(true)
                                    }}
                                    style={{ padding: '8px 10px' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                    <label className="form-label">Flavor / Effect Notes (max 120 chars)</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Smooth, earthy with hints of grape..."
                        maxLength={120}
                        {...register('notes')}
                        style={{ minHeight: 64 }}
                    />
                </div>

                {/* Terpenes */}
                <div className="form-group">
                    <label className="form-label">Terpenes</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Add terpene + Enter"
                            value={terpeneInput}
                            onChange={(e) => setTerpeneInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTerpene() } }}
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={addTerpene}>
                            <Plus size={14} />
                        </button>
                    </div>
                    {terpenes.length > 0 && (
                        <div className="tag-list">
                            {terpenes.map((t) => (
                                <span className="tag" key={t}>
                                    {t}
                                    <span className="tag-remove" onClick={() => removeTerpene(t)}>
                                        <X size={11} />
                                    </span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Badge + Toggles */}
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Badge</label>
                        <select className="form-select" {...register('badge')}>
                            {BADGES.map((b) => (
                                <option key={b} value={b}>{b || '— None —'}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Flags</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                            <Controller
                                name="inStock"
                                control={control}
                                render={({ field }) => (
                                    <div
                                        className="toggle-wrap"
                                        onClick={() => field.onChange(!field.value)}
                                    >
                                        <div className={`toggle-track ${field.value ? 'on' : ''}`}>
                                            <div className="toggle-thumb" />
                                        </div>
                                        <span className="toggle-label">In Stock</span>
                                    </div>
                                )}
                            />
                            <Controller
                                name="featured"
                                control={control}
                                render={({ field }) => (
                                    <div
                                        className="toggle-wrap"
                                        onClick={() => field.onChange(!field.value)}
                                    >
                                        <div className={`toggle-track ${field.value ? 'on' : ''}`}>
                                            <div className="toggle-thumb" />
                                        </div>
                                        <span className="toggle-label">Featured</span>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
                <div
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(243, 156, 18, 0.1)',
                        borderTop: '1px solid rgba(243, 156, 18, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12.5,
                        color: '#f39c12',
                    }}
                >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f39c12', flexShrink: 0 }} />
                    You have unsaved changes
                </div>
            )}

            <div className="panel-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || uploading}
                >
                    {uploading ? (
                        <><div className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</>
                    ) : isSubmitting ? (
                        <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                    ) : isEdit ? (
                        'Update Product'
                    ) : (
                        'Add Product'
                    )}
                </button>
            </div>
        </form>
    )
}
