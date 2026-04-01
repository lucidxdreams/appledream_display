const { onRequest } = require('firebase-functions/v2/https');
const fetch = require('node-fetch');

const FLOWHUB_API_BASE = 'https://api.flowhub.com';

/**
 * Cloud Function (2nd Gen): flowhubProxy
 * 
 * Server-side proxy for the Flowhub API.
 * Avoids CORS issues by making the request from the server.
 * 
 * Query params:
 *   - path: API path (e.g. /v0/inventoryNonZero)
 *   - clientId: Flowhub client ID
 *   - key: Flowhub API key
 */
exports.flowhubProxy = onRequest({ cors: false, region: 'us-central1' }, async (req, res) => {
    // Allow requests from the admin app origin
    const allowedOrigins = [
        'https://apple-dream-advertising-model.web.app',
        'https://apple-dream-advertising-model.firebaseapp.com',
        'http://localhost:5173',
        'http://localhost:5174',
    ];
    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { clientId, key, path } = req.query;

    if (!clientId || !key || !path) {
        res.status(400).json({ error: 'Missing required query params: clientId, key, path' });
        return;
    }

    // Validate path to prevent SSRF
    if (!path.startsWith('/v0/')) {
        res.status(400).json({ error: 'Invalid API path' });
        return;
    }

    try {
        const apiUrl = `${FLOWHUB_API_BASE}${path}`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'clientId': clientId,
                'key': key,
                'Accept': 'application/json',
            },
        });

        const body = await response.text();

        res.status(response.status).set('Content-Type', 'application/json').send(body);
    } catch (err) {
        console.error('Flowhub proxy error:', err);
        res.status(502).json({ error: 'Failed to reach Flowhub API', details: err.message });
    }
});
