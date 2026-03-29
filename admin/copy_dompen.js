import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import fs from 'fs';

const env = fs.readFileSync('./.env.local', 'utf-8');
const apikeyMatch = env.match(/VITE_FIREBASE_API_KEY=(.*)/);

const firebaseConfig = {
    apiKey: apikeyMatch ? apikeyMatch[1].trim() : "dummy",
    authDomain: "appledream-display.firebaseapp.com",
    projectId: "appledream-display",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const c = await getDocs(collection(db, 'locations', 'mt-pleasant', 'categories'));
  const cats = c.docs.map(d => ({id: d.id, ...d.data()}));
  
  const cartCat = cats.find(cat => cat.slug && cat.slug.toLowerCase().includes('cart'));
  const vapeCat = cats.find(cat => cat.slug && (cat.slug.toLowerCase().includes('vape') || cat.slug.toLowerCase().includes('disp')));
  
  if (!cartCat || !vapeCat) {
     console.error("Categories not found", { cartCat: cartCat?.id, vapeCat: vapeCat?.id });
     process.exit(1);
  }
  console.log(`Copying from ${cartCat.id} (${cartCat.slug}) to ${vapeCat.id} (${vapeCat.slug})`);
  
  const prods = await getDocs(collection(db, 'locations', 'mt-pleasant', 'categories', cartCat.id, 'products'));
  let copied = 0;
  for (const p of prods.docs) {
     const data = p.data();
     const nameStr = (data.name || '').toLowerCase();
     const brandStr = (data.brand || '').toLowerCase();
     if (nameStr.includes('dompen') || brandStr.includes('dompen')) {
        console.log(`Found Dompen: ${data.name}`);
        const newRef = doc(db, 'locations', 'mt-pleasant', 'categories', vapeCat.id, 'products', p.id);
        await setDoc(newRef, data);
        copied++;
     }
  }
  console.log(`Done. Copied ${copied} products.`);
  process.exit(0);
}
run();
