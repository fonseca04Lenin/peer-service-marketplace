import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import { colors, CATEGORY_LABELS } from "../constants";

const STATUS_COLOR = {
  confirmed: "#22c55e",
  pending:   "#f59e0b",
  completed: "#a78bfa",
  cancelled: "#ef4444",
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatusChip({ status }) {
  const color = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return (
    <span style={{ fontSize: "11px", fontWeight: "600", color, background: color + "18", padding: "2px 8px", borderRadius: 0 }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Avatar({ name = "", src, size = 34 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ ...s.avatar, width: size, height: size, objectFit: "cover" }}
      />
    );
  }
  return (
    <div style={{ ...s.avatar, width: size, height: size, fontSize: size * 0.32 }}>
      {initials(name)}
    </div>
  );
}

function Dashboard({ onSelectService, onNavigate, onStartOnboarding, currentUser, servicesRefreshKey = 0 }) {
  const [bookings,      setBookings]      = useState([]);
  const [messages,      setMessages]      = useState([]);
  const [reviews,       setReviews]       = useState([]);
  const [services,      setServices]      = useState([]);
  const [myServices,    setMyServices]    = useState([]);
  const [selectedSvcId, setSelectedSvcId] = useState(null);
  const [showAllSvcs,   setShowAllSvcs]   = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  const [loading, setLoading] = useState({
    bookings: true, messages: true, reviews: true, services: true, myServices: true,
  });

  useEffect(() => {
    const uid = currentUser?.id ?? currentUser?.pk;
    let cancelled = false;

    apiFetch("/bookings/")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (!cancelled) setBookings(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setBookings([]); })
      .finally(() => { if (!cancelled) setLoading(p => ({ ...p, bookings: false })); });

    apiFetch("/messaging/")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (!cancelled) setMessages(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setMessages([]); })
      .finally(() => { if (!cancelled) setLoading(p => ({ ...p, messages: false })); });

    apiFetch("/reviews/")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (!cancelled) setReviews(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setReviews([]); })
      .finally(() => { if (!cancelled) setLoading(p => ({ ...p, reviews: false })); });

    apiFetch("/services/")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (!cancelled) setServices(Array.isArray(data) ? data.slice(0, 3) : []); })
      .catch(() => { if (!cancelled) setServices([]); })
      .finally(() => { if (!cancelled) setLoading(p => ({ ...p, services: false })); });

    if (uid != null) {
      apiFetch(`/services/?provider=${encodeURIComponent(String(uid))}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (!cancelled) setMyServices(Array.isArray(data) ? data : []); })
        .catch(() => { if (!cancelled) setMyServices([]); })
        .finally(() => { if (!cancelled) setLoading(p => ({ ...p, myServices: false })); });
    } else {
      setMyServices([]);
      setLoading(p => ({ ...p, myServices: false }));
    }

    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.pk, servicesRefreshKey]);

  async function deleteService(id) {
    setDeletingId(id);
    try {
      const res = await apiFetch(`/services/${id}/delete/`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setMyServices(prev => prev.filter(sv => sv.id !== id));
        setSelectedSvcId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  const activeBookings  = bookings.filter(b => b.status === "confirmed").length;
  const pendingRequests = bookings.filter(b => b.status === "pending").length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending");
  const pendingBookings  = bookings.filter(b => b.status === "pending");

  const firstName = currentUser?.first_name || currentUser?.username || "there";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const stats = [
    { label: "listings",  value: myServices.filter(sv => sv.is_active).length },
    { label: "confirmed", value: activeBookings },
    { label: "pending",   value: pendingRequests },
    ...(avgRating ? [{ label: "avg rating", value: `${avgRating}★` }] : []),
  ];

  return (
    <div style={s.page}>

      <div style={s.header}>
        <div>
          <h1 style={s.greeting}>{getGreeting()}, {firstName}.</h1>
          <p style={s.date}>{today}</p>
        </div>

        <div style={s.statTape}>
          {stats.map((stat, i) => (
            <div key={stat.label} style={s.statItem}>
              {i > 0 && <span style={s.statSep}>·</span>}
              <span style={s.statVal}>{stat.value}</span>
              <span style={s.statLbl}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={s.grid}>

        <div style={s.leftCol}>

          <div style={s.section}>
            <div style={s.sectionHead}>
              <span style={s.sectionTitle}>My Services</span>
              <button style={s.linkBtn} onClick={() => onStartOnboarding?.()}>+ new listing</button>
            </div>
            {loading.myServices ? (
              <p style={s.muted}>Loading…</p>
            ) : myServices.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={s.muted}>No listings yet.</p>
                <button style={s.btnPrimary} onClick={() => onStartOnboarding?.()}>
                  Post your first service
                </button>
              </div>
            ) : (
              <>
                {(showAllSvcs ? myServices : myServices.slice(0, 5)).map(svc => {
                  const isSelected = selectedSvcId === svc.id;
                  return (
                    <div key={svc.id}>
                      {isSelected && (
                        <div style={s.deleteBar}>
                          <span style={s.deleteBarLabel}>Delete this listing?</span>
                          <button
                            style={s.deleteBtn}
                            onClick={() => deleteService(svc.id)}
                            disabled={deletingId === svc.id}
                          >
                            {deletingId === svc.id ? "Deleting…" : "Delete"}
                          </button>
                          <button style={s.cancelDeleteBtn} onClick={() => setSelectedSvcId(null)}>
                            Cancel
                          </button>
                        </div>
                      )}
                      <div style={{ ...s.row, ...(isSelected ? s.rowSelected : {}) }}>
                        <div
                          style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                          onClick={() => onSelectService?.(svc.id)}
                        >
                          <p style={s.rowTitle}>{svc.title}</p>
                          <p style={s.rowSub}>{CATEGORY_LABELS[svc.category] || svc.category}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: colors.purple }}>${svc.price}</span>
                          <span style={{
                            fontSize: "10px", fontWeight: "600", letterSpacing: "0.03em",
                            color: svc.is_active ? "#22c55e" : "#ccc",
                            background: svc.is_active ? "#f0fdf4" : "#f5f5f5",
                            padding: "2px 7px", borderRadius: 0,
                          }}>
                            {svc.is_active ? "live" : "off"}
                          </span>
                          <button
                            style={s.closeBtn}
                            onClick={() => setSelectedSvcId(isSelected ? null : svc.id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {myServices.length > 5 && (
                  <button style={s.showMoreBtn} onClick={() => setShowAllSvcs(p => !p)}>
                    {showAllSvcs ? "show less" : `+${myServices.length - 5} more`}
                  </button>
                )}
              </>
            )}
          </div>

          <div style={s.bookingPair}>
            <div style={{ ...s.section, flex: 1, minWidth: 0 }}>
              <div style={s.sectionHead}>
                <span style={s.sectionTitle}>Upcoming</span>
                <button style={s.linkBtn} onClick={() => onNavigate?.("Bookings")}>all</button>
              </div>
              {loading.bookings ? (
                <p style={s.muted}>Loading…</p>
              ) : upcomingBookings.length === 0 ? (
                <p style={s.muted}>Nothing scheduled.</p>
              ) : (
                upcomingBookings.slice(0, 3).map(b => {
                  const d = new Date(b.scheduled_at);
                  const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                  const person = b.viewer_role === 'provider'
                    ? (`${b.requester?.first_name || ''} ${b.requester?.last_name || ''}`.trim() || b.requester?.username || '—')
                    : (b.service?.provider_name || '—');
                  return (
                    <div key={b.id} style={s.row}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={s.rowTitle}>{b.service?.title ?? "Service"}</p>
                        <p style={s.rowSub}>{person} · {dateStr}</p>
                      </div>
                      <StatusChip status={b.status} />
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ ...s.section, flex: 1, minWidth: 0 }}>
              <div style={s.sectionHead}>
                <span style={s.sectionTitle}>Pending</span>
                <button style={s.linkBtn} onClick={() => onNavigate?.("Bookings")}>manage</button>
              </div>
              {loading.bookings ? (
                <p style={s.muted}>Loading…</p>
              ) : pendingBookings.length === 0 ? (
                <p style={s.muted}>None waiting.</p>
              ) : (
                pendingBookings.slice(0, 3).map(b => {
                  const from = b.requester
                    ? `${b.requester.first_name} ${b.requester.last_name ?? ""}`.trim()
                    : "Someone";
                  return (
                    <div key={b.id} style={{ ...s.row, cursor: "pointer" }} onClick={() => onNavigate?.("Bookings")}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={s.rowTitle}>{b.service?.title ?? "Service"}</p>
                        <p style={s.rowSub}>from {from}</p>
                      </div>
                      {b.service?.price != null && (
                        <span style={{ fontSize: "12.5px", fontWeight: "700", color: colors.dark, flexShrink: 0 }}>
                          ${b.service.price}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={s.section}>
            <div style={s.sectionHead}>
              <span style={s.sectionTitle}>Reviews</span>
              {reviews.length > 0 && (
                <button style={s.linkBtn} onClick={() => onNavigate?.("Reviews")}>see all</button>
              )}
            </div>
            {loading.reviews ? (
              <p style={s.muted}>Loading…</p>
            ) : reviews.length === 0 ? (
              <p style={s.muted}>No reviews yet — they'll show up here.</p>
            ) : (
              reviews.slice(0, 2).map(r => {
                const reviewer = r.reviewer ?? r.booking?.requester;
                const name = reviewer
                  ? `${reviewer.first_name} ${reviewer.last_name ?? ""}`.trim()
                  : "Anonymous";
                const serviceName = r.service?.title ?? r.booking?.service?.title ?? "";
                return (
                  <div key={r.id} style={{ ...s.row, alignItems: "flex-start", gap: "10px" }}>
                    <Avatar name={name} src={reviewer?.profile_picture} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: "600", color: colors.dark }}>{name}</span>
                        <span style={{ color: "#f59e0b", fontSize: "11px", letterSpacing: "0.5px" }}>
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </span>
                      </div>
                      {serviceName && (
                        <p style={{ fontSize: "10.5px", color: "#bbb", margin: "0 0 3px" }}>{serviceName}</p>
                      )}
                      {r.comment && (
                        <p style={{ fontSize: "12px", color: "#666", margin: 0, lineHeight: 1.5 }}>{r.comment}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        <div style={s.rightCol}>

          <div style={s.section}>
            <div style={s.sectionHead}>
              <span style={s.sectionTitle}>Messages</span>
              <button style={s.linkBtn} onClick={() => onNavigate?.("Messages")}>view all</button>
            </div>
            {loading.messages ? (
              <p style={s.muted}>Loading…</p>
            ) : messages.length === 0 ? (
              <p style={s.muted}>No messages yet.</p>
            ) : (
              messages.slice(0, 5).map(c => {
                const u      = c.other_user;
                const last   = c.last_message;
                const name   = u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username : "Unknown";
                const unread = c.unread_count > 0;
                return (
                  <div key={u?.id} style={{ ...s.row, gap: "10px", cursor: "pointer" }} onClick={() => onNavigate?.("Messages")}>
                    <Avatar name={name} src={u?.profile_picture} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: unread ? "700" : "600", color: colors.dark }}>
                          {name}
                        </span>
                        <span style={{ fontSize: "10.5px", color: "#ccc" }}>{formatTimeAgo(last?.created_at)}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: unread ? "#555" : "#bbb", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {last?.body || ""}
                      </p>
                    </div>
                    {unread && <span style={s.unreadDot} />}
                  </div>
                );
              })
            )}
          </div>

          <div style={s.section}>
            <div style={s.sectionHead}>
              <span style={s.sectionTitle}>Discover</span>
              <button style={s.linkBtn} onClick={() => onNavigate?.("Search Services")}>browse all</button>
            </div>
            {loading.services ? (
              <p style={s.muted}>Loading…</p>
            ) : services.length === 0 ? (
              <p style={s.muted}>No services listed yet.</p>
            ) : (
              services.map(svc => {
                const p = svc.provider;
                const providerName = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "—";
                return (
                  <div key={svc.id} style={{ ...s.row, gap: "10px", cursor: "pointer" }} onClick={() => onSelectService?.(svc.id)}>
                    <Avatar name={providerName} src={p?.profile_picture} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12.5px", fontWeight: "600", color: colors.dark, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {svc.title}
                      </p>
                      <p style={{ fontSize: "11px", color: "#bbb", margin: 0 }}>{CATEGORY_LABELS[svc.category] || svc.category}</p>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: colors.purple, flexShrink: 0 }}>
                      ${svc.price}
                    </span>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    padding: "36px 32px",
    fontFamily: "'Poppins', sans-serif",
    background: colors.pageBg,
    minHeight: "100%",
    overflowY: "auto",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: "28px",
    gap: "16px",
    flexWrap: "wrap",
  },
  greeting: {
    fontSize: "24px",
    fontWeight: "800",
    color: colors.dark,
    margin: "0 0 4px",
    letterSpacing: "-0.4px",
  },
  date: {
    fontSize: "12px",
    color: colors.muted,
    margin: 0,
    fontWeight: "400",
  },
  statTape: {
    display: "flex",
    alignItems: "center",
    background: "white",
    border: `1px solid ${colors.border}`,
    borderRadius: "4px",
    padding: "10px 18px",
    flexShrink: 0,
    gap: "4px",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "0 8px",
  },
  statSep: {
    color: "#ddd",
    fontSize: "16px",
    marginRight: "8px",
    lineHeight: 1,
  },
  statVal: {
    fontSize: "14px",
    fontWeight: "700",
    color: colors.dark,
  },
  statLbl: {
    fontSize: "11px",
    color: colors.muted,
    marginLeft: "2px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "3fr 2fr",
    gap: "14px",
    alignItems: "start",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  section: {
    background: "white",
    borderRadius: "4px",
    padding: "18px 20px",
    border: `1px solid ${colors.border}`,
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: colors.dark,
  },
  linkBtn: {
    background: "none",
    border: "none",
    fontSize: "11.5px",
    color: colors.muted,
    cursor: "pointer",
    padding: 0,
    fontFamily: "'Poppins', sans-serif",
    fontWeight: "500",
  },
  muted: {
    fontSize: "12.5px",
    color: colors.muted,
    margin: 0,
  },
  btnPrimary: {
    background: colors.purple,
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    display: "inline-block",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 0",
    borderBottom: `1px solid ${colors.rowLine}`,
    gap: "8px",
  },
  rowSelected: {
    background: "#fdf9ff",
  },
  rowTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: colors.dark,
    margin: "0 0 1px",
  },
  rowSub: {
    fontSize: "11px",
    color: colors.muted,
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "#ccc",
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    fontFamily: "system-ui, sans-serif",
  },
  showMoreBtn: {
    marginTop: "6px",
    background: "none",
    border: "none",
    color: colors.muted,
    fontSize: "11.5px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "4px 0",
    fontFamily: "'Poppins', sans-serif",
  },
  bookingPair: {
    display: "flex",
    gap: "14px",
  },
  deleteBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    borderRadius: "6px",
    padding: "7px 10px",
    marginBottom: "2px",
  },
  deleteBarLabel: {
    flex: 1,
    fontSize: "12px",
    fontWeight: "500",
    color: "#dc2626",
  },
  deleteBtn: {
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "11.5px",
    fontWeight: "600",
    padding: "4px 12px",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  cancelDeleteBtn: {
    background: "none",
    border: "none",
    fontSize: "11.5px",
    color: "#888",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    padding: "4px 6px",
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 0,
    background: colors.purple,
    flexShrink: 0,
  },
  avatar: {
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${colors.purple}, ${colors.gradientEnd})`,
    color: "white",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "'Poppins', sans-serif",
  },
};

export default Dashboard;
