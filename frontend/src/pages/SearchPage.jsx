import { useState, useEffect } from "react";

const POPULAR_CATEGORIES = [
  { label: "Web Development",   color: "#C0143C" },
  { label: "Graphic Design",    color: "#9B1D6A" },
  { label: "Girlfriend",          color: "#B5192B" },
  { label: "Video Editing",     color: "#7B1FA2" },
  { label: "Photography",       color: "#C62828" },
  { label: "Writing",           color: "#AD1457" },
  { label: "Math Help",         color: "#8E0038" },
  { label: "Music Lessons",     color: "#6A1B9A" },
  { label: "Handyman",          color: "#B71C1C" },
  { label: "Moving Help",       color: "#880E4F" },
  { label: "Language Tutoring", color: "#A0196A" },
  { label: "Resume Review",     color: "#C2185B" },
  { label: "Gambler",          color: "#880E4F" },
];

function SearchPage({ onSelectService }) {
  const [services, setServices] = useState([]);
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/services/")
      .then(res => res.json())
      .then(data => setServices(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredServices = services.filter(service =>
    service.title?.toLowerCase().includes(query.toLowerCase())
  );

  const showCategories = query.trim() === "";

  return (
    <div style={s.page}>
      <h1 style={s.title}>Search Services</h1>

      <input
        type="text"
        placeholder="Search Services"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={s.input}
      />

      {showCategories && (
        <div style={s.categoriesSection}>
          <p style={s.categoriesLabel}>Popular categories</p>
          <div style={s.categoriesGrid}>
            {POPULAR_CATEGORIES.map(cat => (
              <button
                key={cat.label}
                style={{
                  ...s.categoryChip,
                  color: cat.color,
                  border: `1.5px solid ${cat.color}`,
                  background: "white",
                }}
                onClick={() => setQuery(cat.label)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p style={s.dim}>Loading services...</p>
      ) : (
        <div style={s.results}>
          {filteredServices.map(service => (
            <div key={service.id} style={s.card} onClick={() => onSelectService(service.id)}>
              <h3 style={s.cardTitle}>{service.title}</h3>
              <p style={s.cardDescription}>{service.description}</p>
              {service.category && <p style={s.cardCategory}>{service.category}</p>}
              {service.price && <p style={s.cardPrice}>${service.price}</p>}
            </div>
          ))}
          {filteredServices.length === 0 && (
            <p style={s.dim}>No services found for "{query}"</p>
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
    background: "#f7f6ff",
    minHeight: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#0f0620",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #ede9fe",
    marginBottom: "24px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Poppins', sans-serif",
    color: "#0f0620",
    background: "white",
  },

  // Categories
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
  },

  // Results
  results: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #ede9fe",
    cursor: "pointer",
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f0620",
  },
  cardDescription: {
    margin: "0 0 10px",
    fontSize: "13px",
    color: "#666",
    lineHeight: 1.5,
  },
  cardCategory: {
    fontSize: "11.5px",
    color: "#aaa",
    margin: "0 0 6px",
  },
  cardPrice: {
    fontSize: "14px",
    fontWeight: "700",
    color: "rgb(83, 58, 253)",
    margin: 0,
  },
  dim: {
    fontSize: "13px",
    color: "#aaa",
  },
};

export default SearchPage;
