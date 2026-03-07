/**
 * migrate-to-locations.js
 *
 * Copies all existing North Capitol data from the root-level Firestore collections
 * into the new location-scoped path: locations/north-capitol/...
 *
 * Usage:
 *   cd d:\advertising_model\scripts
 *   node migrate-to-locations.js
 *
 * This script is IDEMPOTENT — safe to run multiple times.
 * It will overwrite documents at the destination with source data (merge: false).
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

const LOCATION_ID = 'north-capitol';

let totalCopied = 0;

async function copyCollection(srcPath, destPath) {
    const snap = await db.collection(srcPath).get();
    if (snap.empty) {
        console.log(`  [skip] ${srcPath} — empty`);
        return;
    }

    const batch = db.batch();
    let count = 0;

    for (const docSnap of snap.docs) {
        const destRef = db.doc(`${destPath}/${docSnap.id}`);
        batch.set(destRef, docSnap.data());
        count++;
    }

    await batch.commit();
    totalCopied += count;
    console.log(`  [ok]   ${srcPath} → ${destPath}  (${count} docs)`);
}

async function main() {
    console.log(`\n🚀  Migrating data → locations/${LOCATION_ID}/\n`);

    // 1. Categories
    await copyCollection('categories', `locations/${LOCATION_ID}/categories`);

    // 2. Products — one sub-collection per category
    const catSnap = await db.collection('categories').get();
    for (const catDoc of catSnap.docs) {
        const slug = catDoc.data().slug || catDoc.id;
        await copyCollection(
            `products/${slug}/items`,
            `locations/${LOCATION_ID}/products/${slug}/items`
        );
    }

    // 3. Deals
    await copyCollection('deals', `locations/${LOCATION_ID}/deals`);

    // 4. Settings/display (single doc, not a collection — handle separately)
    const settingsSnap = await db.doc('settings/display').get();
    if (settingsSnap.exists) {
        await db.doc(`locations/${LOCATION_ID}/settings/display`).set(settingsSnap.data(), { merge: true });
        totalCopied++;
        console.log(`  [ok]   settings/display → locations/${LOCATION_ID}/settings/display  (1 doc)`);
    } else {
        console.log(`  [skip] settings/display — not found`);
    }

    console.log(`\n✅  Migration complete! ${totalCopied} documents copied.\n`);
}

main().catch((err) => {
    console.error('\n❌  Migration failed:', err.message);
    process.exit(1);
});
