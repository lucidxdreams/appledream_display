import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { storage } from '../firebase'
import { productSchema, ediblesSchema, vapesSchema, cartridgesSchema, prerollsSchema } from '../lib/schemas'
import ImageUploader from './ImageUploader'
import { X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const PRODUCT_TYPES = ['Indica', 'Sativa', 'Hybrid', 'CBD', 'Indica Dom.', 'Sativa Dom.', 'N/A']
const BADGES = ['', 'New', 'Limited', 'Best Seller', 'Staff Pick']
const WEIGHT_TIERS = ['1g', '3.5g', '7g', '14g', '28g']

const EFFECT_PRESETS = [
    'Focus', 'Uplift', 'Relax', 'Sleep', 'Creative',
    'Energize', 'Calm', 'Euphoric', 'Giggly', 'Hungry',
]

const THC_MG_PRESETS = [25, 50, 100, 150, 200, 300, 500]
const PIECE_COUNT_PRESETS = [2, 5, 10, 15, 20, 25, 30]

const CART_SIZES_VAPE = ['0.5g', '1g', '2g']
const CART_SIZES_CART = ['0.5g', '1g']
const VAPE_TYPES = ['Classic THC', 'CBD Ratio', 'CBN Blend', 'Live Resin', 'Distillate']
const EXTRACT_TYPES = ['Cured Resin', 'Live Resin', 'Distillate', 'Rosin', 'HTFSE', 'Badder', 'Sugar']
const FLAVOR_PRESETS = [
    'Citrus', 'Berry', 'Vanilla', 'Lavender', 'Mint', 'Tropical',
    'Earthy', 'Pine', 'Grape', 'Peach', 'Lemon', 'Diesel',
]
const CART_EFFECT_PRESETS = ['Calm', 'Happy', 'Relaxed', 'Energetic', 'Creative', 'Focused', 'Euphoric', 'Sleepy', 'Uplifted', 'Giggly']

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

/* ── Reusable Toggle ──────────────────────────────────────────────── */
function ToggleField({ control, name, label }) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <div className="toggle-wrap" onClick={() => field.onChange(!field.value)}>
                    <div className={`toggle-track ${field.value ? 'on' : ''}`}>
                        <div className="toggle-thumb" />
                    </div>
                    <span className="toggle-label">{label}</span>
                </div>
            )}
        />
    )
}

