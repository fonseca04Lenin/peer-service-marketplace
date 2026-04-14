import { useState, useEffect, useMemo } from "react";
import { apiFetch, getToken } from "../api";

const PURPLE = "rgb(83, 58, 253)";
const PURPLE_SOFT = "#ede9fe";

function defaultLocalDatetime() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ServicePage({ id, onBack, currentUser, onBooked }) {
  const [service, setService] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [when, setWhen] = useState(defaultLocalDatetime);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgBody, setMsgBody] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgSent, setMsgSent] = useState(false);

  const token = getToken();
  const loggedIn = Boolean(token && currentUser);

  useEffect(() => {
    setLoadError("");
    apiFetch(`/services/${id}/`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load service"))))
      .then(setService)
      .catch(() => setLoadError("We couldn't load this service. Try again later."));
  }, [id]);

  const minWhen = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  async function sendMessage(e) {
    e.preventDefault();
    setMsgError("");
    if (!msgBody.trim()) return;
    setMsgSending(true);
    try {
      const res = await apiFetch(`/messaging/${service.provider.id}/`, {
        method: "POST",
        body: JSON.stringify({ body: msgBody.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Could not send message.");
      }
      setMsgSent(true);
      setMsgOpen(false);
      setMsgBody("");
    } catch (err) {
      setMsgError(err.message || "Something went wrong.");
    } finally {
      setMsgSending(false);
    }
  }

  async function submitBooking(e) {
    e.preventDefault();
    setFormError("");
    if (!loggedIn) {
      setFormError("Please sign in to book.");
      return;
    }
    const scheduled = new Date(when);
    if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() <= Date.now()) {
      setFormError("Pick a future date and time.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch("/bookings/", {
        method: "POST",
        body: JSON.stringify({
          service: service.id,
          scheduled_at: scheduled.toISOString(),
          notes: notes.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.detail || data.scheduled_at?.[0] || data.service?.[0] || "Could not create booking.";
        throw new Error(typeof msg === "string" ? msg : "Could not create booking.");
      }
      setSuccess(true);
      setBookingOpen(false);
      onBooked?.();
    } catch (err) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div style={s.page}>
        {onBack && (
          <button type="button" onClick={onBack} style={s.backBtn}>
            ← Back
          </button>
        )}
        <p style={s.muted}>{loadError}</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div style={s.page}>
        <p style={s.muted}>Loading…</p>
      </div>
    );
  }

  const p = service.provider;
  const skills = typeof p?.skills === "string"
    ? p.skills.split(",").map((x) => x.trim()).filter(Boolean)
    : [];

  const isOwnListing = loggedIn && currentUser?.id === p?.id;

  return (
    <div style={s.page}>
      {onBack && (
        <button type="button" onClick={onBack} style={s.backBtn}>
          ← Back to results
        </button>
      )}

      {success && (
        <div style={s.bannerOk} role="status">
          <strong>Booking request sent.</strong>
          <p style={s.bannerSub}>
            The provider will confirm or decline soon. You can track status under <strong>Bookings</strong>.
          </p>
        </div>
      )}

      {msgSent && (
        <div style={s.bannerOk} role="status">
          <strong>Message sent.</strong>
          <p style={s.bannerSub}>You can view the conversation under <strong>Messages</strong>.</p>
        </div>
      )}

      {(service.image || p?.profile_picture) && (
        <img
          src={service.image || p.profile_picture}
          alt=""
          style={s.heroBanner}
        />
      )}

      <div style={s.twoCol}>
        <div style={s.leftCol}>
          <div style={s.priceRow}>
            <h1 style={s.title}>{service.title}</h1>
            <div style={s.price}>${service.price}<span style={{ fontSize: "13px", fontWeight: "500", color: "#aaa" }}>/hr</span></div>
          </div>

          <div style={s.badges}>
            {service.category && <span style={s.catBadge}>{service.category}</span>}
            {service.is_remote ? (
              <span style={s.remoteBadge}>Remote</span>
            ) : (
              <span style={s.areaBadge}>{service.service_area || `${p?.city}, ${p?.country}`}</span>
            )}
            {service.created_at && (
              <span style={s.date}>
                Listed{" "}
                {new Date(service.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <p style={s.description}>{service.description}</p>

          <div style={s.divider} />

          <h3 style={s.sectionLabel}>About the provider</h3>
          <p style={s.bio}>{p?.bio || "No bio provided."}</p>

          {skills.length > 0 && (
            <>
              <h3 style={s.sectionLabel}>Skills</h3>
              <div style={s.skillsWrap}>
                {skills.map((skill) => (
                  <span key={skill} style={s.skillChip}>
                    {skill}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={s.rightCol}>
          <div style={s.providerCard}>
            {p?.profile_picture && (
              <img src={p.profile_picture} alt="" style={s.avatar} />
            )}
            <div>
              <h2 style={s.providerName}>
                {p?.first_name} {p?.last_name}
              </h2>
              <p style={s.tagline}>{p?.tagline}</p>
              <p style={s.location}>
                {p?.city}, {p?.country}
              </p>
            </div>
          </div>

          <div style={s.divider} />

          <h3 style={s.sectionLabel}>Book this service</h3>
          <p style={s.hint}>
            Pick a time, add optional notes, and send a request — pricing stays visible before you commit.
          </p>

          {!loggedIn && (
            <p style={s.muted}>Sign in to send a booking request.</p>
          )}

          {loggedIn && isOwnListing && (
            <p style={s.muted}>This is your listing — share the link so clients can book you.</p>
          )}

          {loggedIn && !isOwnListing && (
            <>
              {!bookingOpen && !msgOpen && (
                <div style={s.actionRow}>
                  <button type="button" style={s.ctaBtn} onClick={() => { setBookingOpen(true); setFormError(""); }}>
                    Request to book
                  </button>
                  <button type="button" style={s.msgBtn} onClick={() => { setMsgOpen(true); setMsgError(""); }}>
                    Message provider
                  </button>
                </div>
              )}

              {bookingOpen && (
                <form style={s.bookingCard} onSubmit={submitBooking}>
                  <div style={s.summaryRow}>
                    <span style={s.summaryLabel}>Listed rate</span>
                    <span style={s.summaryPrice}>${service.price}<span style={{ fontSize: "12px", fontWeight: "500", color: "#aaa" }}>/hr</span></span>
                  </div>
                  <label style={s.fieldLabel} htmlFor="when">
                    Date & time
                  </label>
                  <input
                    id="when"
                    type="datetime-local"
                    min={minWhen}
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    style={s.input}
                    required
                  />
                  <label style={s.fieldLabel} htmlFor="notes">
                    Notes for the provider <span style={s.optional}>(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                    placeholder="Describe the job, access details, or questions…"
                    style={s.textarea}
                    rows={4}
                  />
                  {formError && <p style={s.err}>{formError}</p>}
                  <div style={s.rowBtns}>
                    <button type="button" style={s.btnGhost} onClick={() => setBookingOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" style={s.ctaBtnInline} disabled={submitting}>
                      {submitting ? "Sending…" : "Send booking request"}
                    </button>
                  </div>
                </form>
              )}

              {msgOpen && (
                <form style={s.bookingCard} onSubmit={sendMessage}>
                  <label style={s.fieldLabel} htmlFor="msgBody">
                    Message to {service.provider?.first_name || "provider"}
                  </label>
                  <textarea
                    id="msgBody"
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value.slice(0, 2000))}
                    placeholder="Introduce yourself or ask a question…"
                    style={s.textarea}
                    rows={5}
                    autoFocus
                  />
                  {msgError && <p style={s.err}>{msgError}</p>}
                  <div style={s.rowBtns}>
                    <button type="button" style={s.btnGhost} onClick={() => setMsgOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" style={s.ctaBtnInline} disabled={msgSending || !msgBody.trim()}>
                      {msgSending ? "Sending…" : "Send message"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
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
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: "40px",
    alignItems: "start",
  },
  leftCol: {
    minWidth: 0,
  },
  rightCol: {
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "16px",
    padding: "24px",
    position: "sticky",
    top: "24px",
  },
  providerCard: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginBottom: "4px",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: PURPLE,
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
    marginBottom: "24px",
    fontFamily: "'Poppins', sans-serif",
  },
  bannerOk: {
    background: PURPLE_SOFT,
    border: "1px solid #d4c8ff",
    borderRadius: "12px",
    padding: "16px 18px",
    marginBottom: "20px",
    color: "#0f0620",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  bannerSub: {
    margin: "8px 0 0",
    fontSize: "13px",
    color: "#555",
    fontWeight: "400",
  },
  heroBanner: {
    width: "100%",
    height: "280px",
    objectFit: "cover",
    borderRadius: "14px",
    marginBottom: "28px",
  },
  avatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  providerName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f0620",
    margin: "0 0 3px",
  },
  tagline: {
    fontSize: "13px",
    color: "#666",
    margin: "0 0 3px",
  },
  location: {
    fontSize: "12px",
    color: "#aaa",
    margin: 0,
  },
  divider: {
    height: "1px",
    background: "#ede9fe",
    margin: "20px 0",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "12px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f0620",
    margin: 0,
    flex: 1,
  },
  price: {
    fontSize: "22px",
    fontWeight: "700",
    color: PURPLE,
    whiteSpace: "nowrap",
  },
  badges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: "16px",
  },
  catBadge: {
    fontSize: "11.5px",
    color: "#aaa",
  },
  remoteBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: PURPLE,
    background: PURPLE_SOFT,
    border: "1px solid #d4c8ff",
    borderRadius: "20px",
    padding: "2px 8px",
  },
  areaBadge: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#555",
    background: "#f5f5f5",
    border: "1px solid #e0e0e0",
    borderRadius: "20px",
    padding: "2px 8px",
  },
  date: {
    fontSize: "11px",
    color: "#bbb",
    marginLeft: "auto",
  },
  description: {
    fontSize: "14px",
    color: "#444",
    lineHeight: 1.7,
    margin: 0,
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#aaa",
    margin: "0 0 10px",
  },
  hint: {
    fontSize: "13px",
    color: "#888",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  bio: {
    fontSize: "14px",
    color: "#444",
    lineHeight: 1.7,
    margin: "0 0 20px",
  },
  skillsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "4px",
  },
  skillChip: {
    fontSize: "12px",
    fontWeight: "500",
    color: PURPLE,
    background: PURPLE_SOFT,
    border: "1px solid #d4c8ff",
    borderRadius: "6px",
    padding: "4px 10px",
  },
  actionRow: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "4px",
  },
  ctaBtn: {
    width: "100%",
    padding: "14px 28px",
    background: PURPLE,
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  msgBtn: {
    width: "100%",
    padding: "14px 22px",
    background: "white",
    color: PURPLE,
    border: `1.5px solid ${PURPLE}`,
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  bookingCard: {
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "8px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #ede9fe",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#666",
  },
  summaryPrice: {
    fontSize: "18px",
    fontWeight: "700",
    color: PURPLE,
  },
  fieldLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#444",
    marginBottom: "6px",
  },
  optional: {
    fontWeight: "400",
    color: "#aaa",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: "14px",
    boxSizing: "border-box",
    border: "1px solid #ede9fe",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "'Poppins', sans-serif",
    color: "#0f0620",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: "12px",
    boxSizing: "border-box",
    border: "1px solid #ede9fe",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "'Poppins', sans-serif",
    resize: "vertical",
    color: "#0f0620",
  },
  err: {
    color: "#dc2626",
    fontSize: "13px",
    margin: "0 0 10px",
  },
  rowBtns: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
  btnGhost: {
    padding: "12px 18px",
    background: "white",
    color: "#666",
    border: "1px solid #ede9fe",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  ctaBtnInline: {
    padding: "12px 22px",
    background: PURPLE,
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  muted: {
    fontSize: "14px",
    color: "#888",
  },
};

export default ServicePage;
