import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import { colors } from "../constants";

function PaymentPage({ booking, onSuccess, onCancel, onAddFunds }) {
  const [balance,  setBalance]  = useState(null);
  const [fetching, setFetching] = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [paid,     setPaid]     = useState(false);

  useEffect(() => {
    apiFetch("/users/me/")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBalance(parseFloat(data.wallet_balance ?? 0)); })
      .finally(() => setFetching(false));
  }, []);

  if (!booking) return null;

  // Use totalAmount if provided (for hourly bookings), otherwise use service price
  const price   = booking.totalAmount ? parseFloat(booking.totalAmount) : parseFloat(booking.service?.price || 0);
  const hours   = booking.hours ?? 1;
  const isHourly = booking.hours !== undefined;
  const canPay  = !fetching && balance !== null && balance >= price;
  const shortBy = !fetching && balance !== null ? Math.max(0, price - balance) : 0;

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      const body = { booking_id: booking.id };
      if (isHourly) body.hours = hours;
      if (booking.totalAmount) body.amount = booking.totalAmount;
      
      const res  = await apiFetch("/payments/pay-booking/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment failed.");
        if (data.balance !== undefined) setBalance(data.balance);
        return;
      }
      setBalance(data.new_balance);
      setPaid(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (paid) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.successIcon}>✓</div>
          <h2 style={{ ...s.title, textAlign: "center" }}>Payment successful</h2>
          <p style={s.sub}>
            ${price.toFixed(2)} has been deducted from your wallet and held in escrow.
            The provider has been notified and will start your booking soon.
          </p>
          <button onClick={onSuccess} style={{ ...s.btnFilled, flex: "unset", display: "block", margin: "0 auto", padding: "12px 32px" }}>View bookings</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        <h2 style={s.title}>Pay with wallet</h2>

        <div style={s.summary}>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Service</span>
            <span style={s.summaryValue}>{booking.service?.title || "—"}</span>
          </div>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Provider</span>
            <span style={s.summaryValue}>
              {booking.service?.provider_name || booking.service?.provider?.username || "—"}
            </span>
          </div>
          {isHourly && (
            <div style={s.summaryRow}>
              <span style={s.summaryLabel}>Hours</span>
              <span style={s.summaryValue}>{hours} {hours === 1 ? 'hour' : 'hours'}</span>
            </div>
          )}
          <div style={s.summaryDivider}>
            <span style={{ ...s.summaryLabel, fontWeight: "600", color: colors.dark }}>Total due</span>
            <span style={s.summaryTotal}>${price.toFixed(2)}</span>
          </div>
        </div>

        <div style={{
          ...s.balanceRow,
          borderColor: canPay ? "#bbf7d0" : "#fecaca",
          background:  canPay ? "#f0fdf4" : "#fef2f2",
        }}>
          <span style={s.balanceLabel}>Wallet balance</span>
          <span style={{ ...s.balanceAmt, color: canPay ? "#16a34a" : "#dc2626" }}>
            {fetching ? "—" : `$${balance.toFixed(2)}`}
          </span>
        </div>
        {!canPay && !fetching && (
          <div style={s.notice}>
            <p style={s.noticeText}>
              You need ${shortBy.toFixed(2)} more to pay for this booking.
            </p>
            {onAddFunds && (
              <button style={s.addFundsBtn} onClick={onAddFunds}>
                Add funds to wallet
              </button>
            )}
          </div>
        )}

        {error && <p style={s.errMsg}>{error}</p>}

        <div style={s.actions}>
          <button onClick={onCancel} style={s.btnGhost} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handlePay}
            style={{ ...s.btnFilled, opacity: (!canPay || loading) ? 0.5 : 1, cursor: (!canPay || loading) ? "not-allowed" : "pointer" }}
            disabled={!canPay || loading || fetching}
          >
            {loading ? "Processing…" : `Pay $${price.toFixed(2)}`}
          </button>
        </div>

        <p style={s.footnote}>Funds are deducted from your wallet balance</p>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    padding: "40px 20px",
    background: colors.pageBg,
    fontFamily: "'Poppins', sans-serif",
    boxSizing: "border-box",
  },
  card: {
    background: "white",
    borderRadius: "4px",
    padding: "36px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    border: `1px solid ${colors.border}`,
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: colors.dark,
    margin: "0 0 22px",
  },

  // Booking summary block
  summary: {
    background: "#faf9ff",
    border: `1px solid ${colors.border}`,
    borderRadius: "4px",
    padding: "14px 16px",
    marginBottom: "20px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
  },
  summaryDivider: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: `1px solid ${colors.border}`,
    paddingTop: "12px",
    marginTop: "6px",
  },
  summaryLabel: {
    fontSize: "12.5px",
    color: "#999",
  },
  summaryValue: {
    fontSize: "13px",
    fontWeight: "500",
    color: colors.dark,
  },
  summaryTotal: {
    fontSize: "18px",
    fontWeight: "700",
    color: colors.dark,
  },

  balanceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid",
    borderRadius: "4px",
    padding: "12px 16px",
    marginBottom: "16px",
  },
  balanceLabel: {
    fontSize: "12.5px",
    fontWeight: "500",
    color: "#555",
  },
  balanceAmt: {
    fontSize: "15px",
    fontWeight: "700",
  },

  notice: {
    marginBottom: "16px",
  },
  noticeText: {
    fontSize: "12.5px",
    color: "#b45309",
    margin: "0 0 8px",
  },
  addFundsBtn: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "12.5px",
    fontWeight: "600",
    background: "none",
    color: colors.purple,
    border: `1px solid ${colors.purple}`,
    borderRadius: "4px",
    padding: "7px 14px",
    cursor: "pointer",
  },

  errMsg: {
    fontSize: "12.5px",
    color: "#ef4444",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "4px",
    padding: "9px 13px",
    marginBottom: "16px",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },
  btnFilled: {
    flex: 1,
    fontFamily: "'Poppins', sans-serif",
    fontSize: "14px",
    fontWeight: "600",
    background: colors.purple,
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "12px",
    cursor: "pointer",
  },
  btnGhost: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "13px",
    fontWeight: "500",
    background: "white",
    color: "#888",
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
    padding: "12px 18px",
    cursor: "pointer",
  },

  footnote: {
    textAlign: "center",
    fontSize: "11.5px",
    color: "#ccc",
    margin: "16px 0 0",
  },
  successIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "4px",
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
    fontWeight: "700",
  },
  sub: {
    fontSize: "13.5px",
    color: "#666",
    textAlign: "center",
    margin: "0 0 24px",
    lineHeight: 1.6,
  },
};

export default PaymentPage;
