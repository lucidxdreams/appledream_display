# 06 — Backend & Admin Panel Architecture

Design specification for the admin panel where staff manage all content.

---

## Overview

The admin panel is a **password-protected React web app** deployed on Firebase Hosting. It provides a clean, intuitive interface for:

- Adding and managing products (per category)
- Activating/deactivating categories
- Creating and managing deals
- Configuring display settings
- Pushing updates to the display

---

## Admin Panel Pages

```
/login                    ← Firebase Auth email/password login
/dashboard                ← Overview: active categories, product counts, active deals
/categories               ← Category management (activate/deactivate, reorder, configure timing)
/products/:categorySlug   ← Product list + add/edit/delete for a category
/products/new             ← Add new product form
/products/:id/edit        ← Edit existing product
/deals                    ← Deal list + add/edit/delete
/deals/new                ← Create new deal
/settings                 ← Display settings (rotation speed, transition style, etc.)
```

---

## Authentication

Uses **Firebase Authentication** with Email/Password method.

```javascript
// Admin login flow
import { signInWithEmailAndPassword } from 'firebase/auth';

const handleLogin = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // Redirect to /dashboard on success
};
```

Only authenticated users (created manually in Firebase Console) can access the admin panel. No public registration.

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // All read access requires auth
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Display (front-end) can read all data without auth
    // Only products, categories, deals are public read
    match /products/{category}/items/{doc} {
      allow read: if true;
    }
    match /categories/{doc} {
      allow read: if true;
    }
    match /deals/{doc} {
      allow read: if true;
    }
  }
}
```

---

## Product Management

### Product Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | ✅ | "Purple Punch #4" |
| Brand | Text | ❌ | Optional manufacturer name |
| Category | Select | ✅ | Pre-populated from active categories |
| Image | File Upload | ✅ | Uploaded to Firebase Storage → URL stored |
| Price | Number | ✅ | Base price (per gram for flower, per unit otherwise) |
| Price by Weight | Key-Value pairs | ❌ | For flower: 1g, 3.5g, 7g, 14g, 28g |
| THC % | Number | ✅ | 0 - 100 |
| CBD % | Number | ❌ | 0 - 100 |
| Type | Select | ✅ | Indica / Sativa / Hybrid / N/A |
| Terpenes | Multi-text | ❌ | Tag input, comma separated |
| Flavor/Effect Notes | Textarea | ❌ | Short description ≤ 120 chars |
| Badge | Select | ❌ | New / Limited / Best Seller / Staff Pick |
| Featured | Toggle | ❌ | Gets hero placement on display |
| In Stock | Toggle | ✅ | Default: true; false = removed from display |

### Image Upload

```javascript
// Upload to Firebase Storage
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const uploadProductImage = async (file, productId) => {
  // Compress to WebP before upload (use browser-image-compression lib)
  const compressed = await imageCompression(file, { maxSizeMB: 0.2, fileType: 'image/webp' });
  const storageRef = ref(storage, `products/${productId}/image.webp`);
  const uploadTask = uploadBytesResumable(storageRef, compressed);
  // Return download URL when complete
  return getDownloadURL(storageRef);
};
```

### Product List View

The product list for each category shows:
- Product image thumbnail
- Name, brand, price
- In-stock toggle (quick toggle without opening edit form)
- Featured toggle
- Edit button → opens full edit form
- Delete button (with confirmation modal)

---

## Category Management

### Category Settings

| Setting | Type | Description |
|---------|------|-------------|
| Active | Toggle | Show/hide from display rotation |
| Display Duration | Number (seconds) | How long this category shows (10–60s) |
| Order | Drag handle | Drag to reorder display sequence |
| Theme Primary Color | Color picker | Category background primary color |
| Theme Accent Color | Color picker | Category glow/accent color |

### UI

Categories are displayed as draggable cards (using `@dnd-kit/core`). Staff can:
- Toggle active/inactive with a single click
- Drag to reorder
- Click to configure timing and theme colors

---

## Deals Management

### Deal Form Fields

| Field | Type | Required |
|-------|------|----------|
| Title | Text | ✅ "🔥 BOGO Pre-Rolls!" |
| Description | Textarea | ✅ Short compelling description |
| Deal Type | Select | ✅ BOGO / Discount / Bundle / Flash Sale / Custom |
| Original Price | Number | ✅ for price deals |
| Deal Price | Number | ✅ for price deals |
| Discount % | Number | auto-calculated |
| Products Included | Multi-select (from products) | ❌ |
| Deal Image | File upload | ❌ |
| Start Date/Time | DateTime picker | ✅ |
| End Date/Time | DateTime picker | ❌ (ongoing) |
| Active | Toggle | ✅ |
| Display Priority | Number | Order on deals page |

### Automatic Expiry

Deals with an `endTime` are automatically hidden from the display when `endTime` passes.

```javascript
// In display frontend - filter active deals
const activeDeals = deals.filter(deal => {
  if (!deal.active) return false;
  if (!deal.endTime) return true; // ongoing
  return deal.endTime.toDate() > new Date();
});
```

---

## Push to Display Button

The "Push to Display" button in the admin panel:

1. Writes a `lastPushed: serverTimestamp()` field to `/settings/display`
2. The display frontend listens to this field
3. When `lastPushed` changes, the display re-fetches all data and restarts the rotation from the beginning

```javascript
// Admin: Push to Display
const pushToDisplay = async () => {
  await updateDoc(doc(db, 'settings', 'display'), {
    lastPushed: serverTimestamp(),
    pushedBy: auth.currentUser.email
  });
  toast.success('Display updated!');
};

