// Audit logging utility — writes to /audit Firestore collection
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'

/**
 * Log an admin action for audit trail.
 * @param {Object} params
 * @param {string} params.action - e.g. 'product.created', 'deal.deleted', 'display.pushed'
 * @param {string} params.entity - e.g. 'product', 'deal', 'category', 'display'
 * @param {string} [params.entityId] - Firestore doc ID of the affected entity
 * @param {Object} [params.details] - Optional extra context
 */
export async function logAuditEvent({ action, entity, entityId = null, details = null }) {
    try {
        await addDoc(collection(db, 'audit'), {
            action,
            entity,
            entityId,
            user: auth.currentUser?.email || 'unknown',
            timestamp: serverTimestamp(),
            ...(details ? { details } : {}),
        })
    } catch (err) {
        // Audit logging should never block the main flow
        console.warn('[Audit] Failed to log event:', err.message)
    }
}
