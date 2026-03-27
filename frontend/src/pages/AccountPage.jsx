import { useState, useEffect } from "react";

function AccountPage( {username} ) {
    const [services, setServices] = useState([]);
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //USERNAME
        fetch(`http://127.0.0.1:8000/api/users/${username}/`,
            { credentials: "include" }
        )
        .then(res => res.json())
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

    return (
        <div>
            <h1>{user.username}</h1>
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

            <div style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
                backgroundColor: "#f9f9f9",
                textAlign: "center"
                }}>
                <h2>Wallet Balance</h2>
                <p>${user.wallet_balance.toFixed(2)}</p>
            </div>
            <h2>Services List</h2>
            {services.length === 0 ? (
                <p>No services listed yet.</p>
            ) : (
            <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                {services.map(service => (
                    <li key={service.id} style={{ marginBottom: "16px" }}>
                        <a href={`/services/${service.id}`}>
                            <h3>{service.title}</h3>
                        </a>
                        <p>{service.description}</p>
                    </li>
                ))}
            </ul>
            )}
        </div>
    );

}

export default AccountPage;