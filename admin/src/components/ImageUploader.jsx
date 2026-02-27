import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCEPTED_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
}
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export default function ImageUploader({ value, onChange, label = 'Product Image' }) {
    const [preview, setPreview] = useState(value || null)

    const onDrop = useCallback(
        (acceptedFiles) => {
            const file = acceptedFiles[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => setPreview(reader.result)
            reader.readAsDataURL(file)
            onChange(file)
        },
        [onChange]
    )

    const onDropRejected = useCallback((fileRejections) => {
        const rejection = fileRejections[0]
        if (!rejection) return
        const errors = rejection.errors.map((e) => e.message).join(', ')
        if (rejection.errors.some((e) => e.code === 'file-too-large')) {
            toast.error('Image must be under 5 MB')
        } else if (rejection.errors.some((e) => e.code === 'file-invalid-type')) {
            toast.error('Only JPG, PNG, and WebP images are allowed')
        } else {
            toast.error(`File rejected: ${errors}`)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        accept: ACCEPTED_TYPES,
        maxFiles: 1,
        maxSize: MAX_SIZE,
    })

    const clear = (e) => {
        e.stopPropagation()
        setPreview(null)
        onChange(null)
    }

    return (
        <div className="form-group">
            <label className="form-label">{label}</label>

            {preview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                        src={preview}
                        alt="Preview"
                        style={{
                            width: '100%',
                            maxHeight: 200,
                            objectFit: 'contain',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--surface-2)',
                        }}
                    />
                    <button
                        type="button"
                        onClick={clear}
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={14} />
                    </button>
                    <div
                        {...getRootProps()}
                        style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            background: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: 11,
                            gap: 4,
                            padding: '4px 8px',
                            borderRadius: 6,
                        }}
                    >
                        <input {...getInputProps()} />
                        <Upload size={12} /> Change
                    </div>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'drag-over' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: 'var(--surface-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDragActive ? 'var(--accent)' : 'var(--text-muted)',
                            }}
                        >
                            {isDragActive ? <Upload size={22} /> : <Image size={22} />}
                        </div>
                        <div>
                            {isDragActive ? (
                                <strong>Drop image here</strong>
                            ) : (
                                <>
                                    <strong>Click to upload</strong> or drag & drop
                                </>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            JPG, PNG, WebP up to 5 MB — compressed to WebP on upload
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
