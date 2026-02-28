# Deployment Setup Guide

Complete step-by-step guide to deploy both apps. Follow sections in order.

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed and configured
- A [Firebase project](https://console.firebase.google.com) already created
- The GitHub repo `lucidxdreams/appledream_display` already created

---

## Step 1 — Get Your Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com) → select your project
2. Click the **gear icon** → **Project Settings**
3. Scroll to **"Your apps"** → click the **Web app** (`</>` icon)
   - If no web app exists yet, click **"Add app"** → select **Web** → give it a name → click **Register app**
4. Copy the `firebaseConfig` object — you need these values:

```
apiKey: "AIza..."
authDomain: "your-project.firebaseapp.com"
projectId: "your-project-id"
storageBucket: "your-project.firebasestorage.app"
messagingSenderId: "123456789"
appId: "1:123456789:web:abc123"
measurementId: "G-XXXXXXX"  (optional)
```

5. Also note your **Project ID** (shown at the top of Project Settings) — you'll need it for `.firebaserc`.

---

## Step 2 — Enable Firebase Services

In the [Firebase Console](https://console.firebase.google.com), make sure these are enabled:

1. **Authentication** → Sign-in method → Enable **Email/Password**
2. **Firestore Database** → Create database → Start in **Production mode**
3. **Storage** → Get started → Start in **Production mode**
4. **Hosting** → Get started (just click through the setup wizard)

---

## Step 3 — Create Your Admin User

1. In Firebase Console → **Authentication** → **Users** tab
2. Click **Add user**
3. Enter your admin email and a strong password
4. Click **Add user**

This is the login you'll use to access the admin panel.

---

## Step 4 — Create `.env.local` Files

Create **two identical** `.env.local` files using the config values from Step 1.

### `display/.env.local`

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

### `admin/.env.local`

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

> ⚠️ These files are gitignored and will NOT be committed. That's intentional — never commit secrets.

---

## Step 5 — Set Firebase Project ID

Open `.firebaserc` in the project root and replace `YOUR_FIREBASE_PROJECT_ID` with your actual Project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

---

## Step 6 — Deploy Firestore Rules & Storage Rules

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy security rules (run from project root: d:\advertising_model)
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## Step 7 — Seed Initial Data (Optional)

Populate Firestore with sample products, categories, deals, and settings.

### 7a. Download your Firebase service account key

1. Go to [Firebase Console](https://console.firebase.google.com) → **Project Settings** → **Service Accounts**
2. Click **"Generate New Private Key"** → download the JSON file
3. Save it as `scripts/serviceAccountKey.json`

> ⚠️ This file contains admin credentials — **never commit it**. It is gitignored.

### 7b. Run the seed script

```bash
cd scripts
npm install
node seed.js
```

This creates:
- `/categories` — 6 category documents
- `/products/{categorySlug}/items` — 18 sample products (3 per category)
- `/deals` — 2 sample deals
- `/settings/display` — default display configuration

> If you prefer to skip seeding, you can add everything manually through the admin panel after deploying it.

---

## Step 8 — Deploy Admin Panel (Firebase Hosting)

```bash
# Build the admin app
cd admin
npm install
npm run build

# Deploy to Firebase Hosting (run from project root)
cd ..
firebase deploy --only hosting
```

Your admin panel will be live at:
```
https://YOUR_PROJECT_ID.web.app
```

Test it:
1. Open the URL in a browser
2. Login with the email/password you created in Step 3
3. You should see the admin dashboard

---

## Step 9 — Deploy Display (GitHub Pages)

### Option A: Manual Deploy (First Time)

```bash
cd display
npm install
npm run deploy
```

Then in GitHub:
1. Go to your repo → **Settings** → **Pages**
2. Under **"Build and deployment"** → Source: **Deploy from a branch**
3. Branch: select **`gh-pages`** → folder: **`/ (root)`**
4. Click **Save**

Your display will be live at:
```
https://lucidxdreams.github.io/appledream_display/
```

### Option B: Auto-Deploy via GitHub Actions (After Initial Setup)

For the GitHub Actions workflow to build with Firebase credentials, add **GitHub Secrets**:

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"** and add each one:

| Secret Name | Value |
|------------|-------|
| `VITE_FIREBASE_API_KEY` | Your API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.firebasestorage.app |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `VITE_FIREBASE_APP_ID` | Your app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your measurement ID |

After adding secrets, every push to `main` that touches `display/**` will auto-deploy.

---

## Step 10 — Push Everything to GitHub

```bash
# From the project root (d:\advertising_model)
git remote add origin https://github.com/lucidxdreams/appledream_display.git
git add -A
git commit -m "Initial commit — display + admin + deployment config"
git branch -M main
git push -u origin main
```

> If the remote is already added, skip the `git remote add` line.

---

## Step 11 — End-to-End Verification

Run through this checklist to confirm everything is working:

### Display Verification
- [ ] Open `https://lucidxdreams.github.io/appledream_display/` in a browser
- [ ] Enter fullscreen (F11) → verify the display fills the entire screen
- [ ] Verify category rotation works (pages should auto-advance)
- [ ] Test all 6 category pages appear in rotation

### Admin Verification
- [ ] Open `https://YOUR_PROJECT_ID.web.app` in a browser
- [ ] Login with your admin credentials
- [ ] Add a product → verify it appears on the display within 5 seconds
- [ ] Press **"Push to Display"** → verify the display restarts rotation
- [ ] Test the deals page:
  - Create 1 deal → verify full-bleed hero layout
  - Create 3 deals → verify hero + side panel layout
  - Create 5 deals → verify symmetrical grid layout

### Real-Time Sync Verification
- [ ] Open display and admin side by side
- [ ] Edit a product name in admin → confirm it updates on display in real-time
- [ ] Deactivate a category → confirm it's removed from rotation
- [ ] Reactivate it → confirm it returns

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Display shows blank page | Check browser console for Firebase errors — `.env.local` values may be wrong |
| Admin login fails | Verify you created a user in Firebase Auth (Step 3) |
| `firebase deploy` fails | Run `firebase login` again; check `.firebaserc` has correct project ID |
| GitHub Pages shows 404 | Check Settings → Pages → branch is set to `gh-pages`, and `vite.config.js` base matches repo name |
| Products don't sync in real-time | Check Firestore rules are deployed (Step 6) and both apps use the same project |
| GitHub Actions fails | Verify all 7 secrets are added in repo Settings → Secrets |

---

## Summary of Live URLs

| App | URL |
|-----|-----|
| **Display** | `https://lucidxdreams.github.io/appledream_display/` |
| **Admin** | `https://YOUR_PROJECT_ID.web.app` |
| **Firestore Console** | `https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore` |
