import { useState } from "react";
import { apiFetch } from "../api";

const PURPLE = "rgb(83, 58, 253)";
const DARK   = "#0f0620";

function PaymentPage({ booking, onSuccess, onCancel }) {
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [paid,      setPaid]      = useState(false);

  if (!booking) return null;

  async function handlePay() {
    setLoading(true);
    setError('');

    try {
      const res  = await apiFetch('/payments/create-intent/', {
        method: 'POST',
        body: JSON.stringify({ booking_id: booking.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not initiate payment.');
        return;
      }

      const { client_secret } = data;

      console.log('PaymentIntent client_secret ready:', client_secret);
      setPaid(true);
      onSuccess?.();

    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (paid) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.successIcon}>✓</div>
          <h2 style={s.title}>Payment successful</h2>
          <p style={s.sub}>Your booking has been confirmed.</p>
          <button onClick={onSuccess} style={s.btn}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.title}>Complete your payment</h2>

        <div style={s.summary}>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Service</span>
            <span style={s.summaryValue}>{booking.service?.title}</span>
          </div>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Provider</span>
            <span style={s.summaryValue}>{booking.service?.provider?.username}</span>
          </div>
          <div style={{ ...s.summaryRow, borderTop: '1px solid #ede9fe', paddingTop: '12px', marginTop: '4px' }}>
            <span style={{ ...s.summaryLabel, fontWeight: '600', color: DARK }}>Total</span>
            <span style={{ ...s.summaryValue, fontWeight: '700', fontSize: '18px' }}>
              ${parseFloat(booking.service?.price || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div style={s.cardPlaceholder}>
          <p style={s.placeholderText}>
            Stripe card element goes here
            <br />
            <span style={s.placeholderSub}>
              Install @stripe/react-stripe-js and replace this block
            </span>
          </p>
        </div>

        {error && <p style={s.error}>{error}</p>}

        <div style={s.actions}>
          <button onClick={onCancel} style={s.cancelBtn} disabled={loading}>
            Cancel
          </button>
          <button onClick={handlePay} style={s.btn} disabled={loading}>
            {loading ? 'Processing…' : `Pay $${parseFloat(booking.service?.price || 0).toFixed(2)}`}
          </button>
        </div>

        <p style={s.secure}>🔒 Payments are processed securely by Stripe</p>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
    padding: '40px 20px',
    background: '#f7f6ff',
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '36px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #ede9fe',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: DARK,
    margin: '0 0 24px',
  },
  summary: {
    background: '#faf9ff',
    border: '1px solid #ede9fe',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#888',
  },
  summaryValue: {
    fontSize: '13.5px',
    fontWeight: '500',
    color: DARK,
  },
  cardPlaceholder: {
    border: '2px dashed #ddd6fe',
    borderRadius: '8px',
    padding: '32px 16px',
    textAlign: 'center',
    marginBottom: '20px',
    background: '#faf9ff',
  },
  placeholderText: {
    fontSize: '13.5px',
    color: '#a78bfa',
    fontWeight: '500',
    margin: 0,
    lineHeight: 1.6,
  },
  placeholderSub: {
    fontSize: '12px',
    color: '#bbb',
    fontWeight: '400',
  },
  error: {
    fontSize: '13px',
    color: '#ef4444',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '10px 14px',
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  btn: {
    flex: 1,
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    background: PURPLE,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
  },
  cancelBtn: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
    fontWeight: '500',
    background: 'none',
    color: '#888',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 20px',
    cursor: 'pointer',
  },
  secure: {
    textAlign: 'center',
    fontSize: '11.5px',
    color: '#aaa',
    margin: '16px 0 0',
  },
  successIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: '#dcfce7',
    color: '#16a34a',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontWeight: '700',
  },
  sub: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    margin: '0 0 24px',
  },
};

export default PaymentPage;
