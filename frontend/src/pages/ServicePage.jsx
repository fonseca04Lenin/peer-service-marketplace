import { useState, useEffect } from "react";

function ServicePage( {id, onBack} ) {
    const [service, setService] = useState(null);

    useEffect(() => {
        fetch(`/api/services/${id}/`)
        .then(res => res.json())
        .then(data => {
              console.log(data);
              setService(data);
            });
    }, [id]);

    if (!service) return <p>Loading</p>

    const p = service.provider;
    const skills = typeof p?.skills === "string"
      ? p.skills.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    return (
    <div style={s.page}>

      {onBack && (
        <button onClick={onBack} style={s.backBtn}>← Back to results</button>
      )}

      <div style={s.header}>
        <img
          src={p?.profile_picture}
          alt="provider"
          style={s.avatar}
        />
        <div>
          <h2 style={s.providerName}>{p?.first_name} {p?.last_name}</h2>
          <p style={s.tagline}>{p?.tagline}</p>
          <p style={s.location}>{p?.city}, {p?.country}</p>
        </div>
      </div>

      <div style={s.divider} />

      <div style={s.priceRow}>
        <h1 style={s.title}>{service.title}</h1>
        <div style={s.price}>${service.price}</div>
      </div>

      <div style={s.badges}>
        {service.category && <span style={s.catBadge}>{service.category}</span>}
        {service.is_remote
          ? <span style={s.remoteBadge}>Remote</span>
          : <span style={s.areaBadge}>{p?.city}, {p?.country}</span>}
        {service.created_at && (
          <span style={s.date}>
            Listed {new Date(service.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric"
            })}
          </span>
        )}
      </div>

      <p style={s.description}>{service.description}</p>

      <div style={s.divider} />

      <h3 style={s.sectionLabel}>About the provider</h3>
      <p style={s.bio}>{p?.bio || "No bio provided."}</p>

      {skills?.length > 0 && (
        <>
          <h3 style={s.sectionLabel}>Skills</h3>
          <div style={s.skillsWrap}>
            {skills.map(skill => (
              <span key={skill} style={s.skillChip}>{skill}</span>
            ))}
          </div>
        </>
      )}

      <div style={s.divider} />

      <button style={s.ctaBtn}>Contact {p?.first_name}</button>
      <button style={s.ctaBtn}>Schedule Booking with {p?.first_name}</button>


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
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#4a3aff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
    marginBottom: "24px",
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    marginBottom: "20px",
  },
  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  providerName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f0620",
    margin: "0 0 4px",
  },
  tagline: {
    fontSize: "13px",
    color: "#666",
    margin: "0 0 3px",
  },
  location: {
    fontSize: "12px",
    color: "#aaa",
    margin: 0,
  },
  divider: {
    height: "1px",
    background: "#ede9fe",
    margin: "20px 0",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "12px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f0620",
    margin: 0,
    flex: 1,
  },
  price: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#4a3aff",
    whiteSpace: "nowrap",
  },
  perHour: {
    fontSize: "13px",
    fontWeight: "400",
    color: "#aaa",
  },
  badges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: "16px",
  },
  catBadge: {
    fontSize: "11.5px",
    color: "#aaa",
  },
  remoteBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "rgb(83, 58, 253)",
    background: "#f0eeff",
    border: "1px solid #d4c8ff",
    borderRadius: "20px",
    padding: "2px 8px",
  },
  areaBadge: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#555",
    background: "#f5f5f5",
    border: "1px solid #e0e0e0",
    borderRadius: "20px",
    padding: "2px 8px",
  },
  date: {
    fontSize: "11px",
    color: "#bbb",
    marginLeft: "auto",
  },
  description: {
    fontSize: "14px",
    color: "#444",
    lineHeight: 1.7,
    margin: 0,
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#aaa",
    margin: "0 0 10px",
  },
  bio: {
    fontSize: "14px",
    color: "#444",
    lineHeight: 1.7,
    margin: "0 0 20px",
  },
  skillsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "4px",
  },
  skillChip: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#4a3aff",
    background: "#f0eeff",
    border: "1px solid #d4c8ff",
    borderRadius: "6px",
    padding: "4px 10px",
  },
  ctaBtn: {
    marginTop: "4px",
    padding: "14px 28px",
    background: "#4a3aff",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    width: "100%",
  },
};

export default ServicePage;