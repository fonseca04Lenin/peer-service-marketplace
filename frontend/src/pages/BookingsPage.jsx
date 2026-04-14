import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";

const PURPLE = "rgb(83, 58, 253)";
const PURPLE_SOFT = "#f0eeff";

const STATUS_STYLE = {
  pending: { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Pending" },
  confirmed: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "Confirmed" },
  completed: { bg: PURPLE_SOFT, color: PURPLE, border: "#d4c8ff", label: "Completed" },
  cancelled: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Cancelled" },
};

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BookingsPage({ currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("client"); // client | provider
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionId, setActionId] = useState(null);

  const load = useCallback(() => {
    if (!currentUser) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    apiFetch("/bookings/")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => {
        setLoadError("Could not load bookings.");
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = bookings.filter((b) => {
    if (tab === "client" && b.viewer_role !== "requester") return false;
    if (tab === "provider" && b.viewer_role !== "provider") return false;
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    return true;
  });

  async function patchStatus(id, status) {
    setActionId(id);
    try {
      const res = await apiFetch(`/bookings/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Update failed");
      }
      await load();
    } catch (e) {
      alert(e.message || "Could not update booking");
    } finally {
      setActionId(null);
    }
  }

  if (!currentUser) {
    return (
      <div style={s.page}>
        <h1 style={s.title}>Bookings</h1>
        <p style={s.muted}>Sign in to see your scheduled work and incoming requests.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={s.page}>
        <h1 style={s.title}>Bookings</h1>
        <p style={s.muted}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.head}>
        <div>
          <h1 style={s.title}>Bookings</h1>
          <p style={s.sub}>
            See what you’ve booked and what’s been requested from you.
          </p>
        </div>
      </div>

      {loadError && <p style={s.err}>{loadError}</p>}

      <div style={s.tabs}>
        <button
          type="button"
          style={{ ...s.tab, ...(tab === "client" ? s.tabOn : {}) }}
          onClick={() => setTab("client")}
        >
          As client
        </button>
        <button
          type="button"
          style={{ ...s.tab, ...(tab === "provider" ? s.tabOn : {}) }}
          onClick={() => setTab("provider")}
        >
          As provider
        </button>
      </div>

      <div style={s.filters}>
        {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
          <button
            key={st}
            type="button"
            style={{ ...s.chip, ...(statusFilter === st ? s.chipOn : {}) }}
            onClick={() => setStatusFilter(st)}
          >
            {st === "all" ? "All" : STATUS_STYLE[st]?.label || st}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyTitle}>No bookings here yet</p>
          <p style={s.muted}>
            {tab === "client"
              ? "Browse Search Services and send a booking request — you’ll see status updates here."
              : "When someone requests your listing, it will appear here for you to confirm or decline."}
          </p>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map((b) => {
            const st = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
            const svc = b.service || {};
            const req = b.requester || {};
            const clientName =
              `${req.first_name || ""} ${req.last_name || ""}`.trim() || req.username || "Client";
            const busy = actionId === b.id;

            return (
              <article key={b.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={s.cardTitle}>{svc.title || "Service"}</h2>
                    <p style={s.meta}>
                      {tab === "client" ? (
                        <>
                          With {svc.provider_name || "provider"} · ${svc.price ?? "—"}
                        </>
                      ) : (
                        <>
                          From {clientName} · ${svc.price ?? "—"}
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    style={{
                      ...s.badge,
                      background: st.bg,
                      color: st.color,
                      borderColor: st.border,
                    }}
                  >
                    {st.label}
                  </span>
                </div>

                <div style={s.whenBlock}>
                  <span style={s.whenLabel}>Scheduled</span>
                  <span style={s.whenVal}>{formatWhen(b.scheduled_at)}</span>
                </div>

                {b.notes && (
                  <p style={s.notes}>
                    <strong>Notes:</strong> {b.notes}
                  </p>
                )}

                {b.viewer_role === "provider" && b.status === "pending" && (
                  <div style={s.actions}>
                    <button
                      type="button"
                      style={s.btnDecline}
                      disabled={busy}
                      onClick={() => patchStatus(b.id, "cancelled")}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      style={s.btnConfirm}
                      disabled={busy}
                      onClick={() => patchStatus(b.id, "confirmed")}
                    >
                      {busy ? "…" : "Confirm"}
                    </button>
                  </div>
                )}

                {b.viewer_role === "requester" && (b.status === "pending" || b.status === "confirmed") && (
                  <div style={s.actions}>
                    <button
                      type="button"
                      style={s.btnDecline}
                      disabled={busy}
                      onClick={() => patchStatus(b.id, "cancelled")}
                    >
                      Cancel booking
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
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
    boxSizing: "border-box",
  },
  head: {
    marginBottom: "20px",
    maxWidth: "720px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 8px",
    color: "#0f0620",
  },
  sub: {
    fontSize: "13px",
    color: "#888",
    margin: 0,
    lineHeight: 1.6,
  },
  err: {
    color: "#dc2626",
    fontSize: "14px",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  tab: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "1px solid #ede9fe",
    background: "white",
    fontSize: "13px",
    fontWeight: "600",
    color: "#666",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  tabOn: {
    border: `1px solid ${PURPLE}`,
    color: PURPLE,
    background: PURPLE_SOFT,
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "22px",
  },
  chip: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid #ede9fe",
    background: "white",
    fontSize: "11px",
    fontWeight: "600",
    color: "#888",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  chipOn: {
    border: `1px solid ${PURPLE}`,
    color: PURPLE,
    background: PURPLE_SOFT,
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    maxWidth: "720px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid #ede9fe",
    padding: "20px 22px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f0620",
    margin: "0 0 4px",
  },
  meta: {
    fontSize: "12px",
    color: "#888",
    margin: 0,
  },
  badge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid",
    flexShrink: 0,
  },
  whenBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "12px 14px",
    background: "#faf9ff",
    borderRadius: "10px",
    marginBottom: "10px",
  },
  whenLabel: {
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#aaa",
  },
  whenVal: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f0620",
  },
  notes: {
    fontSize: "13px",
    color: "#555",
    margin: "0 0 12px",
    lineHeight: 1.5,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "4px",
  },
  btnConfirm: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    background: PURPLE,
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  btnDecline: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: `1px solid ${PURPLE}`,
    background: "white",
    color: PURPLE,
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  empty: {
    padding: "28px",
    background: "white",
    borderRadius: "12px",
    border: "1px dashed #ddd6fe",
    maxWidth: "520px",
  },
  emptyTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f0620",
    margin: "0 0 8px",
  },
  muted: {
    fontSize: "14px",
    color: "#888",
    margin: 0,
    lineHeight: 1.6,
  },
};

export default BookingsPage;
