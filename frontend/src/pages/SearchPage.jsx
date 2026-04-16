import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../api";
import { colors } from "../constants";
import ServicePage from "./ServicePage";
import CityAutocomplete from "../components/CityAutocomplete";
import { reverseGeocode } from "../utils/location";

const POPULAR_CATEGORIES = [
  { label: "Tutoring",     value: "tutoring",  color: colors.purple },
  { label: "Handyman",     value: "handyman",  color: "#7B1FA2" },
  { label: "Tech Help",    value: "tech",      color: colors.dark },
  { label: "Creative Work",value: "creative",  color: "#047857" },
  { label: "Home Care",    value: "home",      color: "#b45309" },
  { label: "Other",        value: "other",     color: "#6b7280" },
];

function SearchPage({ onSelectService, servicesRefreshKey = 0, currentUser, onNavigate }) {
  const [services,        setServices]        = useState([]);
  const [selectedId,      setSelectedId]      = useState(null);
  const [query,           setQuery]           = useState("");
  const [location,        setLocation]        = useState("");
  const [selLat,          setSelLat]          = useState(null);
  const [selLng,          setSelLng]          = useState(null);
  const [activeCategory,  setActiveCategory]  = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [geoStatus,       setGeoStatus]       = useState('idle');

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoStatus('granted');
        const { latitude, longitude } = pos.coords;
        setSelLat(latitude);
        setSelLng(longitude);
        try {
          const name = await reverseGeocode(latitude, longitude);
          if (name) setLocation(name);
        } catch {}
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim())   params.set("q",        query.trim());
      if (activeCategory) params.set("category", activeCategory);
      if (selLat !== null && selLng !== null) {
        params.set("user_lat", selLat);
        params.set("user_lng", selLng);
        if (location.trim()) params.set("location", location.trim());
      } else if (location.trim()) {
        params.set("location", location.trim());
      }
      const qs   = params.toString();
      const path = qs ? `/services/?${qs}` : "/services/";
      apiFetch(path)
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then(data => setServices(Array.isArray(data) ? data : []))
        .catch(() => setServices([]))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, location, selLat, selLng, activeCategory, servicesRefreshKey]);
  function toggleCategory(value) {
    setActiveCategory(prev => (prev === value ? null : value)) ;
  }

  const activeCategoryMeta = POPULAR_CATEGORIES.find(c => c.value === activeCategory);
  const showCategoryGrid = query.trim() === "";

  if (selectedId) {
    return (
      <ServicePage
        id={selectedId}
        currentUser={currentUser}
        onBack={() => setSelectedId(null)}
        onBooked={() => {
          setSelectedId(null);
          onNavigate?.("Bookings");
        }}
      />
    );
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Search Services</h1>

      <div style={s.searchRow}>
        <input
          type="text"
          placeholder="Search services..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ ...s.input, flex: 2 }}
        />
        <div style={{ flex: 1, position: 'relative' }}>
          <CityAutocomplete
            value={location}
            onSelect={(name, lat, lng) => {
              setLocation(name);
              setSelLat(lat);
              setSelLng(lng);
              setGeoStatus('idle');
            }}
            placeholder="City, State"
            inputStyle={{ ...s.input, width: '100%', boxSizing: 'border-box', paddingRight: geoStatus === 'requesting' ? '36px' : undefined }}
          />
          {geoStatus === 'requesting' && (
            <span style={s.geoSpinner} />
          )}
        </div>
      </div>

      {activeCategory && (
        <div style={s.activeCatRow}>
          <span style={s.activeCatLabel}>Category:</span>
          <span
            style={{
              ...s.activeCatChip,
              color:      activeCategoryMeta?.color || "#555",
              background: (activeCategoryMeta?.color || "#555") + "18",
              border:     `1px solid ${activeCategoryMeta?.color || "#ccc"}`,
            }}
          >
            {activeCategoryMeta?.label || activeCategory}
          </span>
          <button style={s.clearCat} onClick={() => setActiveCategory(null)}>
            ✕ clear
          </button>
        </div>
      )}

      {showCategoryGrid && (
        <div style={s.categoriesSection}>
          <p style={s.categoriesLabel}>Popular categories</p>
          <div style={s.categoriesGrid}>
            {POPULAR_CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  style={{
                    ...s.categoryChip,
                    color:      isActive ? "white"  : cat.color,
                    border:     `1.5px solid ${cat.color}`,
                    background: isActive ? cat.color : "white",
                  }}
                  onClick={() => toggleCategory(cat.value)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <p style={s.dim}>Loading services...</p>
      ) : (
        <div style={s.results}>
          {services.map(service => {
            const p = service.provider;
            return (
              <div
                key={service.id}
                style={s.card}
                onClick={() => setSelectedId(service.id)}
              >
                {p?.profile_picture && (
                  <img
                    src={p.profile_picture}
                    alt="provider"
                    style={s.avatar}
                  />
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: colors.dark }}>
                        {p?.first_name} {p?.last_name}
                      </span>
                      <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "8px" }}>
                        {p?.city}, {p?.country}
                      </span>
                    </div>
                    <div style={{ fontWeight: "700", fontSize: "16px", color: colors.accentIndigo, whiteSpace: "nowrap" }}>
                      ${service.price}<span style={{ fontSize: "12px", fontWeight: "500", color: "#aaa" }}>/hr</span>
                    </div>
                  </div>

                  <h3 style={s.cardTitle}>{service.title}</h3>

                  <p style={s.cardDescription}>
                    {service.description?.length > 220
                      ? service.description.slice(0, 220) + "..."
                      : service.description}
                  </p>

                  {p?.tagline && (
                    <p style={{ fontSize: "12px", color: "#999", margin: "0 0 10px", fontStyle: "italic" }}>
                      "{p.tagline}"
                    </p>
                  )}

                  <div style={s.cardMeta}>
                    {service.category && (
                      <span style={s.cardCategory}>{service.category}</span>
                    )}
                    {service.is_remote ? (
                      <span style={s.remoteBadge}>Remote</span>
                    ) : (
                      <span style={s.areaBadge}>{p?.city}, {p?.country}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {services.length === 0 && (
            <p style={s.dim}>
              {query.trim() || activeCategory || location.trim()
                ? "No services match your filters."
                : "No services listed yet. "}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    padding: "32px",
    fontFamily: "'Poppins', sans-serif",
    background: colors.pageBg,
    minHeight: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "20px",
    color: colors.dark,
  },
  searchRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  input: {
    padding: "12px 16px",
    fontSize: "14px",
    borderRadius: 0,
    border: `1px solid ${colors.border}`,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Poppins', sans-serif",
    color: colors.dark,
    background: "white",
    width: "100%",
  },

  activeCatRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  activeCatLabel: {
    fontSize: "12px",
    color: "#aaa",
  },
  activeCatChip: {
    fontSize: "11.5px",
    fontWeight: "600",
    padding: "3px 10px",
    borderRadius: 0,
  },
  clearCat: {
    background: "none",
    border: "none",
    fontSize: "11px",
    color: "#bbb",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    padding: "0",
  },

  categoriesSection: {
    marginBottom: "32px",
  },
  categoriesLabel: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#aaa",
    margin: "0 0 12px",
  },
  categoriesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  categoryChip: {
    padding: "8px 16px",
    borderRadius: "0",
    fontSize: "12.5px",
    fontWeight: "600",
    letterSpacing: "0.02em",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    transition: "background 0.15s, color 0.15s",
  },

  results: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  card: {
    background: "white",
    padding: "24px 28px",
    borderRadius: "4px",
    border: `1px solid ${colors.border}`,
    cursor: "pointer",
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: "15px",
    fontWeight: "600",
    color: colors.dark,
  },
  cardDescription: {
    margin: "0 0 10px",
    fontSize: "13px",
    color: "#666",
    lineHeight: 1.5,
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  cardCategory: {
    fontSize: "11.5px",
    color: "#aaa",
  },
  remoteBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: colors.purple,
    background: colors.purpleSoft,
    border: "1px solid #d4c8ff",
    borderRadius: 0,
    padding: "2px 8px",
  },
  areaBadge: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#555",
    background: "#f5f5f5",
    border: "1px solid #e0e0e0",
    borderRadius: 0,
    padding: "2px 8px",
  },
  dim: {
    fontSize: "13px",
    color: "#aaa",
  },
  geoSpinner: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "14px",
    height: "14px",
    border: "2px solid #dde3ea",
    borderTopColor: colors.purple,
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
    pointerEvents: "none",
  },
};

export default SearchPage;
