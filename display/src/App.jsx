/**
 * App.jsx — Main Display Shell
 * 
 * Layout:
 *   8vh  — Header:  Logo | Category Name | Clock
 *   84vh — Content: Category layout component
 *   8vh  — Footer:  Progress bar + dots | Next category preview
 * 
 * Background transitions to the current category's theme colors.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import ConnectionOverlay from './components/ConnectionOverlay';
import { db } from './firebase';
import { useRotation } from './hooks/useRotation';
import ParticleCanvas from './components/ParticleCanvas';
import CategoryTransition from './components/CategoryTransition';
import FlowersLayout from './layouts/FlowersLayout';
import EdiblesLayout from './layouts/EdiblesLayout';
import VapesLayout from './layouts/VapesLayout';
import CartridgesLayout from './layouts/CartridgesLayout';
import PreRollsLayout from './layouts/PreRollsLayout';
import DealsLayout from './layouts/DealsLayout';
// Phase 3 — Premium themed layouts
import BudUniverse from './layouts/BudUniverse';
import NeuralConstellation from './layouts/NeuralConstellation';
import NeonTechGrid from './layouts/NeonTechGrid';
import TheCollection from './layouts/TheCollection';
import SmokeShelf from './layouts/SmokeShelf';
import './App.css';

/* ── Category theme map ──────────────────────────────────────────────── */
const CATEGORY_THEMES = {
  flowers: { primary: '#1a472a', accent: '#7cb518', particle: '#7cb518' },
  edibles: { primary: '#4a1a4f', accent: '#e85c9e', particle: '#e85c9e' },
  vapes: { primary: '#0a0a2e', accent: '#5e81f4', particle: '#5e81f4' },
  disposables: { primary: '#0a0a2e', accent: '#5e81f4', particle: '#5e81f4' },
  cartridges: { primary: '#1a1a1a', accent: '#c0c0c0', particle: '#c0c0c0' },
  prerolls: { primary: '#2e1a00', accent: '#c8a951', particle: '#c8a951' },
  'pre-rolls': { primary: '#2e1a00', accent: '#c8a951', particle: '#c8a951' },
  deals: { primary: '#2e0000', accent: '#ff3300', particle: '#ff3300' },
};

function getTheme(category) {
  if (!category) return CATEGORY_THEMES.flowers;
  const key = (category.id || category.name || '').toLowerCase().replace(/[\s/]+/g, '');
  // Try direct match then substring match
  for (const [k, v] of Object.entries(CATEGORY_THEMES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { primary: '#1a472a', accent: '#7cb518', particle: '#7cb518' };
}

/* ── Layout selector ─────────────────────────────────────────────────── */
function CategoryLayout({ category, products, theme }) {
  if (!category || products.length === 0) {
    return (
      <div className="app-empty">
        <p>Waiting for products…</p>
      </div>
    );
  }

  const id = (category.id || '').toLowerCase();
  const categoryTheme = theme;

  // Phase 3 premium layouts (preferred)
  if (id.includes('flower')) return <BudUniverse products={products} categoryTheme={categoryTheme} />;
  if (id.includes('edible')) return <NeuralConstellation products={products} categoryTheme={categoryTheme} />;
  if (id.includes('vape') || id.includes('disposable')) return <NeonTechGrid products={products} categoryTheme={categoryTheme} />;
  if (id.includes('cart')) return <TheCollection products={products} categoryTheme={categoryTheme} />;
  if (id.includes('pre')) return <SmokeShelf products={products} categoryTheme={categoryTheme} />;
  if (id.includes('deal')) return <DealsLayout products={products} />;
  return <BudUniverse products={products} categoryTheme={categoryTheme} />;
}

/* ── Clock ───────────────────────────────────────────────────────────── */
function Clock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="app-clock">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

/* ── Main App ────────────────────────────────────────────────────────── */
export default function App() {
  const { currentCategory, nextCategory, progress, jumpTo, categories, connectionError } = useRotation();
  const [products, setProducts] = useState([]);
  const [productConnError, setProductConnError] = useState(false);
  const productErrorCount = useRef(0);
  const theme = getTheme(currentCategory);

  // ── Subscribe to products for current category ─────────────────────
  useEffect(() => {
    if (!currentCategory?.id) {
      setProducts([]);
      return;
    }
    const ref = collection(db, 'products', currentCategory.id, 'items');
    const unsub = onSnapshot(ref, (snap) => {
      productErrorCount.current = 0;
      setProductConnError(false);
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.active !== false);
      setProducts(items);
    }, (err) => {
      console.error('[App] products error:', err);
      productErrorCount.current += 1;
      if (productErrorCount.current >= 3) {
        setProductConnError(true);
      }
    });

    return () => unsub();
  }, [currentCategory?.id]);

  // ── Apply CSS variables to root ────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--category-primary', theme.primary);
    root.style.setProperty('--category-accent', theme.accent);
    root.style.setProperty('--category-particle', theme.particle);
  }, [theme]);

  const showConnectionOverlay = connectionError || productConnError;

  return (
    <div className="app-root">
      {/* Connection Lost Overlay */}
      <ConnectionOverlay visible={showConnectionOverlay} />
      {/* Ambient background */}
      <div className="category-glow-bg" />

      {/* Particle system */}
      <ParticleCanvas categoryAccent={theme.particle} />

      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="app-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill={theme.primary} />
            <path d="M18 6c0 0-8 6-8 12s8 12 8 12 8-6 8-12S18 6 18 6z" fill={theme.accent} opacity="0.9" />
            <path d="M18 10v16M10 18h16" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="app-logo__text">DispensaryAI</span>
        </div>

        <div className="app-category-name">
          {currentCategory?.name || 'Loading…'}
        </div>

        <div className="app-header-right">
          <Clock />
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="app-content">
        <CategoryTransition
          categoryId={currentCategory?.id}
          categoryName={currentCategory?.name}
          categoryAccent={theme.accent}
        >
          <CategoryLayout category={currentCategory} products={products} theme={theme} />
        </CategoryTransition>
      </main>

      {/* ── FOOTER ── */}
      <footer className="app-footer">
        <div className="app-next-preview">
          {nextCategory && nextCategory.id !== currentCategory?.id && (
            <>
              <span className="app-next-label">Next:</span>
              <span className="app-next-name">{nextCategory.name}</span>
            </>
          )}
        </div>

        <div className="app-dots">
          {categories.map((cat, i) => {
            const isActive = cat.id === currentCategory?.id;
            return (
              <button
                key={cat.id}
                className={`app-dot ${isActive ? 'app-dot--active' : ''}`}
                onClick={() => jumpTo(i)}
                title={cat.name}
                aria-label={`Jump to ${cat.name}`}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="app-progress">
          <div
            className="app-progress__bar"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </footer>
    </div>
  );
}
