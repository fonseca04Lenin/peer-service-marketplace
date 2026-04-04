import { useState, useEffect } from "react";

const MOCK_USER = { name: "Lenin Fonseca", initials: "LF" };

const MOCK_BOOKINGS = [
  { id: 1, service: "Logo Design",   person: "Sarah K.", date: "Apr 3, 2026", time: "2:00 PM",  status: "confirmed" },
  { id: 2, service: "Web Dev Help",  person: "Mike R.",  date: "Apr 5, 2026", time: "10:00 AM", status: "pending"   },
  { id: 3, service: "Math Tutoring", person: "Jalen H.", date: "Apr 7, 2026", time: "4:30 PM",  status: "confirmed" },
];

const MOCK_MESSAGES = [
  { id: 1, from: "Sarah K.", initials: "SK", preview: "Hey, can we move the session to 3pm?", time: "10m ago", unread: true  },
  { id: 2, from: "Mike R.",  initials: "MR", preview: "Thanks for the help yesterday!",        time: "1h ago",  unread: false },
  { id: 3, from: "Brady S.", initials: "BS", preview: "When are you available this week?",      time: "3h ago",  unread: true  },
];

const MOCK_REQUESTS = [
  { id: 1, service: "Python Tutoring", from: "Kyle S.",   time: "30m ago", price: "$45" },
  { id: 2, service: "Logo Design",     from: "Hiromi N.", time: "2h ago",  price: "$80" },
];

const MOCK_REVIEWS = [
  { id: 1, from: "Brady S.", rating: 5, text: "Incredibly helpful, would book again!", service: "Web Dev Help"  },
  { id: 2, from: "Jalen H.", rating: 4, text: "Very patient and clear explanations.",  service: "Math Tutoring" },
];

const STATS = [
  { label: "Active Bookings",   value: "3"    },
  { label: "Pending Requests",  value: "2"    },
  { label: "Jobs Completed",    value: "14"   },
  { label: "Avg Rating",        value: "4.8"  },
];

const STATUS = {
  confirmed: { color: "#22c55e" },
  pending:   { color: "#f59e0b" },
  cancelled: { color: "#ef4444" },
};

