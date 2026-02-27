import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ImageUploader from './ImageUploader'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { storage } from '../firebase'
import { dealSchema } from '../lib/schemas'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const DEAL_TYPES = ['BOGO', 'Discount', 'Bundle', 'Flash Sale', 'Custom']

async function uploadDealImage(file, dealId) {
    const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
    })
    const storageRef = ref(storage, `deals/${dealId}/image.webp`)
    await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, compressed)
        task.on('state_changed', null, reject, resolve)
    })
    return getDownloadURL(storageRef)
}

export default function DealForm({ defaultValues, onSave, onCancel }) {
    const isEdit = !!defaultValues?.id
    const [imageFile, setImageFile] = useState(null)
    const [uploading, setUploading] = useState(false)

    // Convert Firestore timestamps to datetime-local strings
    const toDatetimeLocal = (ts) => {
        if (!ts) return ''
        const d = ts?.toDate ? ts.toDate() : new Date(ts)
        return dayjs(d).format('YYYY-MM-DDTHH:mm')
    }

    const { register, handleSubmit, watch, control, formState: { errors, isSubmitting, isDirty } } = useForm({
        resolver: zodResolver(dealSchema),
        defaultValues: {
            title: '',
            description: '',
            dealType: 'Discount',
            originalPrice: '',
            dealPrice: '',
            displayPriority: 1,
            active: true,
            ...defaultValues,
            startTime: toDatetimeLocal(defaultValues?.startTime),
            endTime: toDatetimeLocal(defaultValues?.endTime),
        },
    })

    const hasUnsavedChanges = isDirty || !!imageFile

    const originalPrice = watch('originalPrice')
    const dealPrice = watch('dealPrice')

    const discount =
        originalPrice && dealPrice && Number(originalPrice) > 0
            ? Math.round((1 - Number(dealPrice) / Number(originalPrice)) * 100)
            : null

    const onSubmit = async (data) => {
        try {
            let imageUrl = defaultValues?.imageUrl || ''

            if (imageFile) {
                setUploading(true)
                const dealId = defaultValues?.id || `deal_${Date.now()}`
                try {
                    imageUrl = await uploadDealImage(imageFile, dealId)
                } catch {
                    toast.error('Image upload failed — deal not saved')
                    setUploading(false)
                    return
                }
                setUploading(false)
            }

            const dealData = {
                ...data,
                originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
                dealPrice: data.dealPrice ? Number(data.dealPrice) : null,
                displayPriority: Number(data.displayPriority) || 1,
                startTime: data.startTime ? new Date(data.startTime) : null,
                endTime: data.endTime ? new Date(data.endTime) : null,
                imageUrl,
            }

            await onSave(dealData, defaultValues?.id)
        } catch (err) {
            console.error(err)
            toast.error('Failed to save deal')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="panel-body">

                {/* Title */}
                <div className="form-group">
                    <label className="form-label">Deal Title *</label>
                    <input
                        className={`form-input ${errors.title ? 'error' : ''}`}
                        placeholder="🔥 BOGO Pre-Rolls!"
                        {...register('title')}
                    />
                    {errors.title && <span className="form-error">{errors.title.message}</span>}
                </div>

                {/* Description */}
                <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea
                        className={`form-textarea ${errors.description ? 'error' : ''}`}
                        placeholder="Buy one, get one FREE on all pre-rolls..."
                        {...register('description')}
                        style={{ minHeight: 72 }}
                    />
                    {errors.description && <span className="form-error">{errors.description.message}</span>}
                </div>

                {/* Type + Priority */}
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Deal Type *</label>
                        <select className="form-select" {...register('dealType')}>
                            {DEAL_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Display Priority</label>
                        <input
                            type="number"
                            min="1"
                            className="form-input"
                            placeholder="1"
                            {...register('displayPriority')}
                        />
                    </div>
                </div>

                {/* Pricing */}
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Original Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={`form-input ${errors.originalPrice ? 'error' : ''}`}
                            placeholder="40.00"
                            {...register('originalPrice')}
                        />
                        {errors.originalPrice && <span className="form-error">{errors.originalPrice.message}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Deal Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={`form-input ${errors.dealPrice ? 'error' : ''}`}
                            placeholder="20.00"
                            {...register('dealPrice')}
                        />
                        {errors.dealPrice && <span className="form-error">{errors.dealPrice.message}</span>}
                    </div>
                </div>

                {/* Discount badge */}
                {discount !== null && discount > 0 && (
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 14px',
                            background: 'rgba(46, 204, 113, 0.12)',
                            border: '1px solid rgba(46, 204, 113, 0.25)',
                            borderRadius: 8,
                            color: 'var(--success)',
                            fontWeight: 600,
                            fontSize: 14,
                        }}
                    >
                        🎉 {discount}% discount auto-calculated
                    </div>
                )}

                {/* Dates */}
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Start Date/Time *</label>
                        <input
                            type="datetime-local"
                            className={`form-input ${errors.startTime ? 'error' : ''}`}
                            {...register('startTime')}
                            style={{ colorScheme: 'dark' }}
                        />
                        {errors.startTime && <span className="form-error">{errors.startTime.message}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">End Date/Time (optional)</label>
                        <input
                            type="datetime-local"
                            className={`form-input ${errors.endTime ? 'error' : ''}`}
                            {...register('endTime')}
                            style={{ colorScheme: 'dark' }}
                        />
                        {errors.endTime ? (
                            <span className="form-error">{errors.endTime.message}</span>
                        ) : (
                            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                                Leave blank for ongoing deals
                            </span>
                        )}
                    </div>
                </div>

                {/* Image */}
                <ImageUploader
                    value={defaultValues?.imageUrl}
                    onChange={setImageFile}
                    label="Deal Image (optional)"
                />

                {/* Active toggle */}
                <div className="form-group">
                    <label className="form-label">Status</label>
                    <Controller
                        name="active"
                        control={control}
                        render={({ field }) => (
                            <div className="toggle-wrap" onClick={() => field.onChange(!field.value)}>
                                <div className={`toggle-track ${field.value ? 'on' : ''}`}>
                                    <div className="toggle-thumb" />
                                </div>
                                <span className="toggle-label">
                                    {field.value ? 'Active — visible on display' : 'Inactive — hidden from display'}
                                </span>
                            </div>
                        )}
                    />
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
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || uploading}>
                    {uploading ? (
                        <><div className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</>
                    ) : isSubmitting ? (
                        <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                    ) : isEdit ? 'Update Deal' : 'Create Deal'}
                </button>
            </div>
        </form>
    )
}
