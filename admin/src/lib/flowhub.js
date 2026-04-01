// Flowhub API Utility
const CLIENT_ID = import.meta.env.VITE_FLOWHUB_CLIENT_ID || 'b76eaed3-e036-433a-b4ab-2d32b5ca4c69';
const API_KEY = import.meta.env.VITE_FLOWHUB_API_KEY || '9696b127-4e84-4229-a6cc-1fbd2a7e9ec6';

export const FLOWHUB_LOCATIONS = {
    'mt-pleasant': '96de8175-4e2f-448a-aa93-02152d35eccd',
    'georgia-ave': 'dbeb8b59-8085-4fe2-a30d-32eb9cf723cb',
    'north-capitol': 'ed04ab80-b901-4241-b577-7ff91f376e92',
    'columbia-rd': '' // Placeholder for future location
};

const CATEGORY_MAP = {
    'exotic-flowers': ['Flower', 'Flowers'],
    'edibles': ['Edible', 'Edibles'],
    'disposables-vapes': ['Vape', 'Vaporizer', 'Disposable', 'Vapes', 'Disposables'],
    'cartridges': ['Cartridge', 'Cartridges', 'Vape Cartridge'],
    'pre-rolls': ['Pre-Roll', 'Pre-Rolls', 'Preroll', 'Prerolls', 'Joint', 'Joints'],
    'concentrates': ['Concentrate', 'Concentrates', 'Extract', 'Wax', 'Shatter', 'Rosin', 'Resin'],
    'accessories': ['Accessory', 'Accessories', 'Gear', 'Merch', 'Apparel']
};

export async function fetchFlowhubInventory(locationId, categorySlug) {
    const fhLocationId = FLOWHUB_LOCATIONS[locationId];
    if (!fhLocationId) throw new Error('Location not configured for Flowhub sync');

    const validCategories = CATEGORY_MAP[categorySlug] || [];

    // In dev, use Vite proxy. In prod, use our Firebase Cloud Function proxy (no CORS issues).
    const isDev = !import.meta.env.PROD;

    let url;
    let fetchOpts;

    if (isDev) {
        url = '/flowhub-api/v0/inventoryNonZero';
        fetchOpts = {
            method: 'GET',
            headers: { 'clientId': CLIENT_ID, 'key': API_KEY, 'Accept': 'application/json' },
        };
    } else {
        const fnBase = 'https://us-central1-apple-dream-advertising-model.cloudfunctions.net/flowhubProxy';
        url = `${fnBase}?path=${encodeURIComponent('/v0/inventoryNonZero')}&clientId=${encodeURIComponent(CLIENT_ID)}&key=${encodeURIComponent(API_KEY)}`;
        fetchOpts = { method: 'GET' };
    }

    try {
        const response = await fetch(url, fetchOpts);

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Flowhub API Error: ${response.status} ${response.statusText} - ${errBody}`);
        }

        const data = await response.json();
        
        let inventoryArray = [];
        if (Array.isArray(data.data)) {
            inventoryArray = data.data;
        } else if (Array.isArray(data)) {
            inventoryArray = data;
        } else {
            throw new Error("Unexpected response format from Flowhub");
        }
        
        // Filter by location and category
        const locationItems = inventoryArray.filter(item => {
            if (item.locationId !== fhLocationId) return false;
            if (!item.category) return false;
            
            // Check if Flowhub item category is in our list of mapped Flowhub categories for this page
            return validCategories.some(cat => 
                item.category.toLowerCase() === cat.toLowerCase()
            );
        });

        // Map items to standard schema structure for Firebase inserts
        return locationItems.map(item => {
            // Calculate THC
            let thc = 0;
            if (item.cannabinoidInformation && Array.isArray(item.cannabinoidInformation)) {
                const thcInfo = item.cannabinoidInformation.find(c => c.name?.toLowerCase().includes('thc') && !c.name?.toLowerCase().includes('thc-a'));
                const thcaInfo = item.cannabinoidInformation.find(c => c.name?.toLowerCase().includes('thc-a'));
                
                if (thcInfo) {
                    thc = thcInfo.upperRange || thcInfo.lowerRange || 0;
                } else if (thcaInfo) {
                    thc = thcaInfo.upperRange || thcaInfo.lowerRange || 0; // fallback
                }
            }

            // Figure out base price.
            let price = 0;
            if (item.preTaxPriceInPennies) price = item.preTaxPriceInPennies / 100;
            else if (item.priceInMinorUnits) price = item.priceInMinorUnits / 100;
            else if (item.postTaxPriceInPennies) price = item.postTaxPriceInPennies / 100;

            const name = item.productName || item.parentProductName || 'Unknown';
            const brand = item.brand || '';
            const sku = item.sku || '';

            return {
                name,
                brand,
                price,
                thc,
                sku,
                imageUrl: item.productPictureURL || '',
                type: 'Hybrid', // Default or guess from strain tags if available
                inStock: item.quantity > 0,
            };
        });

    } catch (err) {
        console.error('Flowhub sync error:', err);
        throw err;
    }
}
