import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', confirmClass = 'btn btn-danger' }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            background: 'rgba(231, 76, 60, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'var(--danger)',
                        }}
                    >
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 className="modal-title" style={{ marginBottom: 6 }}>{title}</h3>
                        <p className="modal-desc">{message}</p>
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className={confirmClass} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
