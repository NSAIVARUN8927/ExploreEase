import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  Compass,
  MapPin,
  Utensils,
  Route as RouteIcon,
  CalendarDays,
  Bookmark,
  User,
  LogOut,
  Menu,
  X,
  Search,
  ArrowRight,
  Sparkles,
  Wallet,
  Clock,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  Mail,
  LockKeyhole,
  Save
} from 'lucide-react';

import api from './api';

// =====================================================
// UTILITIES
// =====================================================

const money = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(n || 0));


// =====================================================
// MAIN LAYOUT
// =====================================================

function Shell({ children, user, setUser }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMode, setProfileMode] = useState('');
  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setProfileName(user?.full_name || '');
  }, [user]);

  const nav = [
    ['/', 'Overview', Compass],
    ['/explore', 'Explore places', MapPin],
    ['/recommendations', 'For you', Sparkles],
    ['/food', 'Food & dining', Utensils],
    ['/planner', 'Trip planner', CalendarDays],
    ['/saved', 'Saved trips', Bookmark],
    ['/dashboard', 'Dashboard', User]
  ];

  function logout() {
    localStorage.removeItem('ee_token');
    setUser(null);
    setProfileOpen(false);
    navigate('/login');
  }

  async function saveProfile(e) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileError('');
    setProfileMessage('');
    try {
      const response = await api.patch('/auth/profile', { full_name: profileName.trim() });
      setUser(response.data);
      setProfileMode('');
      setProfileMessage('Profile updated successfully.');
    } catch (error) {
      setProfileError(error.response?.data?.detail || 'Could not update your profile.');
    } finally {
      setProfileBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');
    if (newPassword.length < 8) return setProfileError('New password must contain at least 8 characters.');
    if (newPassword !== confirmPassword) return setProfileError('New passwords do not match.');
    setProfileBusy(true);
    try {
      await api.patch('/auth/password', { current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfileMode('');
      setProfileMessage('Password changed successfully.');
    } catch (error) {
      setProfileError(error.response?.data?.detail || 'Could not change your password.');
    } finally {
      setProfileBusy(false);
    }
  }

  return (
    <div className="app-shell">

      <aside className={`sidebar ${open ? 'show' : ''}`}>

        <Link to="/" className="brand">
          <img className="brand-logo" src="/exploreease-logo.svg" alt="ExploreEase logo" />

          <span>
            explore<span className="brand-light">ease</span>
            <small>TRAVEL, MADE PERSONAL</small>
          </span>
        </Link>

        <div className="side-label">WORKSPACE</div>

        {nav.map(([to, label, Icon]) => (
          <NavLink
            onClick={() => setOpen(false)}
            end={to === '/'}
            className={({ isActive }) =>
              'nav-item ' + (isActive ? 'active' : '')
            }
            to={to}
            key={to}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="side-bottom">

          <div className="help-card">
            <Sparkles size={18} />
            <b>Your next story awaits</b>
            <p>Build a trip around the things you love.</p>

            <Link to="/planner">
              Plan a trip <ArrowRight size={14} />
            </Link>
          </div>



        </div>
      </aside>

      <main className="main-area">

        <header className="topbar">

          <button
            className="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>

          <div className="breadcrumb">
            Your journey <span>/</span> <b>Discover</b>
          </div>

          <div className="top-actions">
            <span className="live-dot">
              ExploreEase is ready
            </span>

            {user ? (
              <div className="profile-menu-wrap">
                <button type="button" className="top-avatar-button" onClick={() => { setProfileOpen(v => !v); setProfileMode(''); setProfileError(''); setProfileMessage(''); }} aria-label="Open account menu" aria-expanded={profileOpen}>
                  <span className="top-avatar">{user.full_name?.[0]?.toUpperCase() || 'U'}</span>
                  <ChevronDown size={15} />
                </button>
                {profileOpen && <>
                  <button type="button" className="profile-menu-backdrop" aria-label="Close account menu" onClick={() => { setProfileOpen(false); setProfileMode(''); }} />
                  <section className="profile-dropdown">
                    <div className="profile-dropdown-head">
                      <span className="profile-dropdown-avatar">{user.full_name?.[0]?.toUpperCase() || 'U'}</span>
                      <div><strong>{user.full_name}</strong><small><Mail size={13} /> {user.email}</small></div>
                    </div>
                    {profileMessage && <div className="profile-success">{profileMessage}</div>}
                    {profileError && <div className="profile-error">{profileError}</div>}
                    {profileMode === 'edit' ? (
                      <form className="profile-form" onSubmit={saveProfile}>
                        <label>Full name<input value={profileName} onChange={e => setProfileName(e.target.value)} minLength="2" maxLength="120" required /></label>
                        <div className="profile-form-actions"><button type="button" onClick={() => setProfileMode('')}>Cancel</button><button type="submit" disabled={profileBusy}><Save size={14} /> {profileBusy ? 'Saving…' : 'Save changes'}</button></div>
                      </form>
                    ) : profileMode === 'password' ? (
                      <form className="profile-form" onSubmit={changePassword}>
                        <label>Current password<input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label>
                        <label>New password<input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength="8" autoComplete="new-password" required /></label>
                        <label>Confirm new password<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength="8" autoComplete="new-password" required /></label>
                        <div className="profile-form-actions"><button type="button" onClick={() => setProfileMode('')}>Cancel</button><button type="submit" disabled={profileBusy}><LockKeyhole size={14} /> {profileBusy ? 'Updating…' : 'Update password'}</button></div>
                      </form>
                    ) : (
                      <div className="profile-menu-actions">
                        <button type="button" onClick={() => { setProfileName(user.full_name || ''); setProfileMode('edit'); setProfileError(''); setProfileMessage(''); }}><User size={16} /> Edit profile</button>
                        <button type="button" onClick={() => { setProfileMode('password'); setProfileError(''); setProfileMessage(''); }}><LockKeyhole size={16} /> Change password</button>
                        <button type="button" className="profile-signout" onClick={logout}><LogOut size={16} /> Sign out</button>
                      </div>
                    )}
                  </section>
                </>}
              </div>
            ) : (
              <Link className="signin-link" to="/login">Sign in <ArrowRight size={15} /></Link>
            )}
          </div>

        </header>

        {children}

        <footer>
          © 2026 ExploreEase
          <span>Discover thoughtfully. Travel freely.</span>
        </footer>

      </main>
    </div>
  );
}


// =====================================================
// REUSABLE PAGE HEADER
// =====================================================

function PageHead({ eyebrow, title, desc, children }) {
  return (
    <div className="page-head">

      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>

      {children}

    </div>
  );
}


// =====================================================
// SAVE PLACE BUTTON
// =====================================================

function SavePlaceButton({ place }) {
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const name = place.Place_Name || 'Local discovery';
  const city = place.City || '';

  useEffect(() => {
    if (!localStorage.getItem('ee_token')) return;

    api.get('/saved-places')
      .then((res) => {
        const existing = (res.data.items || []).find(
          (item) =>
            item.place_name === name &&
            item.city === city
        );

        if (existing) {
          setSaved(true);
          setSavedId(existing.id);
        }
      })
      .catch(() => {});
  }, [name, city]);

  async function toggleSave(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!localStorage.getItem('ee_token')) {
      alert('Please sign in to save places.');
      return;
    }

    setLoading(true);

    try {
      if (saved && savedId) {
        await api.delete(`/saved-places/${savedId}`);

        setSaved(false);
        setSavedId(null);
      } else {
        const res = await api.post('/saved-places', {
          place_name: name,
          city,
          category: place.Category || 'Place',
          latitude: place.Latitude ?? null,
          longitude: place.Longitude ?? null,
          osm_id: place.OSM_ID ?? null
        });

        setSaved(true);
        setSavedId(res.data.id || res.data.item?.id || null);

        // Refresh saved ID if the API returns a different response shape.
        if (!res.data.id && !res.data.item?.id) {
          const savedRes = await api.get('/saved-places');

          const existing = (savedRes.data.items || []).find(
            (item) =>
              item.place_name === name &&
              item.city === city
          );

          if (existing) {
            setSavedId(existing.id);
          }
        }
      }
    } catch (error) {
      alert(
        error.response?.data?.detail ||
        'Unable to update saved place.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="heart"
      onClick={toggleSave}
      disabled={loading}
      title={saved ? 'Remove from saved places' : 'Save place'}
      aria-label={saved ? 'Unsave place' : 'Save place'}
    >
      <Heart
        size={19}
        fill={saved ? 'currentColor' : 'none'}
      />
    </button>
  );
}


// =====================================================
// PLACE CARD
// =====================================================

function getPlaceImage(place, index = 0) {
  const text = `${place.Place_Name || ''} ${place.Category || ''} ${place.City || ''}`.toLowerCase();

  const imageGroups = [
    { terms: ['temple', 'mandir', 'shrine', 'church', 'mosque', 'religious'], ids: ['photo-1548013146-72479768bada', 'photo-1564769625905-50e93615e769', 'photo-1518709268805-4e9042af9f23'] },
    { terms: ['beach', 'sea', 'coast', 'island', 'marine'], ids: ['photo-1507525428034-b723cf961d3e', 'photo-1519046904884-53103b34b206', 'photo-1499793983690-e29da59ef1c2'] },
    { terms: ['waterfall', 'falls', 'river', 'lake', 'dam', 'water'], ids: ['photo-1439066615861-d1af74d74000', 'photo-1470770841072-f978cf4d019e', 'photo-1433086966358-54859d0ed716'] },
    { terms: ['mountain', 'hill', 'hills', 'valley', 'peak', 'trek'], ids: ['photo-1464822759023-fed622ff2c3b', 'photo-1501785888041-af3ef285b470', 'photo-1464278533981-50106e6176b1'] },
    { terms: ['fort', 'palace', 'heritage', 'monument', 'historic', 'architecture', 'museum'], ids: ['photo-1564507592333-c60657eea523', 'photo-1599661046827-dacff0c0f09a', 'photo-1524492412937-b28074a5d7da'] },
    { terms: ['park', 'garden', 'forest', 'wildlife', 'zoo', 'nature', 'sanctuary'], ids: ['photo-1441974231531-c6227db76b6e', 'photo-1472396961693-142e6e269027', 'photo-1500530855697-b586d89ba3ee'] },
    { terms: ['city', 'market', 'street', 'shopping', 'urban'], ids: ['photo-1519501025264-65ba15a82390', 'photo-1519608487953-e999c86e7455', 'photo-1518005020951-ecc8e9c5f8c1'] }
  ];

  const match = imageGroups.find(group => group.terms.some(term => text.includes(term)));
  const ids = match?.ids || ['photo-1500530855697-b586d89ba3ee', 'photo-1470770841072-f978cf4d019e', 'photo-1501785888041-af3ef285b470'];
  const id = ids[Math.abs(index) % ids.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;
}

function PlaceCard({ place, index = 0 }) {
  const name = place.Place_Name || 'Local discovery';
  const city = place.City || '';
  const cat = place.Category || 'Place';
  const [imageSrc, setImageSrc] = useState(() => getPlaceImage(place, index));
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageSrc(getPlaceImage(place, index));
    setImageFailed(false);
  }, [name, city, cat, index]);

  return (
    <article className="place-card">
      <Link to={`/place/${encodeURIComponent(name)}`}>
        <div className="place-image">
          <img
            src={imageSrc}
            alt={`${name}, ${city}`}
            loading="lazy"
            onError={() => {
              if (!imageFailed) {
                setImageFailed(true);
                setImageSrc('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85');
              }
            }}
          />
          <span>{cat}</span>
          <SavePlaceButton place={place} />
        </div>
        <div className="place-info">
          <h3>{name}</h3>
          <div className="place-meta">
            <MapPin size={14} />
            {city || 'Explore nearby'}
            <span>·</span>
            {place.Latitude && place.Longitude ? 'Mapped location' : 'Discover'}
          </div>
        </div>
      </Link>
    </article>
  );
}

// =====================================================
// HOME PAGE
// =====================================================

function Home() {
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');
  const [places, setPlaces] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/meta/cities')
      .then((r) => {
        setCities(r.data.cities || []);

        if (r.data.cities?.length) {
          setCity(r.data.cities[0]);
        }
      })
      .catch(() => {
        setErr('Could not connect to the API. Start the backend and refresh.');
      });

    api.get('/places?limit=6')
      .then((r) => setPlaces(r.data.items || []))
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">

        <div className="hero-content">

          <div className="hero-pill">
            <Sparkles size={14} />
            YOUR PERSONAL TRAVEL COMPANION
          </div>

          <h1>
            Find your next
            <br />
            <em>somewhere.</em>
          </h1>

          <p>
            Discover places worth the journey, uncover local favorites,
            and plan a trip that feels like yours.
          </p>

          <div className="search-panel">

            <div className="search-field">
              <MapPin />

              <div>
                <small>DESTINATION</small>

                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="">Choose a city</option>

                  {cities.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <Link
              className="search-button"
              to={
                city
                  ? `/explore?city=${encodeURIComponent(city)}`
                  : '/explore'
              }
            >
              Explore <ArrowRight size={17} />
            </Link>

          </div>

          {err && <div className="error-note">{err}</div>}

        </div>

        <div className="hero-note">
          <span>✦</span> Less scrolling. More exploring.
        </div>

      </section>

      <section className="content-section">

        <div className="section-heading">

          <div>
            <div className="eyebrow">START EXPLORING</div>
            <h2>Make room for wonder</h2>
            <p>Places from the ExploreEase destination collection.</p>
          </div>

          <Link className="text-link" to="/explore">
            View all places <ArrowRight size={16} />
          </Link>

        </div>

        <div className="place-grid">

          {places.slice(0, 6).map((p, i) => (
            <PlaceCard
              key={p.Place_Name || i}
              place={p}
              index={i}
            />
          ))}

          {!places.length && (
            <div className="empty-state">
              Destination data will appear here when the API is connected.
            </div>
          )}

        </div>

      </section>

      <section className="feature-strip">

        <div>
          <span className="feature-icon"><Sparkles /></span>
          <b>Recommendations with context</b>
          <small>Discover places based on your interests.</small>
        </div>

        <div>
          <span className="feature-icon"><Wallet /></span>
          <b>Plan around your budget</b>
          <small>See known entry fees before you go.</small>
        </div>

        <div>
          <span className="feature-icon"><CalendarDays /></span>
          <b>Your trip, your pace</b>
          <small>Build and save a personal itinerary.</small>
        </div>

      </section>
    </>
  );
}


// =====================================================
// EXPLORE PAGE
// =====================================================

function Explore() {
  const [items, setItems] = useState([]);
  const [cities, setCities] = useState([]);

  const [city, setCity] = useState(
    new URLSearchParams(window.location.search).get('city') || ''
  );

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    api.get('/meta/cities')
      .then((r) => setCities(r.data.cities || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    api.get('/places', {
      params: {
        city: city || undefined,
        search: search || undefined,
        limit: 60
      }
    })
      .then((r) => {
        setItems(r.data.items || []);
        setMessage('');
      })
      .catch(() => {
        setMessage('Unable to load destinations. Check that your backend is running.');
      })
      .finally(() => setLoading(false));

  }, [city, search]);

  return (
    <div className="page-wrap">

      <PageHead
        eyebrow="THE DISCOVERY BOARD"
        title="Explore places"
        desc="A little curiosity can take you a long way."
      />

      <div className="filters">

        <div className="input-wrap">
          <Search />

          <input
            placeholder="Search a place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="select-wrap">
          <SlidersHorizontal />

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">All cities</option>

            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

      </div>

      <div className="results-line results-tools">
        <span>
          {loading ? 'Finding places…' : `${items.length} places to discover`}
        </span>

        <button
          className="map-toggle"
          onClick={() => setShowMap((v) => !v)}
        >
          {showMap ? 'Hide map' : 'Show map'}
        </button>
      </div>

      {showMap && <MapPanel places={items} />}

      {message && <div className="error-note">{message}</div>}

      <div className="place-grid">

        {items.map((p, i) => (
          <PlaceCard
            key={p.Place_Name + i}
            place={p}
            index={i}
          />
        ))}

      </div>

      {!loading && !items.length && !message && (
        <div className="empty-state">
          No places found. Try another search or city.
        </div>
      )}

    </div>
  );
}


// =====================================================
// FOOD PAGE
// =====================================================

function Food() {
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');
  const [items, setItems] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    api.get('/meta/cities')
      .then((r) => setCities(r.data.cities || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/food', {
      params: { city: city || undefined }
    })
      .then((r) => {
        setItems(r.data.items || []);
        setNote(r.data.note || '');
      })
      .catch(() => {
        setNote('Could not connect to the food data API.');
      });
  }, [city]);

  return (
    <div className="page-wrap">

      <PageHead
        eyebrow="TASTE THE LOCAL SIDE"
        title="Food & dining"
        desc="Find local food discoveries along your route."
      />

      <div className="filters">

        <div className="select-wrap">
          <MapPin />

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">All cities</option>

            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

      </div>

      <div className="food-grid">

        {items.map((f, i) => (
          <div className="food-card" key={i}>

            <div className="food-symbol">
              <Utensils />
            </div>

            <div>
              <h3>
                {f.Food_Name || f.Name || f.Dish || 'Local food'}
              </h3>

              <p>
                {f.City || city}
                {f.Category ? ` · ${f.Category}` : ''}
              </p>

              {f.Price ? (
                <b>{f.Currency || '₹'}{f.Price}</b>
              ) : (
                <small>Price not verified</small>
              )}
            </div>

          </div>
        ))}

      </div>

      {!items.length && (
        <div className="empty-state">
          No food entries are available for this selection yet.
        </div>
      )}

      <p className="data-note">{note}</p>

    </div>
  );
}


// =====================================================
// TRIP PLANNER
// =====================================================

function Planner({ user }) {
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState(10000);
  const [days, setDays] = useState(2);
  const [interests, setInterests] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api.get('/meta/cities')
      .then((r) => {
        setCities(r.data.cities || []);

        if (r.data.cities?.length) {
          setCity(r.data.cities[0]);
        }
      })
      .catch(() => {
        setError('Could not load cities. Check the backend connection.');
      });
  }, []);

  const opts = [
    'Nature',
    'Culture',
    'History',
    'Food',
    'Adventure',
    'Architecture'
  ];

  function toggle(x) {
    setInterests((v) =>
      v.includes(x)
        ? v.filter((a) => a !== x)
        : [...v, x]
    );
  }

  async function plan(e) {
    e.preventDefault();

    setBusy(true);
    setError('');
    setNotice('');
    setResult(null);

    try {
      const r = await api.post('/trips/plan', {
        city,
        budget: Number(budget),
        currency: 'INR',
        days: Number(days),
        max_places: Math.min(30, Number(days) * 4),
        interests
      });

      setResult(r.data);

    } catch (e) {
      setError(
        e.response?.data?.detail ||
        'Trip planning failed. Check the API connection.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!user) {
      setError('Sign in first to save your itinerary.');
      return;
    }

    if (!result?.itinerary?.length) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api.post('/trips/save', {
        title: `${city} getaway`,
        city,
        days: Number(days),
        budget: Number(budget),
        currency: 'INR',
        itinerary: result.itinerary
      });

      setNotice('Your itinerary has been saved to your account.');

    } catch (e) {
      setError(
        e.response?.data?.detail ||
        'Could not save trip.'
      );
    } finally {
      setSaving(false);
    }
  }

  const groups = Array.from(
    { length: Number(result?.days || days) },
    (_, i) => ({
      day: i + 1,
      items: (result?.itinerary || []).filter(
        (p, index) =>
          Math.floor(
            index /
            Math.ceil(
              (result?.itinerary?.length || 1) /
              Number(result?.days || days)
            )
          ) === i
      )
    })
  ).filter((g) => g.items.length);

  return (
    <div className="page-wrap">

      <PageHead
        eyebrow="MAKE IT YOURS"
        title="Plan a trip"
        desc="Build a practical itinerary around your destination, interests and total budget."
      />

      <div className="planner-layout">

        <form className="planner-form" onSubmit={plan}>

          <label>
            Where to?

            <select
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <div className="form-row">

            <label>
              Total budget (₹)

              <input
                type="number"
                min="1"
                max="10000000"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>

            <label>
              Trip duration (days)

              <input
                type="number"
                min="1"
                max="14"
                required
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </label>

          </div>

          <div className="interest-label">
            Choose your interests
          </div>

          <div className="chips">
            {opts.map((x) => (
              <button
                type="button"
                className={interests.includes(x) ? 'chip selected' : 'chip'}
                onClick={() => toggle(x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>

          <button
            className="primary-button full"
            disabled={busy || !city}
          >
            {busy ? 'Building your itinerary…' : 'Create my itinerary'}
            <ArrowRight size={17} />
          </button>

          <p className="form-hint">
            The planner uses available destination data. Food, transport
            and accommodation costs are not included unless verified data exists.
          </p>

          {error && <div className="error-note">{error}</div>}
          {notice && <div className="success-note">{notice}</div>}

        </form>

        <div className="planner-result">

          {!result ? (
            <div className="result-placeholder">
              <span><RouteIcon /></span>
              <h3>Your journey starts here</h3>
              <p>
                Select a city, set your budget and create your day-by-day plan.
              </p>
            </div>
          ) : (
            <>
              <div className="result-top">

                <div>
                  <div className="eyebrow">YOUR TRAVEL PLAN</div>
                  <h2>{result.city} escape</h2>
                  <p>
                    {result.days} days · {result.total_places} suggested stops
                  </p>
                </div>

                <button
                  className="save-button"
                  onClick={save}
                  disabled={saving}
                >
                  <Bookmark size={16} />
                  {saving ? 'Saving…' : 'Save trip'}
                </button>

              </div>

              <div className="budget-summary">

                <div>
                  <small>TOTAL BUDGET</small>
                  <b>{money(result.budget)}</b>
                </div>

                <div>
                  <small>VERIFIED ENTRY FEES</small>
                  <b>{money(result.verified_entry_fee_total)}</b>
                </div>

                <div>
                  <small>LEFT AFTER KNOWN FEES</small>
                  <b>{money(result.remaining_after_known_entry_fees)}</b>
                </div>

              </div>

              <div className="daily-budget">
                <Wallet size={17} />
                <span>Planning allowance</span>
                <b>{money(result.average_daily_budget)} / day</b>
              </div>

              <div className="day-groups">

                {groups.map((group) => (
                  <section className="day-group" key={group.day}>

                    <div className="day-heading">
                      <span>DAY {group.day}</span>
                      <b>
                        {group.items.length}
                        {group.items.length === 1 ? ' stop' : ' stops'}
                      </b>
                    </div>

                    {group.items.map((p, i) => (
                      <div className="itinerary-item" key={`${p.Place_Name}-${i}`}>

                        <span>{p.Visit_Order || i + 1}</span>

                        <div>
                          <b>{p.Place_Name}</b>

                          <small>
                            {p.Category || 'Discover'}
                            {p.Entry_Fee != null
                              ? ` · Verified entry ${money(p.Entry_Fee)}`
                              : ' · Entry fee not verified'}
                          </small>
                        </div>

                      </div>
                    ))}

                  </section>
                ))}

              </div>

              <div className="budget-caveat">
                <b>Budget transparency</b>
                <p>{result.cost_note}</p>
                <p>
                  Daily allowance is your total budget divided by trip days;
                  it is not a quote for actual daily expenses.
                </p>
              </div>

            </>
          )}

        </div>

      </div>
    </div>
  );
}


// =====================================================
// MAP COMPONENT
// =====================================================

function MapPanel({ places, selected }) {
  const valid = (places || []).filter(
    (p) =>
      Number.isFinite(Number(p.Latitude)) &&
      Number.isFinite(Number(p.Longitude))
  );

  if (!valid.length) {
    return (
      <div className="map-empty">
        Map coordinates are not available for these records yet.
      </div>
    );
  }

  const center =
    selected && selected.Latitude
      ? selected
      : valid[0];

  const lat = Number(center.Latitude);
  const lon = Number(center.Longitude);
  const pad = 0.08;

  const bbox =
    `${lon - pad}%2C${lat - pad}%2C${lon + pad}%2C${lat + pad}`;

  return (
    <div className="map-frame">

      <iframe
        title="OpenStreetMap destination map"
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`}
      />

      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`}
        target="_blank"
        rel="noreferrer"
      >
        Open larger map ↗
      </a>

    </div>
  );
}


// =====================================================
// RECOMMENDATIONS PAGE
// =====================================================

function Recommendations() {
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState(['Nature']);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/meta/cities')
      .then((r) => {
        setCities(r.data.cities || []);

        if (r.data.cities?.length) {
          setCity(r.data.cities[0]);
        }
      })
      .catch(() => {});
  }, []);

  const choices = [
    'Nature',
    'Culture',
    'History',
    'Food',
    'Adventure',
    'Architecture'
  ];

  function toggle(x) {
    setInterests((v) =>
      v.includes(x)
        ? v.filter((i) => i !== x)
        : [...v, x]
    );
  }

  async function get() {
    if (!city) return;

    setBusy(true);
    setMsg('');

    try {
      const r = await api.get('/recommendations/places', {
        params: {
          city,
          interests,
          limit: 12
        }
      });

      setItems(r.data.items || []);
      setMsg(r.data.message || '');

    } catch (e) {
      setMsg(
        e.response?.data?.detail ||
        'Recommendations are unavailable.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-wrap">

      <PageHead
        eyebrow="A LITTLE HELP FROM AI"
        title="Made for your kind of travel"
        desc="Choose a city and interests to rank places using the project's recommendation API."
      />

      <div className="recommend-box">

        <label>
          Choose a city

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <div className="interest-label">
          Your interests
        </div>

        <div className="chips">
          {choices.map((x) => (
            <button
              type="button"
              key={x}
              onClick={() => toggle(x)}
              className={interests.includes(x) ? 'chip selected' : 'chip'}
            >
              {x}
            </button>
          ))}
        </div>

        <button
          className="primary-button"
          onClick={get}
          disabled={busy}
        >
          {busy ? 'Finding matches…' : 'Get recommendations'}
          <Sparkles size={16} />
        </button>

      </div>

      {msg && <p className="data-note">{msg}</p>}

      <div className="place-grid">
        {items.map((p, i) => (
          <PlaceCard
            key={p.Place_Name + i}
            place={p}
            index={i}
          />
        ))}
      </div>

    </div>
  );
}


// =====================================================
// PLACE DETAILS PAGE
// =====================================================

function PlaceDetail() {
  const { name } = useParams();
  const decoded = decodeURIComponent(name);

  const [place, setPlace] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/places', {
      params: {
        search: decoded,
        limit: 20
      }
    })
      .then((r) => {
        const found =
          (r.data.items || []).find(
            (p) =>
              (p.Place_Name || '').toLowerCase() === decoded.toLowerCase()
          ) ||
          (r.data.items || [])[0];

        setPlace(found || null);

        if (found?.City) {
          return api.get('/places', {
            params: {
              city: found.City,
              limit: 30
            }
          }).then((x) => setNearby(x.data.items || []));
        }
      })
      .catch(() => {
        setError('Could not load this destination. Check your backend connection.');
      })
      .finally(() => setBusy(false));

  }, [decoded]);

  if (busy) {
    return <div className="page-wrap">Loading destination…</div>;
  }

  if (error || !place) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          {error || 'Destination not found.'}
          <Link to="/explore">Back to explore</Link>
        </div>
      </div>
    );
  }

  const lat = place.Latitude;
  const lon = place.Longitude;

  return (
    <div className="page-wrap">

      <Link className="text-link" to="/explore">
        ← Back to destinations
      </Link>

      <section className="detail-hero">

        <div>
          <div className="eyebrow">
            DESTINATION GUIDE · {place.City || 'EXPLORE'}
          </div>

          <h1>{place.Place_Name}</h1>

          <p>
            {place.Category || 'A place to discover'}
            {place.Address ? ` · ${place.Address}` : ''}
          </p>

          <div className="detail-facts">
            <span>
              <MapPin size={15} />
              {place.City || 'Location unavailable'}
            </span>

            <span>
              {lat && lon
                ? 'GPS location available'
                : 'GPS coordinates unavailable'}
            </span>
          </div>
        </div>

      </section>

      <div className="detail-grid">

        <section className="detail-panel">

          <div className="section-heading">
            <div>
              <div className="eyebrow">FIND YOUR WAY</div>
              <h2>Location map</h2>
              <p>Map data provided by OpenStreetMap.</p>
            </div>
          </div>

          <MapPanel places={[place]} selected={place} />

        </section>

        <section className="detail-panel">

          <div className="eyebrow">GOOD TO KNOW</div>
          <h2>Destination details</h2>

          <div className="detail-row">
            <span>City</span>
            <b>{place.City || 'Not listed'}</b>
          </div>

          <div className="detail-row">
            <span>Category</span>
            <b>{place.Category || 'Not listed'}</b>
          </div>

          <div className="detail-row">
            <span>Entry fee</span>
            <b>
              {place.Entry_Fee != null
                ? money(place.Entry_Fee)
                : 'Not verified'}
            </b>
          </div>

          <div className="detail-row">
            <span>Coordinates</span>
            <b>
              {lat && lon ? `${lat}, ${lon}` : 'Not available'}
            </b>
          </div>

          <p className="form-hint">
            Only information present in the project dataset is displayed.
            Missing fees or ratings are not estimated.
          </p>

          <Link className="primary-button" to="/planner">
            Plan a trip here <ArrowRight size={16} />
          </Link>

        </section>

      </div>

      {nearby.length > 1 && (
        <section className="content-section detail-nearby">

          <div className="section-heading">
            <div>
              <div className="eyebrow">KEEP EXPLORING</div>
              <h2>More places in {place.City}</h2>
            </div>
          </div>

          <div className="place-grid">
            {nearby
              .filter((p) => p.Place_Name !== place.Place_Name)
              .slice(0, 3)
              .map((p, i) => (
                <PlaceCard
                  key={p.Place_Name + i}
                  place={p}
                  index={i}
                />
              ))}
          </div>

        </section>
      )}

    </div>
  );
}