// Display frontend: listen for push
onSnapshot(doc(db, 'settings', 'display'), (snap) => {
  if (snap.data().lastPushed !== prevPushed) {
    refetchAllData();
    restartRotation();
  }
});
```

---

## Dashboard Overview

The dashboard shows:

```
┌─────────────┬─────────────┬──────────────┬──────────────┐
│ 6 Categories│ 48 Products │ 3 Active Deals│ Last Updated │
│ (5 Active)  │ (44 In Stock)│             │ 2 mins ago   │
└─────────────┴─────────────┴──────────────┴──────────────┘

[PUSH TO DISPLAY] ← Large, prominent green button

Active Categories (in order):
┌──────────────────────────────────────┐
│ ● Exotic Flowers (12 products) 20s   │
│ ● Edibles (8 products) 15s          │
│ ● Disposables / Vapes (9 prod.) 15s │
│ ● Cartridges (11 products) 15s      │
│ ● Pre-rolls (8 products) 15s        │
│ ● Deals Page (3 deals) 25s          │
└──────────────────────────────────────┘

Recent Activity:
• Purple Punch #4 added (Exotic Flowers) — 5 min ago
• BOGO Pre-Rolls deal created — 1 hour ago
```

---

## Admin Panel Design

The admin panel uses a cannabis-adjacent professional dark theme:

- **Background**: `#0f0f0f` (near black)
- **Surface**: `#1a1a1a`
- **Accent**: `#4a7c59` (cannabis green)
- **Text**: `#e8e8e8`
- **Success**: `#2ecc71`
- **Warning**: `#f39c12`
- **Danger**: `#e74c3c`

Typography: **Inter** for all body text. Clean executive feel, not as flashy as the display.

---

## Admin Panel Dependencies

```bash
# Form management
npm install react-hook-form zod @hookform/resolvers

# Drag and drop (category reordering)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Image upload + compression
npm install react-dropzone browser-image-compression

# UI feedback
npm install react-hot-toast

# Icons
npm install lucide-react

# Date/time handling
npm install dayjs

# Color picker (theme customization)
npm install react-colorful
```

---

## Security Considerations

1. **Never expose Firebase config in public repos** — use `.env` files, add to `.gitignore`
2. **Restrict Firestore writes** to authenticated users only (see security rules above)
3. **Firebase Storage rules**: only authenticated users can upload/delete images
4. **Limit admin accounts** — only create accounts for staff who need access
5. **Audit log**: store admin actions in a `/audit` collection for accountability

```javascript
// Log admin actions
const logAction = async (action, details) => {
  await addDoc(collection(db, 'audit'), {
    action,
    details,
    user: auth.currentUser.email,
    timestamp: serverTimestamp()
  });
};
```
