// Zod schemas for validating Firestore write shapes
import { z } from 'zod/v4'

export const productSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    brand: z.string().max(200).optional().default(''),
    price: z.coerce.number().min(0, 'Price must be ≥ $0').max(10000, 'Price must be ≤ $10,000'),
    thc: z.coerce.number().min(0, 'THC% must be ≥ 0').max(100, 'THC% must be ≤ 100'),
    cbd: z.coerce.number().min(0, 'CBD% must be ≥ 0').max(100, 'CBD% must be ≤ 100').optional().default(0),
    type: z.enum(['Indica', 'Sativa', 'Hybrid', 'CBD', 'Indica Dom.', 'Sativa Dom.', 'N/A']),
    sellType: z.enum(['Pre-packed', 'Weighted']).optional().default('Pre-packed'),
    notes: z.string().max(120).optional().default(''),
    badge: z.string().optional().default(''),
    featured: z.boolean().optional().default(false),
    inStock: z.boolean().optional().default(true),
})

export const ediblesSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    brand: z.string().max(200).optional().default(''),
    price: z.coerce.number().min(0, 'Price must be ≥ $0').max(10000, 'Price must be ≤ $10,000'),
    thcMg: z.coerce.number().min(0, 'THC mg must be ≥ 0').max(10000, 'THC mg must be ≤ 10,000'),
    pieceCount: z.coerce.number().int().min(1, 'Piece count must be ≥ 1').max(1000).optional().default(10),
    type: z.enum(['Indica', 'Sativa', 'Hybrid', 'CBD', 'Indica Dom.', 'Sativa Dom.', 'N/A']),
    notes: z.string().max(200).optional().default(''),
    badge: z.string().optional().default(''),
    featured: z.boolean().optional().default(false),
    inStock: z.boolean().optional().default(true),
})

export const vapesSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    brand: z.string().max(200).optional().default(''),
    price: z.coerce.number().min(0, 'Price must be ≥ $0').max(10000, 'Price must be ≤ $10,000'),
    thc: z.coerce.number().min(0, 'THC% must be ≥ 0').max(100, 'THC% must be ≤ 100'),
    cbd: z.coerce.number().min(0, 'CBD% must be ≥ 0').max(100, 'CBD% must be ≤ 100').optional().default(0),
    type: z.enum(['Indica', 'Sativa', 'Hybrid', 'CBD', 'Indica Dom.', 'Sativa Dom.', 'N/A']),
    cartSize: z.enum(['0.5g', '1g', '2g']).optional().default('1g'),
    vapeType: z.enum(['Classic THC', 'CBD Ratio', 'CBN Blend', 'Live Resin', 'Distillate']).optional().default('Classic THC'),
    flavors: z.array(z.string()).optional().default([]),
    notes: z.string().max(200).optional().default(''),
    badge: z.string().optional().default(''),
    featured: z.boolean().optional().default(false),
    inStock: z.boolean().optional().default(true),
})

export const cartridgesSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    brand: z.string().max(200).optional().default(''),
    price: z.coerce.number().min(0, 'Price must be ≥ $0').max(10000, 'Price must be ≤ $10,000'),
    thc: z.coerce.number().min(0, 'THC% must be ≥ 0').max(100, 'THC% must be ≤ 100'),
    cbd: z.coerce.number().min(0, 'CBD% must be ≥ 0').max(100, 'CBD% must be ≤ 100').optional().default(0),
    cbg: z.coerce.number().min(0).max(100).optional().default(0),
    cbn: z.coerce.number().min(0).max(100).optional().default(0),
    type: z.enum(['Indica', 'Sativa', 'Hybrid', 'CBD', 'Indica Dom.', 'Sativa Dom.', 'N/A']),
    extractType: z.enum(['Cured Resin', 'Live Resin', 'Distillate', 'Rosin', 'HTFSE', 'Badder', 'Sugar']).optional().default('Distillate'),
    cartSize: z.enum(['0.5g', '1g']).optional().default('1g'),
    effects: z.array(z.string()).optional().default([]),
    notes: z.string().max(200).optional().default(''),
    badge: z.string().optional().default(''),
    featured: z.boolean().optional().default(false),
    inStock: z.boolean().optional().default(true),
})

export const prerollsSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    brand: z.string().max(200).optional().default(''),
    price: z.coerce.number().min(0, 'Price must be ≥ $0').max(10000, 'Price must be ≤ $10,000'),
    thc: z.coerce.number().min(0, 'THC% must be ≥ 0').max(100, 'THC% must be ≤ 100'),
    cbd: z.coerce.number().min(0, 'CBD% must be ≥ 0').max(100, 'CBD% must be ≤ 100').optional().default(0),
    weight: z.enum(['0.5g', '0.7g', '1g', '1.5g', '2g', '2.5g', '3g', 'Custom']).optional().default('1g'),
    type: z.enum(['Indica', 'Sativa', 'Hybrid', 'CBD', 'Indica Dom.', 'Sativa Dom.', 'N/A']),
    notes: z.string().max(200).optional().default(''),
    badge: z.string().optional().default(''),
    featured: z.boolean().optional().default(false),
    inStock: z.boolean().optional().default(true),
})

export const dealSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(1000),
    dealType: z.enum(['BOGO', 'Discount', 'Bundle', 'Flash Sale', 'Custom']),
    displayMode: z.enum(['Standard', 'Full Image Banner', 'Text Only']).optional().default('Standard'),
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
