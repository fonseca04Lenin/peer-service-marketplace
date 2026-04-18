import { useState, useEffect, useCallback } from "react";
import { apiFetch, releaseEscrow, refundBooking } from "../api";
import { colors } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { formatWhen } from "../utils/format";

const STATUS_STYLE = {
  pending:     { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Pending" },
  confirmed:   { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "Confirmed" },
  paid:        { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Paid" },
  in_progress: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "In Progress" },
  delivered:   { bg: "#f0fdfa", color: "#0f766e", border: "#99f6e4", label: "Delivered" },
  completed:   { bg: colors.purpleSoft, color: colors.purple, border: "#d4c8ff", label: "Completed" },
  cancelled:   { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Cancelled" },
};

function BookingsPage({ onPay }) {
  const currentUser = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("client");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionId, setActionId] = useState(null);
  const [actionError, setActionError] = useState({});

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

  async function patchStatus(id, newStatus) {
    setActionId(id);
    setActionError((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await apiFetch(`/bookings/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Update failed");
      }
      await load();
    } catch (e) {
      setActionError((prev) => ({ ...prev, [id]: e.message || "Something went wrong" }));
    } finally {
      setActionId(null);
    }
  }

  async function handleRelease(id) {
    setActionId(id);
    setActionError((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await releaseEscrow(id);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Could not release payment");
      }
      await load();
    } catch (e) {
      setActionError((prev) => ({ ...prev, [id]: e.message || "Something went wrong" }));
    } finally {
      setActionId(null);
    }
  }

  async function handleRefund(id) {
    setActionId(id);
    setActionError((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await refundBooking(id);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Could not process refund");
      }
      await load();
    } catch (e) {
      setActionError((prev) => ({ ...prev, [id]: e.message || "Something went wrong" }));
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
        {["all", "pending", "confirmed", "paid", "in_progress", "delivered", "completed", "cancelled"].map((st) => (
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
            const listingDeleted = !b.service;
            const st = listingDeleted
              ? STATUS_STYLE.cancelled
              : STATUS_STYLE[b.status] || STATUS_STYLE.pending;
            const svc = b.service || {};
            const req = b.requester || {};
            const clientName =
              `${req.first_name || ""} ${req.last_name || ""}`.trim() || req.username || "Client";
            const busy = actionId === b.id;
            const priceLabel = svc.price != null
              ? `$${svc.price}${svc.rate_type !== 'flat' ? '/hr' : ''}`
              : "—";

            return (
              <article key={b.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={s.cardTitle}>{svc.title || "Service no longer available"}</h2>
                    <p style={s.meta}>
                      {tab === "client" ? (
                        <>
                          With {svc.provider_name || "provider"} · {priceLabel}
                        </>
                      ) : (
                        <>
                          From {clientName} · {priceLabel}
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
                    {listingDeleted ? "Cancelled" : st.label}
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

                {actionError[b.id] && (
                  <p style={s.cardErr}>{actionError[b.id]}</p>
                )}

                {/* Provider actions */}
                {!listingDeleted && b.viewer_role === "provider" && b.status === "pending" && (
                  <div style={s.actions}>
                    <button type="button" style={s.btnDecline} disabled={busy} onClick={() => patchStatus(b.id, "cancelled")}>
                      Decline
                    </button>
                    <button type="button" style={s.btnConfirm} disabled={busy} onClick={() => patchStatus(b.id, "confirmed")}>
                      {busy ? "…" : "Confirm"}
                    </button>
                  </div>
                )}

                {!listingDeleted && b.viewer_role === "provider" && b.status === "paid" && (
                  <div style={s.actions}>
                    <button type="button" style={s.btnConfirm} disabled={busy} onClick={() => patchStatus(b.id, "in_progress")}>
                      {busy ? "…" : "Mark as started"}
                    </button>
                  </div>
                )}

                {!listingDeleted && b.viewer_role === "provider" && b.status === "in_progress" && (
                  <div style={s.actions}>
                    <button type="button" style={s.btnConfirm} disabled={busy} onClick={() => patchStatus(b.id, "delivered")}>
                      {busy ? "…" : "Mark as delivered"}
                    </button>
                  </div>
                )}

                {/* Client actions */}
                {!listingDeleted && b.viewer_role === "requester" && (b.status === "pending" || b.status === "confirmed") && (
                  <div style={s.actions}>
                    <button type="button" style={s.btnDecline} disabled={busy} onClick={() => patchStatus(b.id, "cancelled")}>
                      Cancel
                    </button>
                    {onPay && b.status === "confirmed" && (
                      <button type="button" style={s.btnPay} disabled={busy} onClick={() => onPay(b)}>
                        Pay now
                      </button>
                    )}
                  </div>
                )}

                {!listingDeleted && b.viewer_role === "requester" && (b.status === "paid" || b.status === "in_progress") && (
                  <div style={s.actions}>
                    <button type="button" style={s.btnDecline} disabled={busy} onClick={() => handleRefund(b.id)}>
                      {busy ? "…" : "Cancel & refund"}
                    </button>
                  </div>
                )}

                {!listingDeleted && b.viewer_role === "requester" && b.status === "delivered" && (
                  <div style={s.actions}>
                    <p style={s.deliveredNote}>Work marked as done — release payment?</p>
                    <button type="button" style={s.btnPay} disabled={busy} onClick={() => handleRelease(b.id)}>
                      {busy ? "…" : "Release payment"}
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
    background: colors.pageBg,
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
    color: colors.dark,
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
    borderRadius: "4px",
    border: `1px solid ${colors.border}`,
    background: "white",
    fontSize: "13px",
    fontWeight: "600",
    color: "#666",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  tabOn: {
    border: `1px solid ${colors.purple}`,
    color: colors.purple,
    background: colors.purpleSoft,
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "22px",
  },
  chip: {
    padding: "6px 12px",
    borderRadius: 0,
    border: `1px solid ${colors.border}`,
    background: "white",
    fontSize: "11px",
    fontWeight: "600",
    color: "#888",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  chipOn: {
    border: `1px solid ${colors.purple}`,
    color: colors.purple,
    background: colors.purpleSoft,
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    maxWidth: "720px",
  },
  card: {
    background: "white",
    borderRadius: "4px",
    border: `1px solid ${colors.border}`,
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
    color: colors.dark,
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
    borderRadius: 0,
    border: "1px solid",
    flexShrink: 0,
  },
  whenBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "12px 14px",
    background: "#faf9ff",
    borderRadius: "4px",
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
    color: colors.dark,
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
    borderRadius: "4px",
    border: "none",
    background: colors.purple,
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  btnDecline: {
    padding: "8px 16px",
    borderRadius: "4px",
    border: `1px solid ${colors.purple}`,
    background: "white",
    color: colors.purple,
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  btnPay: {
    padding: "8px 20px",
    borderRadius: "4px",
    border: "none",
    background: colors.purple,
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  cardErr: {
    fontSize: "12px",
    color: "#dc2626",
    margin: "4px 0 8px",
    textAlign: "right",
  },
  deliveredNote: {
    fontSize: "12px",
    color: "#888",
    margin: 0,
    flex: 1,
    alignSelf: "center",
  },
  empty: {
    padding: "28px",
    background: "white",
    borderRadius: "4px",
    border: "1px dashed #ddd6fe",
    maxWidth: "520px",
  },
  emptyTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: colors.dark,
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
