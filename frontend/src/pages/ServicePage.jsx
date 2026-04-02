import { useState, useEffect } from "react";

function ServicePage( {id} ) {
    const [service, setService] = useState(null);

    // CHANGE THE FETCH ADDRESS TO WHAT IS NEEDED
    useEffect(() => {
        fetch(`/api/services/${id}/`)
        .then(res => res.json())
        .then(data => setService(data));
    }, [id]);

    if (!service) return <p>Loading</p>

    return (
        <div style={s.page}>
            <div style={s.card}>
                <h1 style={s.cardTitle}>{service.title}</h1>
                <p style={s.cardDescription}>{service.description}</p>
                <p style={s.info}>Category: {service.category}</p>
                <p style={s.info}>Price: ${service.price}</p>
                <p style={s.info}>Provider: ${service.provider}</p>
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
  card: {
    background: "white",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    maxWidth: "600px",
    margin: "0 auto",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#0f0620",
  },
  cardDescription: {
    fontSize: "16px",
    color: "#444",
    marginBottom: "16px",
  },
  info: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "8px",
  },
  loading: {
    fontSize: "16px",
    color: "#666",
    textAlign: "center",
    marginTop: "32px",
  },
};

export default ServicePage;