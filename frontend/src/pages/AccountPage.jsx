import { useState, useEffect } from "react";

function AccountPage( {username, onSelectService} ) {
    const [services, setServices] = useState([]);
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        //USERNAME
        fetch(`http://127.0.0.1:8000/api/users/${username}/`,
            { credentials: "include" }
        )
        .then(res => {
            if (!res.ok) throw new Error("User not found");
            return res.json();
        })
        .then(data => setUser(data));

        //SERVICES
        fetch(`http://127.0.0.1:8000/api/users/${username}/services/`,
            { credentials: "include" }
        )
        .then(res => res.json())
        .then(data => setServices(data))
        .finally(() => setLoading(false));

    }, [username] );

    if (loading) {
        return <p>Loading..</p>
    }

    if (user == null) {
        return (
            <div style={s.page}>
                <h1 style={s.title}>Profile Overview</h1>
                <p style={s.noResults}>User Not Logged In</p>
            </div>
        )
    }


    return (
        <div style={s.page}>
            <h1 style={s.title}>{user.username}</h1>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
                {user.profile_picture && (
                    <img
                        src={`http://127.0.0.1:8000${user.profile_picture}`}
                        alt={`${user.username}'s Profile`}
                        style={{ width: "100px", height: "100px", borderRadius: "50%", marginRight: "16px" }}
                        />
                )}
                <div>
                    <p><strong>Username: </strong> {user.username}</p>
                    <p><strong>Email: </strong> {user.email}</p>
                    <p><strong>Role: </strong> {user.role}</p>
                    {user.bio && (
                        <div>
                            <h3>Bio</h3>
                            <p>{user.bio}</p>
                        </div> 
                    )}
                </div>
            </div>

            <div style={s.walletCard}>
                <h2>Wallet Balance</h2>
                <p>${user.wallet_balance?.toFixed(2) ?? "0.00"}</p>
            </div>
            <h2>Services List</h2>
            {services.length === 0 ? (
                <p style={s.noServices}>No services listed yet.</p>
            ) : (
            <ul style={s.servicesGrid}>
                {services.map(service => (
                    <li key={service.id} style={{ marginBottom: "16px" }}>
                        <div style={s.serviceCard} onClick={() => onSelectService(service.id)}>
                            <h3 style={s.cardTitle}>{service.title}</h3>
                            <p style={s.cardDescription}>{service.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
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
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#0f0620",
  },
  walletCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    marginBottom: "24px",
    textAlign: "center",
  },
  servicesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  serviceCard: {
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
  noServices: {
    fontSize: "16px",
    color: "#666",
  },
  noResults: {
    fontSize: "16px",
    color: "#666",
  },
};

export default AccountPage;