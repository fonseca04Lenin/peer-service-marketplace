import { useState, useEffect } from "react";
import { colors } from "../constants";
import { apiFetch } from "../api";

function ReviewsPage({ currentUser }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("written");

    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);
        apiFetch(`/reviews/?filter=${activeTab}`)
            .then(res => res.json())
            .then(data => setReviews(Array.isArray(data) ? data : data.results || []))
            .catch(() => setReviews([]))
            .finally(() => setLoading(false));
    }, [currentUser, activeTab]);

    if (!currentUser) {
        return (
            <div style={s.page}>
                <h1 style={s.title}>My Reviews</h1>
                <p style={s.noResults}>Log in to view your reviews</p>
            </div>
        );
    }

    return (
        <div style={s.page}>
            <h1 style={s.title}>My Reviews</h1>

            <div style={s.howTo}>
                <span style={s.howToIcon}>💡</span>
                <p style={s.howToText}>
                    To leave a review, go to <strong>Bookings</strong> and find a completed job — a "Leave a review" button will appear there.
                </p>
            </div>

            <div style={s.tabs}>
                <button
                    style={activeTab === "written" ? s.tabActive : s.tab}
                    onClick={() => setActiveTab("written")}
                >
                    Reviews I've Written
                </button>
                <button
                    style={activeTab === "about" ? s.tabActive : s.tab}
                    onClick={() => setActiveTab("about")}
                >
                    Reviews About Me
                </button>
            </div>

            {loading ? (
                <p style={s.loading}>Loading reviews...</p>
            ) : reviews.length === 0 ? (
                <p style={s.noResults}>No reviews here yet.</p>
            ) : (
                <div style={s.results}>
                    {reviews.map(review => (
                        <div key={review.id} style={s.card}>
                            <p style={s.cardService}>{review.service_title}</p>
                            <p style={s.cardMeta}>
                                {activeTab === "written"
                                    ? `Provider: ${review.provider_username}`
                                    : `From: ${review.reviewer_username}`}
                            </p>
                            <p style={s.cardRating}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                            {review.comment && <p style={s.cardDescription}>{review.comment}</p>}
                            <p style={s.cardDate}>{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
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
    },
    title: {
        fontSize: "28px",
        fontWeight: "700",
        marginBottom: "24px",
        color: colors.dark,
    },
    tabs: {
        display: "flex",
        gap: "12px",
        marginBottom: "24px",
    },
    tab: {
        padding: "8px 20px",
        borderRadius: "6px",
        border: "2px solid #ccc",
        background: "white",
        cursor: "pointer",
        fontSize: "14px",
        color: "#666",
    },
    tabActive: {
        padding: "8px 20px",
        borderRadius: "6px",
        border: "2px solid #6c47ff",
        background: "#6c47ff",
        cursor: "pointer",
        fontSize: "14px",
        color: "white",
        fontWeight: "600",
    },
    loading: { fontSize: "16px", color: "#666" },
    noResults: { fontSize: "16px", color: "#666" },
    results: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px",
    },
    card: {
        background: "white",
        padding: "20px",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    },
    cardService: {
        margin: "0 0 4px 0",
        fontSize: "16px",
        fontWeight: "600",
        color: colors.dark,
    },
    cardMeta: {
        fontSize: "13px",
        color: "#888",
        marginBottom: "8px",
    },
    cardRating: {
        fontSize: "18px",
        color: "#f5a623",
        marginBottom: "8px",
    },
    cardDescription: {
        margin: "0 0 8px 0",
        fontSize: "14px",
        color: "#444",
    },
    cardDate: {
        fontSize: "12px",
        color: "#aaa",
    },
    howTo: {
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        background: "#fffbeb",
        border: "1px solid #fde68a",
        borderRadius: "6px",
        padding: "12px 16px",
        marginBottom: "20px",
    },
    howToIcon: {
        fontSize: "16px",
        flexShrink: 0,
        lineHeight: 1.4,
    },
    howToText: {
        fontSize: "13px",
        color: "#92400e",
        margin: 0,
        lineHeight: 1.6,
    },
};

export default ReviewsPage;