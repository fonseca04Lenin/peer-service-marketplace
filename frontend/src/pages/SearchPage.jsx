import { useState, useEffect } from "react";

function SearchPage({onSelectService}) {
    const [services, setServices] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);


    // CHANGE THE FETCH ADDRESS TO WHAT IS NEEDED
    useEffect(() => {
      setLoading(true);
      fetch("http://127.0.0.1:8000/api/services/")
      .then(res => res.json())
      .then(data => setServices(data))
      .finally(() => setLoading(false));
    }, []);

    if (loading){
      return <p style={s.noResults}>Loading services...</p>;
    }
    const filteredServices = services.filter(service => service.title?.toLowerCase().includes(query.toLowerCase()));

    return (
    <div style={s.page}>
      <h1 style={s.title}>Search Services</h1>

      <input
        type="text"
        placeholder="Search Services"
        value={query}
        onChange={(i) => setQuery(i.target.value)}
        style={s.input}
      />
      <div style={s.results}>
        {filteredServices.map(service => (
          <div key={service.id} style={s.card} onClick={() => onSelectService(service.id)}>
              <h3 style={s.cardTitle}>{service.title}</h3>
              <p style={s.cardDescription}>{service.description}</p>
          </div>
        ))}
        {filteredServices.length === 0 && <p style={s.noResults}>No services found</p>}
      </div>
    </div>
  );
}

const s = {
  page: {
    padding: "32px",
    fontFamily: "'Poppins', sans-serif",
    background: "#f7f6ff",
    minHeight: "100%",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#0f0620",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "24px",
    outline: "none",
  },
  results: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "transform 0.2s",
    cursor: "pointer",
  },
  cardTitle: {
    margin: "0 0 12px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f0620",
  },
  cardDescription: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    color: "#444",
  },
  cardLink: {
    textDecoration: "none",
    color: "inherit",
  },
  noResults: {
    fontSize: "16px",
    color: "#666",
  },
};

export default SearchPage;