// =====================================================
// SAVED TRIPS PAGE
// =====================================================

function Saved({ user }) {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const r = await api.get('/trips/saved');

      setItems(r.data.items || []);
      setMsg('');

    } catch (e) {
      setMsg(
        e.response?.status === 401
          ? 'Sign in to see your saved trips.'
          : 'Could not load saved trips.'
      );
    }
  }

  useEffect(() => {
    if (user) {
      load();
    } else {
      setMsg('Sign in to see your saved trips.');
    }
  }, [user]);

  async function remove(id) {
    try {
      await api.delete(`/trips/saved/${id}`);
      load();
    } catch {
      setMsg('Could not remove this trip.');
    }
  }

  return (
    <div className="page-wrap">

      <PageHead
        eyebrow="YOUR TRAVEL COLLECTION"
        title="Saved trips"
        desc="Your plans, ready whenever you are."
      />

      <div className="saved-list">

        {items.map((t) => (
          <div className="saved-card" key={t.id}>

            <div className="saved-icon">
              <Bookmark />
            </div>

            <div>
              <h3>{t.title}</h3>

              <p>
                <MapPin size={14} />
                {t.city}
                <span>·</span>
                <Clock size={14} />
                {t.days} days
                <span>·</span>
                {money(t.budget)}
              </p>
            </div>

            <button onClick={() => remove(t.id)}>
              Remove
            </button>

          </div>
        ))}

      </div>

      {msg && (
        <div className="empty-state">
          {msg}
          <Link to="/login">
            Sign in <ArrowRight size={14} />
          </Link>
        </div>
      )}

    </div>
  );
}


