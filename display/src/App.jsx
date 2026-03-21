/**
 * App.jsx — Main Display Shell with Location Routing
 *
 * /             → Location picker landing page
 * /:locationId  → Full display for that location
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
import VariantLayout from './layouts/VariantLayout';
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
function CategoryLayout({ category, products, variantGroups, theme, onAllShown }) {
  if (!category || products.length === 0) {
    return <div className="app-empty"><p>Waiting for products…</p></div>;
  }

  // If any enabled variant groups exist for this category, use VariantLayout
  const activeGroups = (variantGroups || []).filter(g => g.enabled !== false);
  if (activeGroups.length > 0) {
    return <VariantLayout products={products} variantGroups={activeGroups} categoryTheme={theme} />;
  }

  const id = (category.id || '').toLowerCase();
  if (id.includes('flower')) return <CloudBubbles products={products} categoryTheme={theme} />;
  if (id.includes('edible')) return <NeuralConstellation products={products} categoryTheme={theme} onAllShown={onAllShown} />;
  if (id.includes('vape') || id.includes('disposable')) return <VapesLayout products={products} categoryTheme={theme} />;
  if (id.includes('cart')) return <CartridgesLayout products={products} categoryTheme={theme} />;
  if (id.includes('pre')) return <PreRollsLayout products={products} categoryTheme={theme} />;
  if (id.includes('deal')) return <DealsLayout products={products} />;
  return <CloudBubbles products={products} categoryTheme={theme} />;
}

/* ── Clock & Weather ───────────────────────────────────────────────────────────────── */
function Clock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="app-clock">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
}

function Weather() {
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' });
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (!API_KEY) {
          setWeather({ temp: '--', condition: 'Washington DC', icon: '🏛️' });
          return;
        }
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Washington,DC,US&units=imperial&appid=${API_KEY}`
        );
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        const temp = Math.round(data.main.temp);
        const condition = data.weather[0].main;
        const iconMap = {
          Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
          Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️'
        };
        setWeather({ temp: `${temp}°F`, condition, icon: iconMap[condition] || '🌤️' });
        setError(false);
      } catch (err) {
        console.error('[Weather] Error:', err);
        setError(true);
        setWeather({ temp: '--', condition: 'Washington DC', icon: '🏛️' });
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-weather">
      <span className="app-weather-icon">{weather.icon}</span>
      <div className="app-weather-info">
        <div className="app-weather-temp">{weather.temp}</div>
        <div className="app-weather-condition">{weather.condition}</div>
      </div>
    </div>
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
  const { currentCategory, nextCategory, progress, jumpTo, setSkipAutoAdvance, categories, connectionError } = useRotation(locationId);
  const [products, setProducts] = useState([]);
  const [variantGroups, setVariantGroups] = useState([]);
  const [productConnError, setProductConnError] = useState(false);
  const productErrorCount = useRef(0);
  const theme = getTheme(currentCategory);

  const isEdibles = (currentCategory?.id || '').toLowerCase().includes('edible');

  // Block the category timer while edibles is cycling through products
  useEffect(() => {
    setSkipAutoAdvance(isEdibles);
  }, [isEdibles, setSkipAutoAdvance]);

  // Called by NeuralConstellation when all edibles products have been shown once
  const handleEdiblesComplete = useCallback(() => {
    const idx = categories.findIndex(c => c.id === currentCategory?.id);
    const next = (idx + 1) % Math.max(categories.length, 1);
    setSkipAutoAdvance(false);
    jumpTo(next);
  }, [categories, currentCategory, jumpTo, setSkipAutoAdvance]);

  // Subscribe to products for current category — scoped to this location
  useEffect(() => {
    if (!currentCategory?.id || !locationId) {
      setProducts([]);
      setVariantGroups([]);
      return;
    }
    const ref = collection(db, 'locations', locationId, 'products', currentCategory.id, 'items');
    const unsub = onSnapshot(ref, (snap) => {
      productErrorCount.current = 0;
      setProductConnError(false);
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.active !== false && p.inStock !== false);
      setProducts(items);
    }, (err) => {
      console.error('[Display] products error:', err);
      productErrorCount.current += 1;
      if (productErrorCount.current >= 3) setProductConnError(true);
    });

    // Subscribe to variant groups for this category
    const vgRef = collection(db, 'locations', locationId, 'products', currentCategory.id, 'variantGroups');
    const unsubVG = onSnapshot(vgRef, (snap) => {
      setVariantGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {
      setVariantGroups([]);
    });

    return () => { unsub(); unsubVG(); };
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
        <div className="app-header-center">
          <div className="app-logo">
            <img src={`${import.meta.env.BASE_URL}main_logo.webp`} alt="Logo" className="app-logo-img" />
          </div>
          <div className="app-header-meta">
            <Clock />
            <Weather />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="app-content">
        <CategoryTransition
          categoryId={currentCategory?.id}
          categoryName={currentCategory?.name}
          categoryAccent={theme.accent}
        >
          <CategoryLayout
            category={currentCategory}
            products={products}
            variantGroups={variantGroups}
            theme={theme}
            onAllShown={isEdibles ? handleEdiblesComplete : undefined}
          />
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
