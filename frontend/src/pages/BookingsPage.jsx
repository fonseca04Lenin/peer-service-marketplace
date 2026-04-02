import { useState, useEffect } from "react";

import { getToken } from '../api';

function BookingsPage({ currentUser }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const token = getToken();
        fetch(`http://127.0.0.1:8000/api/bookings/?requester=${currentUser.username}`,
            { headers: token ? { Authorization: `Token ${token}` } : {} })
            .then(res => res.json())
            .then(data => setBookings(data))
            .finally(() => setLoading(false))
    }, [currentUser]);

    if (!currentUser) {
        return (
            <div style={s.page}>
                <h1 style={s.title}>My Bookings</h1>
                <p style={s.noResults}>Log in to view your bookings</p>
            </div>
        )
    }

    if (loading) {
        return <p style={s.loading}>Loading Bookings...</p>
    }

    if (bookings.length === 0) {
        return (
            <div style={s.page}>
                <h1 style={s.title}>My Bookings</h1>
                <p style={s.cardDescription}>No Bookings Services</p>
            </div>
        )
    }

    return (
        <div style={s.page}>
            <h1 style={s.title}>My Bookings</h1>
            <div style={s.results}>
                {bookings.map(booking => (
                    <div key={booking.id} style={s.card}>
                        <h3 style={s.cardTitle}>{booking.service.title}</h3>
                        <p style={s.cardDescription}>Provider: {booking.service.provider.username}</p>
                        <p style={s.cardCategory}>Scheduled: {new Date(booking.scheduled_at).toLocaleString()}</p>
                        <p style={s.cardPrice}>Status: {booking.status}</p>
                        {booking.notes && <p style={s.cardDescription}>Notes: {booking.notes}</p>}
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

export default BookingsPage;