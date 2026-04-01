import { useState, useEffect } from "react";

function Dashboard({ onSelectService }) {
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/services/")
        .then(res => res.json())
        .then(data => setServices(data))
        .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p style={s.loading}>Loading Dashboard...</p>
    }

    if (services.length === 0) {
        return (
            <div style={s.page}>
                <h1 style={s.title}>Dashboard</h1>
                <p style={s.noResults}>No Services Found</p>
            </div>
        )
    }
    

    return(
        <div style={s.page}>
            <h1 style={s.title}>Dashboard</h1>
            <div style={s.results}>
                {services.map(service => (
                    <div key={service.id} style={s.card} onClick={() => onSelectService(service.id)}>
                        <h3 style={s.cardTitle}>{service.title}</h3>
                        <p style={s.cardDescription}>{service.description}</p>
                        <p style={s.cardCategory}>Category: {service.category}</p>
                        <p style={s.cardPrice}>${service.price}</p>
                    </div>
                    ))}
            </div>
        </div>
    )
}

const s = {
  page: {
    padding: "32px",
    fontFamily: "'Poppins', sans-serif",
    background: "#f7f6ff",
    minHeight: "100%",
  },
  loading: {
    fontSize: "16px",
    color: "#666",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#0f0620",
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
  cardCategory: {
    fontSize: "13px",
    color: "#888",
    marginBottom: "4px",
  },
  cardPrice: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f0620",
  },
  noResults: {
    fontSize: "16px",
    color: "#666",
  },
};

export default Dashboard;