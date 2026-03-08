/**
 * App.jsx — Main Display Shell with Location Routing
 *
 * /             → Location picker landing page
 * /:locationId  → Full display for that location
 */

import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
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
import CloudBubbles from './layouts/CloudBubbles';
import BudUniverse from './layouts/BudUniverse';
import NeuralConstellation from './layouts/NeuralConstellation';
import NeonTechGrid from './layouts/NeonTechGrid';
import TheCollection from './layouts/TheCollection';
import SmokeShelf from './layouts/SmokeShelf';
import './App.css';

/* ── Locations ───────────────────────────────────────────────────────────── */
const LOCATIONS = [
  { id: 'north-capitol', name: 'North Capitol' },
  { id: 'mt-pleasant', name: 'Mt Pleasant' },
  { id: 'georgia-ave', name: 'Georgia Ave' },
  { id: 'columbia-rd', name: 'Columbia Rd' },
];

/* ── Category theme map ──────────────────────────────────────────────────── */
const CATEGORY_THEMES = {
  flowers: { primary: '#122418', accent: '#6ab04c', particle: '#6ab04c' },
  edibles: { primary: '#2a1528', accent: '#c06c84', particle: '#c06c84' },
  vapes: { primary: '#101428', accent: '#7c8cf8', particle: '#7c8cf8' },
  disposables: { primary: '#101428', accent: '#7c8cf8', particle: '#7c8cf8' },
  cartridges: { primary: '#161616', accent: '#a8a8a8', particle: '#a8a8a8' },
  prerolls: { primary: '#1e1408', accent: '#b8943e', particle: '#b8943e' },
  'pre-rolls': { primary: '#1e1408', accent: '#b8943e', particle: '#b8943e' },
  deals: { primary: '#221010', accent: '#e55039', particle: '#e55039' },
};

function getTheme(category) {
  if (!category) return CATEGORY_THEMES.flowers;
  const key = (category.id || category.name || '').toLowerCase().replace(/[\s/]+/g, '');
  for (const [k, v] of Object.entries(CATEGORY_THEMES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { primary: '#122418', accent: '#6ab04c', particle: '#6ab04c' };
}

/* ── Layout selector ─────────────────────────────────────────────────────── */
function CategoryLayout({ category, products, theme }) {
  if (!category || products.length === 0) {
    return <div className="app-empty"><p>Waiting for products…</p></div>;
  }
  const id = (category.id || '').toLowerCase();
  if (id.includes('flower')) return <CloudBubbles products={products} categoryTheme={theme} />;
  if (id.includes('edible')) return <NeuralConstellation products={products} categoryTheme={theme} />;
  if (id.includes('vape') || id.includes('disposable')) return <VapesLayout products={products} categoryTheme={theme} />;
  if (id.includes('cart')) return <TheCollection products={products} categoryTheme={theme} />;
  if (id.includes('pre')) return <SmokeShelf products={products} categoryTheme={theme} />;
  if (id.includes('deal')) return <DealsLayout products={products} />;
  return <CloudBubbles products={products} categoryTheme={theme} />;
}

/* ── Clock ───────────────────────────────────────────────────────────────── */
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

/* ── Location Picker (landing page at /) ─────────────────────────────────── */
function LocationPicker() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f0a 0%, #101e14 50%, #0a0a0f 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      gap: 48,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <img
          src={`${import.meta.env.BASE_URL}main_logo.webp`}
          alt="Logo"
          style={{ height: 90, objectFit: 'contain', filter: 'drop-shadow(0 4px 24px rgba(106,176,76,0.3))' }}
        />
        <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Select Display Location
        </div>
      </div>

      {/* Location buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 520, padding: '0 24px' }}>
        {LOCATIONS.map((loc) => (
          <button
            key={loc.id}
            onClick={() => navigate(`/${loc.id}`)}
            style={{
              padding: '28px 24px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(106,176,76,0.25)',
              borderRadius: 16,
              color: '#e8e8e8',
              fontSize: 17,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.01em',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(106,176,76,0.12)';
              e.currentTarget.style.borderColor = 'rgba(106,176,76,0.65)';
              e.currentTarget.style.color = '#6ab04c';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(106,176,76,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(106,176,76,0.25)';
              e.currentTarget.style.color = '#e8e8e8';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Display (/:locationId) ──────────────────────────────────────────────── */
function Display() {
  const { locationId } = useParams();
  const { currentCategory, nextCategory, progress, jumpTo, categories, connectionError } = useRotation(locationId);
  const [products, setProducts] = useState([]);
  const [productConnError, setProductConnError] = useState(false);
  const productErrorCount = useRef(0);
  const theme = getTheme(currentCategory);

  // Subscribe to products for current category — scoped to this location
  useEffect(() => {
    if (!currentCategory?.id || !locationId) {
      setProducts([]);
      return;
    }
    const ref = collection(db, 'locations', locationId, 'products', currentCategory.id, 'items');
    const unsub = onSnapshot(ref, (snap) => {
      productErrorCount.current = 0;
      setProductConnError(false);
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.active !== false);
      setProducts(items);
    }, (err) => {
      console.error('[Display] products error:', err);
      productErrorCount.current += 1;
      if (productErrorCount.current >= 3) setProductConnError(true);
    });
    return () => unsub();
  }, [currentCategory?.id, locationId]);

  // Apply CSS variables to root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--category-primary', theme.primary);
    root.style.setProperty('--category-accent', theme.accent);
    root.style.setProperty('--category-particle', theme.particle);
  }, [theme]);

  const showConnectionOverlay = connectionError || productConnError;

  return (
    <div className="app-root">
      <ConnectionOverlay visible={showConnectionOverlay} />
      <div className="category-glow-bg" />
      <ParticleCanvas categoryAccent={theme.particle} />

      {/* HEADER */}
      <header className="app-header">
        <div className="app-category-name">
          {currentCategory?.name || 'Loading…'}
        </div>
        <div className="app-logo">
          <img src={`${import.meta.env.BASE_URL}main_logo.webp`} alt="Logo" style={{ height: '76px', objectFit: 'contain' }} />
        </div>
        <div className="app-header-right">
          <Clock />
        </div>
      </header>

      {/* CONTENT */}
      <main className="app-content">
        <CategoryTransition
          categoryId={currentCategory?.id}
          categoryName={currentCategory?.name}
          categoryAccent={theme.accent}
        >
          <CategoryLayout category={currentCategory} products={products} theme={theme} />
        </CategoryTransition>
      </main>

      {/* FOOTER */}
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
        <div className="app-progress">
          <div className="app-progress__bar" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </footer>
    </div>
  );
}

/* ── Root App ────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LocationPicker />} />
      <Route path="/:locationId" element={<Display />} />
    </Routes>
  );
}