// =====================================================
// DASHBOARD
// =====================================================

function Dashboard({ user }) {
  const [trips, setTrips] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [t, p] = await Promise.all([
        api.get('/trips/saved'),
        api.get('/saved-places')
      ]);

      setTrips(t.data.items || []);
      setPlaces(p.data.items || []);

    } catch (e) {
      setError(
        e.response?.data?.detail ||
        'Could not load your travel dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [user]);

  async function removePlace(id) {
    try {
      await api.delete(`/saved-places/${id}`);

      setPlaces((current) =>
        current.filter((p) => p.id !== id)
      );

    } catch (e) {
      setError(
        e.response?.data?.detail ||
        'Could not remove saved place.'
      );
    }
  }

  if (!user) {
    return (
      <div className="page-wrap">

        <PageHead
          eyebrow="YOUR SPACE"
          title="Your travel dashboard"
          desc="Sign in to see your saved places and trip plans."
        />

        <div className="empty-state">
          <Link to="/login">Sign in</Link>
          {' or '}
          <Link to="/register">create an account</Link>
          {' to continue.'}
        </div>

      </div>
    );
  }

  return (
    <div className="page-wrap">

      <PageHead
        eyebrow="YOUR TRAVEL SPACE"
        title={`Welcome, ${user.full_name?.split(' ')[0] || 'traveler'}.`}
        desc="A quick look at the journeys and places you've kept."
      />

      {loading ? (
        <div className="empty-state">
          Loading your dashboard…
        </div>
      ) : (
        <>
          <div className="dashboard-stats">

            <div className="stat-card">
              <span className="feature-icon">
                <CalendarDays />
              </span>
              <small>SAVED TRIPS</small>
              <strong>{trips.length}</strong>
            </div>

            <div className="stat-card">
              <span className="feature-icon">
                <Heart />
              </span>
              <small>SAVED PLACES</small>
              <strong>{places.length}</strong>
            </div>

            <div className="stat-card">
              <span className="feature-icon">
                <Compass />
              </span>
              <small>ACCOUNT</small>
              <strong className="account-status">Active</strong>
            </div>

          </div>

          {error && <div className="error-note">{error}</div>}

          {/* SAVED TRIPS */}

          <section className="content-section">

            <div className="section-heading">

              <div>
                <div className="eyebrow">YOUR ITINERARIES</div>
                <h2>Recent saved trips</h2>
              </div>

              <Link className="text-link" to="/saved">
                View all <ArrowRight size={16} />
              </Link>

            </div>

            {trips.length ? (
              <div className="saved-list">

                {trips.slice(0, 5).map((t) => (
                  <div className="saved-card" key={t.id}>

                    <div className="saved-icon">
                      <Bookmark />
                    </div>

                    <div>
                      <h3>{t.title}</h3>

                      <p>
                        <MapPin size={14} />
                        {t.city}
                        <span>·</span>
                        <Clock size={14} />
                        {t.days} days
                      </p>
                    </div>

                    <b>{money(t.budget)}</b>

                  </div>
                ))}

              </div>
            ) : (
              <div className="empty-state">
                No saved trips yet.
                <Link to="/planner">
                  Create your first itinerary <ArrowRight size={14} />
                </Link>
              </div>
            )}

          </section>


          {/* SAVED PLACES */}

          <section className="content-section">

            <div className="section-heading">

              <div>
                <div className="eyebrow">BOOKMARKED DISCOVERIES</div>
                <h2>Saved places</h2>
              </div>

              <Link className="text-link" to="/explore">
                Explore places <ArrowRight size={16} />
              </Link>

            </div>

            {places.length ? (
              <div className="saved-list">

                {places.map((p) => (
                  <div className="saved-card" key={p.id}>

                    <div className="saved-icon">
                      <MapPin />
                    </div>

                    <div>
                      <h3>{p.place_name}</h3>

                      <p>
                        {p.city}
                        {p.category ? ` · ${p.category}` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => removePlace(p.id)}
                    >
                      Remove
                    </button>

                  </div>
                ))}

              </div>
            ) : (
              <div className="empty-state">
                Your saved places will appear here.
                <Link to="/explore">
                  Explore places <ArrowRight size={14} />
                </Link>
              </div>
            )}

          </section>
        </>
      )}

    </div>
  );
}


// =====================================================
// LOGIN / REGISTER
// =====================================================

function Auth({ mode, setUser }) {
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      const r = await api.post(
        mode === 'register'
          ? '/auth/register'
          : '/auth/login',

        mode === 'register'
          ? {
              full_name: name.trim(),
              email: email.trim().toLowerCase(),
              password
            }
          : {
              email: email.trim().toLowerCase(),
              password
            }
      );

      localStorage.setItem(
        'ee_token',
        r.data.access_token
      );

      setUser(r.data.user);
      nav('/');

    } catch (e) {
      setError(
        e.response?.data?.detail ||
        (e.response
          ? 'Sign in failed. Please check your email and password.'
          : 'Cannot connect to the ExploreEase server. Please try again shortly.')
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">

      <div className="auth-card">

        <Link to="/" className="brand auth-brand">

          <img className="brand-logo" src="/exploreease-logo.svg" alt="ExploreEase logo" />

          <span>
            explore<span className="brand-light">ease</span>
          </span>

        </Link>

        <div className="eyebrow">
          WELCOME {mode === 'register' ? 'ABOARD' : 'BACK'}
        </div>

        <h1>
          {mode === 'register'
            ? 'Start your story.'
            : 'Good to see you.'}
        </h1>

        <p>
          {mode === 'register'
            ? 'Create an account to save places and trips.'
            : 'Sign in to continue planning your next escape.'}
        </p>

        <form onSubmit={submit}>

          {mode === 'register' && (
            <label>
              Full name

              <input
                required
                minLength="2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </label>
          )}

          <label>
            Email address

            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password

            <input
              required
              minLength={mode === 'register' ? 8 : 1}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === 'register'
                  ? 'At least 8 characters'
                  : 'Your password'
              }
            />
          </label>

          {error && <div className="error-note">{error}</div>}

          <button
            className="primary-button full"
            disabled={busy}
          >
            {busy
              ? 'Please wait…'
              : mode === 'register'
                ? 'Create account'
                : 'Sign in'}

            <ArrowRight size={17} />
          </button>

        </form>

        <div className="auth-switch">
          {mode === 'register'
            ? 'Already have an account?'
            : 'New to ExploreEase?'}

          {' '}

          <Link to={mode === 'register' ? '/login' : '/register'}>
            {mode === 'register' ? 'Sign in' : 'Create account'}
          </Link>
        </div>

        <Link className="back-home" to="/">
          ← Back to exploring
        </Link>

      </div>

    </div>
  );
}


