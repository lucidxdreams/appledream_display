// Zod schemas for validating Firestore write shapes
import { z } from 'zod/v4'

export const productSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    brand: z.string().max(200).optional().default(''),
    price: z.coerce.number().min(0.01, 'Price must be > $0').max(10000, 'Price must be ≤ $10,000'),
    thc: z.coerce.number().min(0, 'THC% must be ≥ 0').max(100, 'THC% must be ≤ 100'),
    cbd: z.coerce.number().min(0, 'CBD% must be ≥ 0').max(100, 'CBD% must be ≤ 100').optional().default(0),
    type: z.enum(['Indica', 'Sativa', 'Hybrid', 'CBD', 'N/A']),
    notes: z.string().max(120).optional().default(''),
    badge: z.string().optional().default(''),
    featured: z.boolean().optional().default(false),
    inStock: z.boolean().optional().default(true),
})

export const dealSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(1000),
    dealType: z.enum(['BOGO', 'Discount', 'Bundle', 'Flash Sale', 'Custom']),
    originalPrice: z.coerce.number().min(0).max(50000).nullable().optional(),
    dealPrice: z.coerce.number().min(0).max(50000).nullable().optional(),
    displayPriority: z.coerce.number().int().min(1).max(100).optional().default(1),
    active: z.boolean().optional().default(true),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().optional().default(''),
}).refine(
    (data) => {
        if (data.endTime && data.startTime) {
            return new Date(data.endTime) > new Date(data.startTime)
        }
        return true
    },
    { message: 'End time must be after start time', path: ['endTime'] }
).refine(
    (data) => {
        if (data.originalPrice && data.dealPrice) {
            return data.dealPrice < data.originalPrice
        }
        return true
    },
    { message: 'Deal price must be less than original price', path: ['dealPrice'] }
)
