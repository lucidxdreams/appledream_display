/**
 * scripts/seed.js
 * 
 * Seeds Firestore with sample data for the Cannabis Advertising Display System.
 * 
 * Usage:
 *   1. Install firebase-admin: npm install firebase-admin
 *   2. Download your Firebase service account key from:
 *      Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 *   3. Save it as scripts/serviceAccountKey.json (never commit this file!)
 *   4. Run: node scripts/seed.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account key
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

const categories = [
    {
        id: 'exotic-flowers',
        name: 'Exotic Flowers',
        slug: 'exotic-flowers',
        active: true,
        order: 1,
        duration: 20,
        theme: {
            primary: '#1a472a',
            accent: '#7CB518',
            background: '#0a1a0e',
        },
    },
    {
        id: 'edibles',
        name: 'Edibles',
        slug: 'edibles',
        active: true,
        order: 2,
        duration: 15,
        theme: {
            primary: '#4a0e30',
            accent: '#e85d04',
            background: '#1a0520',
        },
    },
    {
        id: 'disposables-vapes',
        name: 'Disposables / Vapes',
        slug: 'disposables-vapes',
        active: true,
        order: 3,
        duration: 15,
        theme: {
            primary: '#0d0221',
            accent: '#7b2fff',
            background: '#050010',
        },
    },
    {
        id: 'cartridges',
        name: 'Cartridges',
        slug: 'cartridges',
        active: true,
        order: 4,
        duration: 15,
        theme: {
            primary: '#1a1a2e',
            accent: '#c9a84c',
            background: '#0d0d1a',
        },
    },
    {
        id: 'pre-rolls',
        name: 'Pre-rolls',
        slug: 'pre-rolls',
        active: true,
        order: 5,
        duration: 15,
        theme: {
            primary: '#2c1a0e',
            accent: '#d4a017',
            background: '#1a0e05',
        },
    },
    {
        id: 'deals',
        name: 'Deals',
        slug: 'deals',
        active: true,
        order: 6,
        duration: 25,
        theme: {
            primary: '#3d0000',
            accent: '#ff4500',
            background: '#1a0000',
        },
    },
];

// ─────────────────────────────────────────────
// PRODUCTS — 3 per category
// ─────────────────────────────────────────────

const products = {
    'exotic-flowers': [
        {
            name: 'Purple Punch #4',
            brand: 'Jungle Boys',
            image: '',
            price: 18,
            priceByWeight: { '1g': 18, '3.5g': 60, '7g': 110, '14g': 200, '28g': 380 },
            thc: 29.4,
            cbd: 0.1,
            type: 'Indica',
            terpenes: ['Myrcene', 'Caryophyllene', 'Limonene'],
            description: 'Grape candy aroma with a sedating, full-body relaxation. Perfect for evening use.',
            badge: 'Staff Pick',
            inStock: true,
            featured: true,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Sour Diesel OG',
            brand: 'Glass House Farms',
            image: '',
            price: 14,
            priceByWeight: { '1g': 14, '3.5g': 45, '7g': 85, '14g': 160, '28g': 300 },
            thc: 26.8,
            cbd: 0.2,
            type: 'Sativa',
            terpenes: ['Terpinolene', 'Ocimene', 'Myrcene'],
            description: 'Classic diesel fuel with a sharp citrus edge. Energizing and creative daytime flow.',
            badge: 'Best Seller',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Wedding Cake Gelato',
            brand: 'Connected Cannabis',
            image: '',
            price: 20,
            priceByWeight: { '1g': 20, '3.5g': 65, '7g': 120, '14g': 220, '28g': 420 },
            thc: 31.2,
            cbd: 0.05,
            type: 'Hybrid',
            terpenes: ['Limonene', 'Caryophyllene', 'Linalool'],
            description: 'Sweet vanilla frosting meets earthy pepper. A euphoric, stress-melting hybrid.',
            badge: 'New',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
    ],

    'edibles': [
        {
            name: 'Watermelon Gummies 100mg',
            brand: 'Kiva Confections',
            image: '',
            price: 22,
            priceByWeight: {},
            thc: 100,
            cbd: 0,
            type: 'N/A',
            terpenes: [],
            description: '10 pieces × 10mg THC each. Juicy watermelon flavor. Onset: 30–90 min. Relaxing effect.',
            badge: 'Best Seller',
            inStock: true,
            featured: true,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Dark Chocolate Bar 1:1',
            brand: 'Défoncé',
            image: '',
            price: 28,
            priceByWeight: {},
            thc: 100,
            cbd: 100,
            type: 'N/A',
            terpenes: [],
            description: '72% dark chocolate with perfectly balanced 100mg THC / 100mg CBD. Artisan craft, smooth body high.',
            badge: 'Staff Pick',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Mango Microdose Bites 5mg',
            brand: 'Plus Products',
            image: '',
            price: 18,
            priceByWeight: {},
            thc: 50,
            cbd: 0,
            type: 'N/A',
            terpenes: [],
            description: '10 pieces × 5mg THC. Perfect starter dose. Tropical mango flavor. Beginner friendly.',
            badge: 'New',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
    ],

    'disposables-vapes': [
        {
            name: 'Gelato 41 Live Resin 1g',
            brand: 'Raw Garden',
            image: '',
            price: 45,
            priceByWeight: {},
            thc: 82.5,
            cbd: 0.3,
            type: 'Hybrid',
            terpenes: ['Limonene', 'Caryophyllene'],
            description: 'Full-spectrum live resin. Rechargeable 1g disposable. Smooth draw with authentic strain flavor.',
            badge: 'Staff Pick',
            inStock: true,
            featured: true,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Blue Dream Distillate 0.5g',
            brand: 'Stiiizy',
            image: '',
            price: 30,
            priceByWeight: {},
            thc: 88.0,
            cbd: 0.1,
            type: 'Sativa',
            terpenes: ['Myrcene', 'Terpinolene'],
            description: 'Berry-sweet Sativa for all-day energy. 300+ puffs. USB-C rechargeable.',
            badge: 'Best Seller',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Watermelon OG HTFSE 1g',
            brand: 'Heavy Hitters',
            image: '',
            price: 55,
            priceByWeight: {},
            thc: 90.2,
            cbd: 0.2,
            type: 'Indica',
            terpenes: ['Myrcene', 'Linalool', 'Caryophyllene'],
            description: 'High-Terpene Full-Spectrum Extract. Maximum flavor preservation. Elite potency.',
            badge: 'Limited',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
    ],

    'cartridges': [
        {
            name: 'Forbidden Fruit Live Resin 1g',
            brand: 'Bloom Farms',
            image: '',
            price: 48,
            priceByWeight: {},
            thc: 79.4,
            cbd: 0.5,
            type: 'Indica',
            terpenes: ['Myrcene', 'Limonene', 'Ocimene'],
            description: 'Live resin extract. Tropical cherry + citrus nose. 510-thread. Pairs with any standard battery.',
            badge: 'Best Seller',
            inStock: true,
            featured: true,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Jack Herer Rosin 0.5g',
            brand: 'Viola',
            image: '',
            price: 55,
            priceByWeight: {},
            thc: 74.8,
            cbd: 0.8,
            type: 'Sativa',
            terpenes: ['Terpinolene', 'Ocimene', 'Myrcene'],
            description: 'Solventless rosin — the cleanest extract. Spicy pine and sweet citrus. 510-thread universal.',
            badge: 'Staff Pick',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Wedding Crasher Distillate 1g',
            brand: 'Vapen',
            image: '',
            price: 28,
            priceByWeight: {},
            thc: 91.0,
            cbd: 0.1,
            type: 'Hybrid',
            terpenes: ['Limonene', 'Caryophyllene'],
            description: 'Ultra-refined distillate. Maximum potency value pick. Great beginner cart. 510-thread.',
            badge: 'New',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
    ],

    'pre-rolls': [
        {
            name: 'Gorilla Glue #4 Infused 1g',
            brand: 'Jeeter',
            image: '',
            price: 15,
            priceByWeight: {},
            thc: 35.8,
            cbd: 0.1,
            type: 'Hybrid',
            terpenes: ['Caryophyllene', 'Myrcene', 'Limonene'],
            description: 'Infused with liquid diamonds + kief dusted. Slow burn, massive clouds. A true top-shelf joint.',
            badge: 'Best Seller',
            inStock: true,
            featured: true,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Runtz 5-Pack Mini 0.5g Each',
            brand: 'Lowell Herb Co.',
            image: '',
            price: 35,
            priceByWeight: {},
            thc: 24.5,
            cbd: 0.2,
            type: 'Hybrid',
            terpenes: ['Limonene', 'Caryophyllene'],
            description: 'House-rolled garden blend. Candy sweet with a fruity finish. 5 × 0.5g pack. Share pack.',
            badge: 'Staff Pick',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
        {
            name: 'Blue Dream Classic 1g',
            brand: 'Marley Natural',
            image: '',
            price: 10,
            priceByWeight: {},
            thc: 22.1,
            cbd: 0.4,
            type: 'Sativa',
            terpenes: ['Myrcene', 'Terpinolene', 'Ocimene'],
            description: 'Single-origin, sustainably grown. Blueberry muffin aroma. Clean all-day Sativa roll.',
            badge: '',
            inStock: true,
            featured: false,
            createdAt: Timestamp.now(),
        },
    ],
};

// ─────────────────────────────────────────────
// DEALS — 2 sample deals
// ─────────────────────────────────────────────

const deals = [
    {
        title: '🔥 BOGO Pre-Rolls — Today Only!',
        description:
            'Buy any single pre-roll and get a second one of equal or lesser value FREE. Mix and match from our entire pre-roll selection.',
        type: 'BOGO',
        originalPrice: 30,
        dealPrice: 15,
        products: [],
        startTime: Timestamp.fromDate(new Date()),
        endTime: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24h from now
        active: true,
        image: '',
    },
    {
        title: '💚 Mix & Match Ounce — $180',
        description:
            'Build your perfect ounce from ANY exotic flower in store. Choose up to 4 different strains. Save up to $120 off individual pricing.',
        type: 'Bundle',
        originalPrice: 300,
        dealPrice: 180,
        products: [],
        startTime: Timestamp.fromDate(new Date()),
        endTime: null, // ongoing
        active: true,
        image: '',
    },
];

// ─────────────────────────────────────────────
// SETTINGS — default display config
// ─────────────────────────────────────────────

const defaultSettings = {
    transitionStyle: 'fade',
    showClock: true,
    autoRotate: true,
    rotationOrder: [
        'exotic-flowers',
        'edibles',
        'disposables-vapes',
        'cartridges',
        'pre-rolls',
        'deals',
    ],
    lastPushed: null,
    pushedBy: null,
};

// ─────────────────────────────────────────────
// SEED FUNCTIONS
// ─────────────────────────────────────────────

async function seedCategories() {
    console.log('\n📂 Seeding categories...');
    for (const category of categories) {
        const { id, ...data } = category;
        await db.collection('categories').doc(id).set(data);
        console.log(`  ✅ ${category.name}`);
    }
}

async function seedProducts() {
    console.log('\n📦 Seeding products...');
    for (const [categorySlug, items] of Object.entries(products)) {
        for (const product of items) {
            const ref = await db
                .collection('products')
                .doc(categorySlug)
                .collection('items')
                .add(product);
            console.log(`  ✅ [${categorySlug}] ${product.name} (${ref.id})`);
        }
    }
}

async function seedDeals() {
    console.log('\n🔥 Seeding deals...');
    for (const deal of deals) {
        const ref = await db.collection('deals').add(deal);
        console.log(`  ✅ ${deal.title} (${ref.id})`);
    }
}

async function seedSettings() {
    console.log('\n⚙️  Seeding settings...');
    await db.collection('settings').doc('display').set(defaultSettings);
    console.log('  ✅ display settings saved');
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
    console.log('🌿 Cannabis Display System — Firestore Seed Script');
    console.log('==================================================');

    try {
        await seedCategories();
        await seedProducts();
        await seedDeals();
        await seedSettings();

        console.log('\n✨ Seeding complete! All data written to Firestore.');
        console.log('\nCollections created:');
        console.log('  • /categories (6 documents)');
        console.log('  • /products/{categorySlug}/items (18 products total)');
        console.log('  • /deals (2 documents)');
        console.log('  • /settings/display (1 document)');
    } catch (err) {
        console.error('\n❌ Seed failed:', err);
        process.exit(1);
    }

    process.exit(0);
}

main();