function StatusChip({ status }) {
  const c = STATUS[status] || STATUS.pending;
  return (
    <span style={{ fontSize: "12px", fontWeight: "600", color: c.color }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Avatar({ initials, size = 34 }) {
  return (
    <div style={{ ...s.avatar, width: size, height: size, fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

function SectionCard({ title, action, actionLabel, children }) {
  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <span style={s.cardTitle}>{title}</span>
        {action && (
          <button style={s.textBtn} onClick={action}>{actionLabel}</button>
        )}
      </div>
      {children}
    </div>
  );
}

function Dashboard({ onSelectService, onNavigate, currentUser }) {
  const [services, setServices]         = useState([]);
  const [loadingServices, setLoading]   = useState(true);

  const user  = currentUser || MOCK_USER;
  const stats = STATS;

  useEffect(() => {
    fetch("/api/services/")
      .then(res => res.json())
      .then(data => setServices(data.slice(0, 4)))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.page}>

      <div style={s.header}>
        <h1 style={s.heading}>Welcome back, {user.name?.split(" ")[0] ?? user.first_name ?? user.username}</h1>
      </div>

      <div style={s.statsRow}>
        {stats.map((stat, i) => (
          <div key={stat.label} style={{ ...s.statCard, ...(i === 0 ? s.statCardPrimary : {}) }}>
            <p style={{ ...s.statValue, ...(i === 0 ? { color: "#fff" } : {}) }}>{stat.value}</p>
            <p style={{ ...s.statLabel, ...(i === 0 ? { color: "rgba(255,255,255,0.65)" } : {}) }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={s.grid}>

        <div style={s.col}>

          <SectionCard title="Upcoming Bookings" action={() => onNavigate?.("Bookings")} actionLabel="View all">
            <div style={s.itemList}>
              {MOCK_BOOKINGS.map(b => (
                <div key={b.id} style={s.row}>
                  <div>
                    <p style={s.itemTitle}>{b.service}</p>
                    <p style={s.itemSub}>{b.person}</p>
                  </div>
                  <div style={s.rowRight}>
                    <p style={s.itemDate}>{b.date} · {b.time}</p>
                    <StatusChip status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Pending Requests" action={null} actionLabel={null}>
            <div style={s.itemList}>
              {MOCK_REQUESTS.map(r => (
                <div key={r.id} style={s.row}>
                  <div>
                    <p style={s.itemTitle}>{r.service}</p>
                    <p style={s.itemSub}>From {r.from} · {r.time}</p>
                  </div>
                  <div style={s.rowRight}>
                    <p style={s.priceTag}>{r.price}</p>
                    <div style={s.btnGroup}>
                      <button style={s.btnPrimary}>Accept</button>
                      <button style={s.btnGhost}>Decline</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Reviews" action={() => onNavigate?.("Reviews")} actionLabel="View all">
            <div style={s.itemList}>
              {MOCK_REVIEWS.map(r => (
                <div key={r.id} style={s.reviewRow}>
                  <Avatar initials={r.from.split(" ").map(w => w[0]).join("")} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.reviewTop}>
                      <span style={s.itemTitle}>{r.from}</span>
                      <span style={s.reviewService}>{r.service}</span>
                    </div>
                    <p style={s.reviewStars}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                    <p style={s.reviewText}>{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>

        <div style={s.col}>

          <SectionCard title="Messages" action={() => onNavigate?.("Messages")} actionLabel="View all">
            <div style={s.itemList}>
              {MOCK_MESSAGES.map(m => (
                <div key={m.id} style={{ ...s.msgRow, ...(m.unread ? s.msgRowUnread : {}) }}>
                  <Avatar initials={m.initials} />
                  <div style={s.msgBody}>
                    <div style={s.msgMeta}>
                      <span style={{ ...s.itemTitle, ...(m.unread ? { color: "#0f0620" } : {}) }}>{m.from}</span>
                      <span style={s.msgTime}>{m.time}</span>
                    </div>
                    <p style={s.msgPreview}>{m.preview}</p>
                  </div>
                  {m.unread && <span style={s.unreadDot} />}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Discover Services" action={() => onNavigate?.("Search Services")} actionLabel="Browse all">
            {loadingServices ? (
              <p style={s.dimText}>Loading...</p>
            ) : services.length === 0 ? (
              <p style={s.dimText}>No services available.</p>
            ) : (
              <div style={s.serviceGrid}>
                {services.map(svc => (
                  <div key={svc.id} style={s.serviceCard} onClick={() => onSelectService?.(svc.id)}>
                    <p style={s.serviceTitle}>{svc.title}</p>
                    <p style={s.serviceCategory}>{svc.category}</p>
                    <p style={s.servicePrice}>${svc.price}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}

const PURPLE = "rgb(83, 58, 253)";
const DARK   = "#0f0620";

const s = {
  page: {
    padding: "36px 32px",
    fontFamily: "'Poppins', sans-serif",
    background: "#f7f6ff",
    minHeight: "100%",
    overflowY: "auto",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "28px",
  },
  label: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#a78bfa",
    margin: "0 0 6px",
  },
  heading: {
    fontSize: "22px",
    fontWeight: "700",
    color: DARK,
    margin: 0,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px",
    marginBottom: "28px",
  },
  statCard: {
    background: "white",
    borderRadius: "10px",
    padding: "18px 20px",
    border: "1px solid #ede9fe",
  },
  statCardPrimary: {
    background: PURPLE,
    border: "none",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: DARK,
    margin: "0 0 2px",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "11.5px",
    color: "#999",
    margin: 0,
    fontWeight: "500",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    alignItems: "start",
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #ede9fe",
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: DARK,
  },
  textBtn: {
    background: "none",
    border: "none",
    fontSize: "12px",
    color: PURPLE,
    fontWeight: "500",
    cursor: "pointer",
    padding: 0,
    fontFamily: "'Poppins', sans-serif",
  },
  itemList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f3f0ff",
  },
  rowRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "5px",
  },
  itemTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: DARK,
    margin: "0 0 2px",
  },
  itemSub: {
    fontSize: "11.5px",
    color: "#999",
    margin: 0,
    fontWeight: "400",
  },
  itemDate: {
    fontSize: "11.5px",
    color: "#888",
    margin: 0,
  },
  priceTag: {
    fontSize: "13px",
    fontWeight: "700",
    color: DARK,
    margin: 0,
  },
  btnGroup: {
    display: "flex",
    gap: "6px",
  },
  btnPrimary: {
    background: PURPLE,
    color: "white",
    border: "none",
    borderRadius: "7px",
    padding: "5px 12px",
    fontSize: "11.5px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  btnGhost: {
    background: "none",
    color: "#aaa",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    padding: "5px 12px",
    fontSize: "11.5px",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  msgRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #f3f0ff",
    cursor: "pointer",
    position: "relative",
  },
  msgRowUnread: {},
  msgBody: {
    flex: 1,
    minWidth: 0,
  },
  msgMeta: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "2px",
  },
  msgTime: {
    fontSize: "11px",
    color: "#bbb",
    fontWeight: "400",
  },
  msgPreview: {
    fontSize: "12px",
    color: "#aaa",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: PURPLE,
    flexShrink: 0,
  },
  avatar: {
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgb(83, 58, 253), #c4b5fd)",
    color: "white",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "'Poppins', sans-serif",
  },
  reviewRow: {
    display: "flex",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #f3f0ff",
  },
  reviewTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "2px",
  },
  reviewService: {
    fontSize: "11px",
    color: "#bbb",
    fontWeight: "400",
  },
  reviewStars: {
    color: "#f59e0b",
    fontSize: "12px",
    letterSpacing: "1px",
    margin: "2px 0 4px",
  },
  reviewText: {
    fontSize: "12.5px",
    color: "#666",
    margin: 0,
    lineHeight: 1.5,
  },
  serviceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  serviceCard: {
    padding: "14px",
    background: "#faf9ff",
    borderRadius: "9px",
    border: "1px solid #ede9fe",
    cursor: "pointer",
  },
  serviceTitle: {
    fontSize: "12.5px",
    fontWeight: "600",
    color: DARK,
    margin: "0 0 3px",
  },
  serviceCategory: {
    fontSize: "11px",
    color: "#bbb",
    margin: "0 0 8px",
  },
  servicePrice: {
    fontSize: "13px",
    fontWeight: "700",
    color: PURPLE,
    margin: 0,
  },
  dimText: {
    fontSize: "13px",
    color: "#bbb",
    margin: 0,
  },
};

export default Dashboard;
