# 05 — Hosting & Deployment

Complete guide for hosting the display and accessing it from any device including Amazon Fire Stick.

---

## Overview

| Component | Host | URL Pattern | Cost |
|-----------|------|-------------|------|
| Display Frontend | GitHub Pages | `https://username.github.io/repo-name/` | **Free** |
| Admin Panel | Firebase Hosting | `https://project-id.web.app` | Free tier (10GB/mo) |
| Database | Firebase Firestore | N/A (SDK) | Free tier (1GB storage, 50K reads/day) |
| Image Storage | Firebase Storage | N/A (SDK) | Free tier (5GB) |

> **Free tier is sufficient** for a single-dispensary setup with up to ~1,000 product image views per day.

---

## Part 1: GitHub Pages Setup (Display Frontend)

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `advertising-display` (or any name)
3. Set visibility to **Public** (required for free GitHub Pages)
4. Check "Add a README file"
5. Click **Create repository**

### Step 2: Configure Vite for GitHub Pages

In `display/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/advertising-display/',  // ← must match your repo name exactly
})
```

### Step 3: Add Deploy Script

In `display/package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

Install gh-pages:
```bash
npm install --save-dev gh-pages
```

### Step 4: Deploy

```bash
cd display
npm run deploy
```

This automatically:
1. Builds the React app into `/dist`
2. Creates a `gh-pages` branch in your GitHub repo
3. Pushes the build files to that branch

### Step 5: Enable GitHub Pages

1. Go to your GitHub repo → **Settings** → **Pages**
2. Under "Branch" select `gh-pages` and folder `/root`
3. Click **Save**

Your display will be live at:
```
https://YOUR_USERNAME.github.io/advertising-display/
```

### Step 6: Update on Changes

Every time you push to main:
```bash
cd display && npm run deploy
```

Or set up **GitHub Actions** for auto-deploy on every push to `main`:

```yaml
# .github/workflows/deploy.yml
name: Deploy Display to GitHub Pages
on:
  push:
    branches: [main]
    paths: ['display/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd display && npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: display/dist
```

---

## Part 2: Firebase Hosting Setup (Admin Panel)

### Step 1: Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it `cannabis-advertising` (or similar)
4. Disable Google Analytics (not needed)

### Step 2: Initialize Firebase Services

In the Firebase console:
- Enable **Firestore Database** (start in production mode)
- Enable **Authentication** → Email/Password sign-in method
- Enable **Storage** (for product images)
- Enable **Hosting**

### Step 3: Install Firebase CLI and Deploy Admin

```bash
npm install -g firebase-tools
firebase login
cd admin
firebase init hosting
# Select: Use an existing project → your Firebase project
# Public directory: dist
# Single-page app: Yes
# Override index.html: No

npm run build
firebase deploy --only hosting
```

Admin panel will be at:
```
https://cannabis-advertising-xxxxx.web.app
```

---

## Part 3: Amazon Fire Stick Setup

### Option A: Fully Kiosk Browser (Recommended)

**Fully Kiosk Browser** is the best solution for running web apps in kiosk mode on Fire Stick.

#### Enable Developer Options on Fire Stick:
1. Go to **Settings → My Fire TV → About**
2. Click on **"Fire TV Stick"** 7 times rapidly
3. Go back → **Developer Options** should now appear
4. Enable **ADB debugging** and **Apps from Unknown Sources**

#### Install Downloader App:
1. Open **Amazon Appstore** → search "Downloader"
2. Install the **Downloader** app (free, by AFTVnews)

#### Download Fully Kiosk Browser:
1. Open Downloader
2. Enter URL: `https://www.fully-kiosk.com/download`
3. Install the APK

#### Configure Fully Kiosk Browser:
1. Open Fully Kiosk Browser
2. Enter your GitHub Pages URL as the **Start URL**:
   ```
   https://YOUR_USERNAME.github.io/advertising-display/
   ```
3. Settings to enable:
   - **Autostart after boot**: On
   - **Start URL**: Your display URL
   - **Fullscreen Mode**: On
   - **Screen Saver**: Off (or minimal)
   - **Stay Awake**: On
   - **Prevent Sleep**: On

#### Auto-Launch on TV Startup:
- Plug in Fire Stick → TV turns on → Fully Kiosk auto-launches → display is live

#### Cost:
- Fully Kiosk Browser requires a **$6.90/device** one-time license for full kiosk features (worth it)

---

### Option B: Amazon Silk Browser (Free, Basic)

Built into Fire Stick — works for manual display but no auto-launch:

1. Install **Silk Browser** from Amazon Appstore (if not already installed)
2. Open Silk Browser
3. Navigate to your GitHub Pages URL
4. Press the **Menu** button on remote → **Full Screen**

Limitation: Browser restarts to home screen if Fire Stick sleeps. Requires manual intervention.

---

### Option C: Digital Signage Platforms (Most Professional)

If you want remote management of multiple displays:

| Platform | Fire Stick Support | Free Tier | Website URL Input |
|----------|--------------------|-----------|-------------------|
| **ScreenCloud** | ✅ Native app | 14-day trial, $20/screen/mo | ✅ Yes |
| **Yodeck** | ✅ Fire Stick compatible | 1 screen free | ✅ Yes |
| **AbleSign** | ✅ Fire TV app | Free tier available | ✅ Yes |
| **Fugo.ai** | ✅ Native app | Free tier | ✅ Yes |

These platforms let you point a "Web Page" content type to your GitHub Pages URL — no extra coding needed.

---

### Option D: Raspberry Pi (Most Reliable & Cost-Effective)

For permanently mounted displays, a **Raspberry Pi 4** running Chromium in kiosk mode is the most reliable option:

```bash
# Install Raspberry Pi OS Lite
# Enable auto-login
# Add to /etc/xdg/autostart/kiosk.desktop:

[Desktop Entry]
Type=Application
Name=Cannabis Display Kiosk
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --no-first-run --start-maximized \
  https://YOUR_USERNAME.github.io/advertising-display/
```

Cost: ~$60 for Pi 4 kit. Zero ongoing cost.

---

## Part 4: Other Display Options

### Large Format Screens
- Any **4K TV** with HDMI input works
- HDMI from PC/laptop → TV → open GitHub Pages URL → F11 fullscreen

### Chrome Browser Kiosk Mode (PC)
```bash
# Windows
chrome.exe --kiosk "https://YOUR_USERNAME.github.io/advertising-display/"

# macOS
open -a "Google Chrome" --args --kiosk "https://..."
```

### Digital Signage Stick (Amazon Business)
Amazon now sells a **"Fire TV Stick for Digital Signage"** — designed specifically for business display use. Supports direct URL input in kiosk mode without sideloading.

---

## Accessing the Display URL

Once deployed, share this single URL with staff for testing:
```
https://YOUR_USERNAME.github.io/advertising-display/
```

For admin panel (password protected):
```
https://cannabis-advertising-xxxxx.web.app
```

No special software needed on the viewer side — it's a standard web URL.
