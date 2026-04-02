import { useState, useEffect } from "react";

function MessagesPage({ currentUser }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        fetch(`/api/messages/?receiver=${currentUser.username}`,
             { credentials: "include" })
             .then(res => res.json())
             .then(data => setMessages(data))
             .finally(() => setLoading(false));
    }, [currentUser]);

    if (!currentUser) {
        return (
            <div style={s.page}>
                <h1 style={s.title}>My Messages</h1>
                <p style={s.noResults}>Log in to view your messages</p>
            </div>
        )
    }

    if (loading) {
        return <p style={s.loading}>Loading Messages...</p>
    }

    if (messages.length === 0) {
        return (
            <div style={s.page}>
                <h1 style={s.title}>My Messages</h1>
                <p style={s.cardDescription}>No Messages</p>
            </div>
        )
    }

    return (
        <div style={s.page}>
            <h1 style={s.title}>My Messages</h1>
            <div style={s.results}>
                {messages.map(message => (
                    <div key={message.id} style={s.messageCard}>
                        <h3 style={s.sender}>From: {message.sender.username}</h3>
                        <p style={s.body}>{message.body}</p>
                        <p style={s.timestamp}>{new Date(message.created_at).toLocaleString()}</p>
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
  messageCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "transform 0.2s",
    cursor: "default",
  },
  sender: {
    fontWeight: "600",
    marginBottom: "8px",
  },
  cardDescription: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    color: "#444",
  },
  body: {
    fontSize: "14px",
    color: "#444",
    marginBottom: "12px",
  },
  timestamp: {
    fontSize: "12px",
    color: "#888",
    textAlign: "right",
  },
  noResults: {
    fontSize: "16px",
    color: "#666",
  },
};

export default MessagesPage;