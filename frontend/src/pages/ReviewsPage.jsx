import { useState, useEffect } from "react";

function ReviewsPage({ currentUser }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        fetch(`/api/reviews/?reviewer=${currentUser.username}`,
            {credentials: "include"})
            .then(res => res.json())
            .then(data => setReviews(data))
            .finally(() => setLoading(false));
    }, [currentUser]);

    if (!currentUser) {
        return (
            <div style={s.page}>
                <h1 style={s.title}>My Reviews</h1>
                <p style={s.noResults}>Log in to view your reviews</p>
            </div>
        )
    }

    if (loading) {
        return <p style={s.loading}>Loading Reviews...</p>
    }

    if (reviews.length === 0) {
        return (
            <div style={s.page}>
                <h1 style={s.title}>My Reviews</h1>
                <p style={s.noResults}>No Reviews</p>
            </div>
        )
    }

    return (
        <div style={s.page}>
            <h1 style={s.title}>My Reviews</h1>
            <div style={s.results}>
                {reviews.map(review => (
                    <div key={review.id} style={s.card}>
                        <h3 style={s.cardTitle}>From: {review.booking.service.provider.username}</h3>
                        <p style={s.cardRating}>Rating: {review.rating}</p>
                        {review.comment && <p style={s.cardDescription}>{review.comment}</p>}
                        <p style={s.cardDate}>{new Date(review.created_at).toLocaleDateString()}</p>
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
    cursor: "default",
  },
  cardTitle: {
    margin: "0 0 12px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f0620",
  },
  cardRating: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f0620",
    marginBottom: "8px",
  },
  cardDescription: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    color: "#444",
  },
  cardDate: {
    fontSize: "12px",
    color: "#888",
  },
  noResults: {
    fontSize: "16px",
    color: "#666",
  },
};

export default ReviewsPage;