// =====================================================
// MAIN APP
// =====================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(
    () => Boolean(localStorage.getItem('ee_token'))
  );

  useEffect(() => {
    const token = localStorage.getItem('ee_token');
    if (!token) return;

    api.get('/auth/me')
      .then((response) => setUser(response.data))
      .catch((error) => {
        // Only discard a token when the API confirms it is invalid.
        // A cold start or temporary network failure must not sign the user out.
        if ([401, 403].includes(error.response?.status)) {
          localStorage.removeItem('ee_token');
        }
      })
      .finally(() => setAuthLoading(false));
  }, []);

  if (authLoading) {
    return (
      <div className="auth-restoring">
        <img src="/exploreease-logo.svg" alt="ExploreEase" />
        <span>Restoring your session…</span>
      </div>
    );
  }

  return (
    <Routes>

      <Route
        path="/login"
        element={
          <Auth
            mode="login"
            setUser={setUser}
          />
        }
      />

      <Route
        path="/register"
        element={
          <Auth
            mode="register"
            setUser={setUser}
          />
        }
      />

      <Route
        path="*"
        element={
          <Shell user={user} setUser={setUser}>

            <Routes>

              <Route path="/" element={<Home />} />

              <Route path="/explore" element={<Explore />} />

              <Route
                path="/place/:name"
                element={<PlaceDetail />}
              />

              <Route
                path="/recommendations"
                element={<Recommendations />}
              />

              <Route path="/food" element={<Food />} />

              <Route
                path="/planner"
                element={<Planner user={user} />}
              />

              <Route
                path="/saved"
                element={<Saved user={user} />}
              />

              <Route
                path="/dashboard"
                element={<Dashboard user={user} />}
              />

            </Routes>

          </Shell>
        }
      />

    </Routes>
  );
}