/* ── Edibles-specific Fields ──────────────────────────────────────── */
function EdiblesFields({ register, errors, effects, setEffects, setExtraDirty, defaultValues }) {
    const [effectInput, setEffectInput] = useState('')

    const addEffect = (val) => {
        const t = (val || effectInput).trim()
        if (t && !effects.includes(t)) {
            setEffects(prev => [...prev, t])
            setExtraDirty(true)
        }
        setEffectInput('')
    }

    const removeEffect = (e) => {
        setEffects(prev => prev.filter(x => x !== e))
        setExtraDirty(true)
    }

    return (
        <>
            {/* mg THC + Piece Count */}
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">THC (mg) *</label>
                    <input
                        type="number"
                        step="1"
                        min="0"
                        className={`form-input ${errors.thcMg ? 'error' : ''}`}
                        placeholder="100"
                        {...register('thcMg')}
                    />
                    {errors.thcMg && <span className="form-error">{errors.thcMg.message}</span>}
                    {/* Quick-pick presets */}
                    <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                        {THC_MG_PRESETS.map(mg => (
                            <button
                                key={mg}
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                                onClick={() => {
                                    // manually set value via ref trick
                                    const el = document.querySelector('input[name="thcMg"]')
                                    if (el) { el.value = mg; el.dispatchEvent(new Event('input', { bubbles: true })) }
                                }}
                            >
                                {mg}mg
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Pieces per Pack *</label>
                    <input
                        type="number"
                        step="1"
                        min="1"
                        className={`form-input ${errors.pieceCount ? 'error' : ''}`}
                        placeholder="10"
                        {...register('pieceCount')}
                    />
                    {errors.pieceCount && <span className="form-error">{errors.pieceCount.message}</span>}
                    <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                        {PIECE_COUNT_PRESETS.map(n => (
                            <button
                                key={n}
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                                onClick={() => {
                                    const el = document.querySelector('input[name="pieceCount"]')
                                    if (el) { el.value = n; el.dispatchEvent(new Event('input', { bubbles: true })) }
                                }}
                            >
                                {n}pc
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Effects */}
            <div className="form-group">
                <label className="form-label">Effects</label>
                {/* Preset chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {EFFECT_PRESETS.map(e => {
                        const active = effects.includes(e)
                        return (
                            <button
                                key={e}
                                type="button"
                                onClick={() => active ? removeEffect(e) : addEffect(e)}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: 20,
                                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                                    background: active ? 'var(--accent-dim)' : 'var(--surface-2)',
                                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                                    fontSize: 12,
                                    fontWeight: active ? 600 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {active ? '✓ ' : ''}{e}
                            </button>
                        )
                    })}
                </div>
                {/* Free-text add */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Add custom effect..."
                        value={effectInput}
                        onChange={e => setEffectInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEffect() } }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => addEffect()}>
                        <Plus size={14} />
                    </button>
                </div>
                {effects.length > 0 && (
                    <div className="tag-list" style={{ marginTop: 8 }}>
                        {effects.map(e => (
                            <span className="tag" key={e}>
                                {e}
                                <span className="tag-remove" onClick={() => removeEffect(e)}>
                                    <X size={11} />
                                </span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

/* ── Vapes-specific Fields ───────────────────────────────────────── */
function VapesFields({ register, errors, flavors, setFlavors, setExtraDirty }) {
    const [flavorInput, setFlavorInput] = useState('')

    const addFlavor = (val) => {
        const t = (val || flavorInput).trim()
        if (t && !flavors.includes(t)) { setFlavors(prev => [...prev, t]); setExtraDirty(true) }
        setFlavorInput('')
    }
    const removeFlavor = (f) => { setFlavors(prev => prev.filter(x => x !== f)); setExtraDirty(true) }

    return (
        <>
            {/* THC% + CBD% */}
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">THC % *</label>
                    <input type="number" step="0.01" min="0" max="100"
                        className={`form-input ${errors.thc ? 'error' : ''}`}
                        placeholder="90.5" {...register('thc')} />
                    {errors.thc && <span className="form-error">{errors.thc.message}</span>}
                </div>
                <div className="form-group">
                    <label className="form-label">CBD %</label>
                    <input type="number" step="0.01" min="0" max="100"
                        className="form-input" placeholder="0.0" {...register('cbd')} />
                </div>
            </div>

            {/* Cart Size + Vape Type */}
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">Cartridge Size *</label>
                    <select className="form-select" {...register('cartSize')}>
                        {CART_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Vape Type</label>
                    <select className="form-select" {...register('vapeType')}>
                        {VAPE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* Flavor Notes */}
            <div className="form-group">
                <label className="form-label">Flavor Profile</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {FLAVOR_PRESETS.map(f => {
                        const active = flavors.includes(f)
                        return (
                            <button key={f} type="button"
                                onClick={() => active ? removeFlavor(f) : addFlavor(f)}
                                style={{
                                    padding: '4px 12px', borderRadius: 20,
                                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                                    background: active ? 'var(--accent-dim)' : 'var(--surface-2)',
                                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                                    fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
                                }}>
                                {active ? '✓ ' : ''}{f}
                            </button>
                        )
                    })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" className="form-input" placeholder="Add flavor..."
                        value={flavorInput}
                        onChange={e => setFlavorInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFlavor() } }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => addFlavor()}>
                        <Plus size={14} />
                    </button>
                </div>
                {flavors.length > 0 && (
                    <div className="tag-list" style={{ marginTop: 8 }}>
                        {flavors.map(f => (
                            <span className="tag" key={f}>
                                {f}
                                <span className="tag-remove" onClick={() => removeFlavor(f)}><X size={11} /></span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

/* ── Cartridges-specific Fields ──────────────────────────────────── */
function CartridgesFields({ register, errors, effects, setEffects, setExtraDirty }) {
    const [effectInput, setEffectInput] = useState('')

    const addEffect = (val) => {
        const t = (val || effectInput).trim()
        if (t && !effects.includes(t)) { setEffects(prev => [...prev, t]); setExtraDirty(true) }
        setEffectInput('')
    }
    const removeEffect = (e) => { setEffects(prev => prev.filter(x => x !== e)); setExtraDirty(true) }

    return (
        <>
            {/* THC% + CBD% */}
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">THC % *</label>
                    <input type="number" step="0.01" min="0" max="100"
                        className={`form-input ${errors.thc ? 'error' : ''}`}
                        placeholder="80.9" {...register('thc')} />
                    {errors.thc && <span className="form-error">{errors.thc.message}</span>}
                </div>
                <div className="form-group">
                    <label className="form-label">CBD %</label>
                    <input type="number" step="0.01" min="0" max="100"
                        className="form-input" placeholder="0.47" {...register('cbd')} />
                </div>
            </div>

            {/* CBG% + CBN% */}
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">CBG %</label>
                    <input type="number" step="0.01" min="0" max="100"
                        className="form-input" placeholder="1.00" {...register('cbg')} />
                </div>
                <div className="form-group">
                    <label className="form-label">CBN %</label>
                    <input type="number" step="0.01" min="0" max="100"
                        className="form-input" placeholder="0.25" {...register('cbn')} />
                </div>
            </div>

            {/* Extract Type + Cart Size */}
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">Extract Type *</label>
                    <select className="form-select" {...register('extractType')}>
                        {EXTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Size *</label>
                    <select className="form-select" {...register('cartSize')}>
                        {CART_SIZES_CART.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Effects */}
            <div className="form-group">
                <label className="form-label">Effects</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {CART_EFFECT_PRESETS.map(e => {
                        const active = effects.includes(e)
                        return (
                            <button key={e} type="button"
                                onClick={() => active ? removeEffect(e) : addEffect(e)}
                                style={{
                                    padding: '4px 12px', borderRadius: 20,
                                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                                    background: active ? 'var(--accent-dim)' : 'var(--surface-2)',
                                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                                    fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
                                }}>
                                {active ? '✓ ' : ''}{e}
                            </button>
                        )
                    })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" className="form-input" placeholder="Add custom effect..."
                        value={effectInput}
                        onChange={e => setEffectInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEffect() } }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => addEffect()}>
                        <Plus size={14} />
                    </button>
                </div>
                {effects.length > 0 && (
                    <div className="tag-list" style={{ marginTop: 8 }}>
                        {effects.map(e => (
                            <span className="tag" key={e}>
                                {e}
                                <span className="tag-remove" onClick={() => removeEffect(e)}><X size={11} /></span>
                            </span>
                        ))}
                )}
                    </div>
        </>
            )
}

            /* ── Pre-Rolls Fields ────────────────────────────────────────────────── */
            function PrerollsFields({register, errors}) {
    return (
            <>
                <div className="section-title">Pre-Roll Details</div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Weight</label>
                        <select className="form-input" {...register('weight')}>
                            {['0.5g', '0.7g', '1g', '1.5g', '2g', '2.5g', '3g', 'Custom'].map(w => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">THC % *</label>
                        <input
                            type="number" step="0.01" min="0" max="100"
                            className={`form-input ${errors.thc ? 'error' : ''}`}
                            placeholder="22.5"
                            {...register('thc')}
                        />
                        {errors.thc && <span className="form-error">{errors.thc.message}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">CBD %</label>
                        <input
                            type="number" step="0.01" min="0" max="100"
                            className={`form-input ${errors.cbd ? 'error' : ''}`}
                            placeholder="0.0"
                            {...register('cbd')}
                        />
                        {errors.cbd && <span className="form-error">{errors.cbd.message}</span>}
                    </div>
                </div>
            </>
            )
}

            /* ── Main Form ────────────────────────────────────────────────────── */
            export default function ProductForm({defaultValues, categorySlug, onSave, onCancel}) {
    const isEdibles = categorySlug === 'edibles'
            const isVapes = categorySlug === 'vapes' || categorySlug === 'disposables' || categorySlug === 'disposables-vapes'
            const isCartridges = categorySlug === 'cartridges'
            const isPrerolls = categorySlug === 'pre-rolls'
            const isEdit = !!defaultValues?.id

            const [imageFile, setImageFile] = useState(null)
            const [uploading, setUploading] = useState(false)
            const [extraDirty, setExtraDirty] = useState(false)

            // Flower-only extras
            const [terpeneInput, setTerpeneInput] = useState('')
            const [terpenes, setTerpenes] = useState(defaultValues?.terpenes || [])
            const [priceByWeight, setPriceByWeight] = useState(defaultValues?.priceByWeight || { })

            // Edibles-only
            const [effects, setEffects] = useState(defaultValues?.effects || [])
            // Vapes-only
            const [flavors, setFlavors] = useState(defaultValues?.flavors || [])
            // Cartridges-only
            const [cartEffects, setCartEffects] = useState(defaultValues?.effects || [])

            const schema = isEdibles ? ediblesSchema : isVapes ? vapesSchema : isCartridges ? cartridgesSchema : isPrerolls ? prerollsSchema : productSchema
            const {register, handleSubmit, control, watch, formState: {errors, isSubmitting, isDirty} } = useForm({
                resolver: zodResolver(schema),
            defaultValues: isEdibles
            ? {
                name: '', brand: '', price: '', thcMg: '', pieceCount: 10,
            type: 'Hybrid', notes: '', badge: '', featured: false, inStock: true,
            ...defaultValues,
            }
            : isVapes
            ? {
                name: '', brand: '', price: '', thc: '', cbd: '',
            type: 'Hybrid', cartSize: '1g', vapeType: 'Classic THC', flavors: [],
            notes: '', badge: '', featured: false, inStock: true,
            ...defaultValues,
                }
            : isCartridges
            ? {
                name: '', brand: '', price: '', thc: '', cbd: '', cbg: '', cbn: '',
            type: 'Hybrid', extractType: 'Cured Resin', cartSize: '1g', effects: [],
            notes: '', badge: '', featured: false, inStock: true,
            ...defaultValues,
                    }
            : {
                name: '', brand: '', price: '', thc: '', cbd: '',
            type: 'Hybrid', sellType: 'Pre-packed', notes: '', badge: '',
            featured: false, inStock: true,
            ...defaultValues,
                    },
    })

            const hasUnsavedChanges = isDirty || extraDirty || !!imageFile

    const onSubmit = async (data) => {
        try {
                let imageUrl = defaultValues?.imageUrl || ''
            if (imageFile) {
                setUploading(true)
                const productId = defaultValues?.id || `${categorySlug}_${Date.now()}`
            try {
                imageUrl = await uploadProductImage(imageFile, productId)
            } catch {
                toast.error('Image upload failed — product not saved')
                    setUploading(false)
            return
                }
            setUploading(false)
            }

            if (!isEdit && !imageUrl) {
                toast.error('Please add a product image before saving')
                return
            }

            const productData = isEdibles
            ? {
                ...data,
                price: Number(data.price) || 0,
            thcMg: Number(data.thcMg) || 0,
            pieceCount: Number(data.pieceCount) || 10,
            effects,
            sellType: 'Pre-packed',
            imageUrl,
            category: categorySlug,
                }
            : isVapes
            ? {
                ...data,
                price: Number(data.price) || 0,
            thc: Number(data.thc) || 0,
            cbd: Number(data.cbd) || 0,
            flavors,
            sellType: 'Pre-packed',
            imageUrl,
            category: categorySlug,
                    }
            : isCartridges
            ? {
                ...data,
                price: Number(data.price) || 0,
            thc: Number(data.thc) || 0,
            cbd: Number(data.cbd) || 0,
            cbg: Number(data.cbg) || 0,
            cbn: Number(data.cbn) || 0,
            effects: cartEffects,
            sellType: 'Pre-packed',
            imageUrl,
            category: categorySlug,
                        }
            : isPrerolls
            ? {
                ...data,
                price: Number(data.price) || 0,
            thc: Number(data.thc) || 0,
            cbd: Number(data.cbd) || 0,
            sellType: 'Pre-packed',
            imageUrl,
            category: categorySlug,
                            }
            : {
                ...data,
                price: Number(data.price) || 0,
            thc: Number(data.thc) || 0,
            cbd: Number(data.cbd) || 0,
            terpenes,
            priceByWeight: data.sellType === 'Weighted' ? priceByWeight : { },
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
            if (t && !terpenes.includes(t)) {setTerpenes(prev => [...prev, t]); setExtraDirty(true) }
            setTerpeneInput('')
    }
    const removeTerpene = (t) => {setTerpenes(prev => prev.filter(x => x !== t)); setExtraDirty(true) }

            return (
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="panel-body">

                    {/* Image */}
                    <ImageUploader value={defaultValues?.imageUrl} onChange={setImageFile} />
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
                                placeholder={isEdibles ? 'Sour Peach Raspberry' : 'Purple Punch #4'}
                                {...register('name')}
                            />
                            {errors.name && <span className="form-error">{errors.name.message}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Brand</label>
                            <input className="form-input" placeholder={isEdibles ? 'Easyday' : 'Brand name'} {...register('brand')} />
                        </div>
                    </div>

                    {/* Price + Strain Type */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Price ($) *</label>
                            <input
                                type="number" step="0.01" min="0"
                                className={`form-input ${errors.price ? 'error' : ''}`}
                                placeholder="25.00"
                                {...register('price')}
                            />
                            {errors.price && <span className="form-error">{errors.price.message}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Strain Type *</label>
                            <select className="form-select" {...register('type')}>
                                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ── EDIBLES-SPECIFIC fields ── */}
                    {isEdibles && (
                        <EdiblesFields
                            register={register}
                            errors={errors}
                            effects={effects}
                            setEffects={setEffects}
                            setExtraDirty={setExtraDirty}
                            defaultValues={defaultValues}
                        />
                    )}

                    {/* ── VAPES-SPECIFIC fields ── */}
                    {isVapes && (
                        <VapesFields
                            register={register}
                            errors={errors}
                            flavors={flavors}
                            setFlavors={setFlavors}
                            setExtraDirty={setExtraDirty}
                        />
                    )}

                    {/* ── CARTRIDGES-SPECIFIC fields ── */}
                    {isCartridges && (
                        <CartridgesFields
                            register={register}
                            errors={errors}
                            effects={cartEffects}
                            setEffects={setCartEffects}
                            setExtraDirty={setExtraDirty}
                        />
                    )}

                    {/* ── FLOWER/OTHER fields ── */}
                    {!isEdibles && !isVapes && !isCartridges && (<>
                        {/* THC + CBD */}
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">THC % *</label>
                                <input type="number" step="0.01" min="0" max="100"
                                    className={`form-input ${errors.thc ? 'error' : ''}`}
                                    placeholder="22.5" {...register('thc')} />
                                {errors.thc && <span className="form-error">{errors.thc.message}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">CBD %</label>
                                <input type="number" step="0.01" min="0" max="100"
                                    className={`form-input ${errors.cbd ? 'error' : ''}`}
                                    placeholder="0.5" {...register('cbd')} />
                                {errors.cbd && <span className="form-error">{errors.cbd.message}</span>}
                            </div>
                        </div>

                        {/* Packaging Type */}
                        <div className="form-group">
                            <label className="form-label">Packaging Type *</label>
                            <select className="form-select" {...register('sellType')}>
                                <option value="Pre-packed">Pre-packed</option>
                                <option value="Weighted">Weighted</option>
                            </select>
                        </div>

                        {/* Price by Weight */}
                        {watch('sellType') === 'Weighted' && (
                            <div className="form-group">
                                <label className="form-label">Price by Weight</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                    {WEIGHT_TIERS.map(w => (
                                        <div key={w} className="form-group">
                                            <label className="form-label" style={{ fontSize: 11 }}>{w}</label>
                                            <input type="number" step="0.01" min="0" className="form-input"
                                                placeholder="—"
                                                value={priceByWeight[w] || ''}
                                                onChange={e => {
                                                    setPriceByWeight(prev => ({ ...prev, [w]: e.target.value ? Number(e.target.value) : undefined }))
                                                    setExtraDirty(true)
                                                }}
                                                style={{ padding: '8px 10px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Terpenes */}
                        <div className="form-group">
                            <label className="form-label">Terpenes</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="text" className="form-input" placeholder="Add terpene + Enter"
                                    value={terpeneInput}
                                    onChange={e => setTerpeneInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTerpene() } }}
                                />
                                <button type="button" className="btn btn-secondary btn-sm" onClick={addTerpene}>
                                    <Plus size={14} />
                                </button>
                            </div>
                            {terpenes.length > 0 && (
                                <div className="tag-list">
                                    {terpenes.map(t => (
                                        <span className="tag" key={t}>
                                            {t}
                                            <span className="tag-remove" onClick={() => removeTerpene(t)}><X size={11} /></span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                    )}

                    {/* Notes — shared */}
                    <div className="form-group">
                        <label className="form-label">
                            {isEdibles ? 'Flavor Notes (max 200 chars)' : 'Flavor / Effect Notes (max 120 chars)'}
                        </label>
                        <textarea
                            className="form-textarea"
                            placeholder={isEdibles ? 'Sour peach & raspberry with a tangy tropical finish...' : 'Smooth, earthy with hints of grape...'}
                            maxLength={isEdibles ? 200 : 120}
                            {...register('notes')}
                            style={{ minHeight: 64 }}
                        />
                    </div>

                    {/* Badge + Toggles — shared */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Badge</label>
                            <select className="form-select" {...register('badge')}>
                                {BADGES.map(b => <option key={b} value={b}>{b || '— None —'}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Flags</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                                <ToggleField control={control} name="inStock" label="In Stock" />
                                <ToggleField control={control} name="featured" label="Featured" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unsaved changes indicator */}
                {hasUnsavedChanges && (
                    <div style={{ padding: '8px 16px', background: 'rgba(243,156,18,0.1)', borderTop: '1px solid rgba(243,156,18,0.25)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#f39c12' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f39c12', flexShrink: 0 }} />
                        You have unsaved changes
                    </div>
                )}

                <div className="panel-footer">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting || uploading}>
                        {uploading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</>
                            : isSubmitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                                : isEdit ? 'Update Product' : 'Add Product'}
                    </button>
                </div>
            </form>
            )
}

            /* ── Pre-Rolls Fields ────────────────────────────────────────────────── */
            function PrerollsFields({register, errors}) {
    return (
            <>
                <div className="section-title">Pre-Roll Details</div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Weight</label>
                        <select className="form-input" {...register('weight')}>
                            {['0.5g', '0.7g', '1g', '1.5g', '2g', '2.5g', '3g', 'Custom'].map(w => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">THC % *</label>
                        <input
                            type="number" step="0.01" min="0" max="100"
                            className={`form-input ${errors.thc ? 'error' : ''}`}
                            placeholder="22.5"
                            {...register('thc')}
                        />
                        {errors.thc && <span className="form-error">{errors.thc.message}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">CBD %</label>
                        <input
                            type="number" step="0.01" min="0" max="100"
                            className={`form-input ${errors.cbd ? 'error' : ''}`}
                            placeholder="0.0"
                            {...register('cbd')}
                        />
                        {errors.cbd && <span className="form-error">{errors.cbd.message}</span>}
                    </div>
                </div>
            </>
            )
}
