import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

// Read .env.local to get correct config
const env = fs.readFileSync('./admin/.env.local', 'utf-8');
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
  console.log("Categories in db:", c.docs.map(d => ({id: d.id, slug: d.data().slug})));
  process.exit(0);
}
run();
