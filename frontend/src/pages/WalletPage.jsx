import { useState, useEffect, useCallback, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "../api";
import { colors } from "../constants";
import { formatDate } from "../utils/format";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const TYPE_META = {
  deposit:      { label: "Added funds",        sign: "+", color: "#16a34a" },
  earning:      { label: "Earnings",          sign: "+", color: "#16a34a" },
  refund:       { label: "Refund",            sign: "+", color: "#16a34a" },
  escrow:       { label: "In escrow",         sign: "~", color: "#1d4ed8" },
  payment:      { label: "Service payment",   sign: "−", color: "#555"    },
  platform_fee: { label: "Platform fee",      sign: "−", color: "#aaa"    },
  withdrawal:   { label: "Withdrawal",         sign: "−", color: "#555"    },
};

const STATUS_LABEL = {
  completed: "completed",
  pending:   "pending",
  failed:    "failed",
  cancelled: "cancelled",
};

function FundForm({ title, endpoint, min, max, btnVariant, submitLabel, successMsg, hint, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState("");
  const [ok,     setOk]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk(false);
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setErr("Enter a valid amount.");
      return;
    }
    setBusy(true);
    try {
      const res  = await apiFetch(endpoint, { method: "POST", body: JSON.stringify({ amount: amt }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.detail || data.error || "Request failed."); return; }
      setAmount("");
      setOk(true);
      onSuccess(data);
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={s.panel}>
      <p style={s.panelTitle}>{title}</p>
      <form onSubmit={handleSubmit}>
        <div style={s.amtField}>
          <span style={s.currency}>$</span>
          <input
            type="number"
            min={min}
            max={max}
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => { setAmount(e.target.value); setErr(""); setOk(false); }}
            style={s.amtInput}
          />
        </div>
        {err && <p style={s.errMsg}>{err}</p>}
        {ok  && <p style={s.okMsg}>{successMsg}</p>}
        <button type="submit" style={btnVariant === "ghost" ? s.btnGhost : s.btnFilled} disabled={busy}>
          {busy ? "Processing…" : submitLabel}
        </button>
        <p style={s.hint}>{hint}</p>
      </form>
    </div>
  );
}

const QUICK_AMOUNTS = [25, 50, 100, 250];

function StripeDepositInner({ onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();

  const [amount,   setAmount]   = useState("");
  const [step,     setStep]     = useState("amount");
  const [secret,   setSecret]   = useState("");
  const [intentId, setIntentId] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");

  async function handleAmountSubmit(e) {
    e.preventDefault();
    setErr("");
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt < 5) { setErr("Minimum deposit is $5.00."); return; }
    if (amt > 5000)                        { setErr("Maximum deposit is $5,000.00."); return; }
    setBusy(true);
    try {
      const res  = await apiFetch("/payments/deposit-intent/", { method: "POST", body: JSON.stringify({ amount: amt }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Could not start deposit."); return; }
      setSecret(data.client_secret);
      setIntentId(data.intent_id);
      setStep("card");
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCardSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!stripe || !elements) return;
    setBusy(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (error) { setErr(error.message); return; }
      if (paymentIntent.status === "succeeded") {
        const res  = await apiFetch("/payments/confirm-deposit/", { method: "POST", body: JSON.stringify({ intent_id: intentId }) });
        const data = await res.json();
        if (!res.ok) { setErr(data.error || "Deposit failed to confirm."); return; }
        setStep("done");
        onSuccess(data);
      } else {
        setErr("Payment did not complete. Please try again.");
      }
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div style={s.panel}>
        <p style={s.panelTitle}>Deposit</p>
        <div style={s.successBlock}>
          <p style={s.successIcon}>✓</p>
          <p style={s.successMsg}>
            ${parseFloat(amount).toFixed(2)} added to your wallet
          </p>
        </div>
        <button style={s.btnFilled} onClick={() => { setStep("amount"); setAmount(""); setErr(""); }}>
          Deposit again
        </button>
      </div>
    );
  }

  if (step === "card") {
    return (
      <div style={s.panel}>
        <div style={s.depositHeader}>
          <p style={{ ...s.panelTitle, margin: 0 }}>Card details</p>
          <span style={s.amountBadge}>${parseFloat(amount).toFixed(2)}</span>
        </div>
        <div style={s.testCardHint}>
          <span style={s.testCardLabel}>Test card</span>
          <span style={s.testCardNum}>4242 4242 4242 4242</span>
          <span style={s.testCardSub}>Any future date · Any CVC</span>
        </div>
        <form onSubmit={handleCardSubmit}>
          <div style={s.cardElementWrap}>
            <CardElement options={{
              style: {
                base: {
                  fontSize: "14px",
                  fontFamily: "'Poppins', sans-serif",
                  color: colors.dark,
                  "::placeholder": { color: "#c4b5fd" },
                },
                invalid: { color: "#ef4444" },
              },
            }} />
          </div>
          {err && <p style={s.errMsg}>{err}</p>}
          <button type="submit" style={s.btnFilled} disabled={busy || !stripe}>
            {busy ? "Processing…" : `Deposit $${parseFloat(amount).toFixed(2)}`}
          </button>
          <button type="button" style={{ ...s.btnGhost, marginTop: "8px" }} onClick={() => { setStep("amount"); setErr(""); }} disabled={busy}>
            Back
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={s.panel}>
      <p style={s.panelTitle}>Deposit</p>
      <div style={s.quickAmounts}>
        {QUICK_AMOUNTS.map(q => (
          <button
            key={q}
            type="button"
            style={{ ...s.quickBtn, ...(parseFloat(amount) === q ? s.quickBtnActive : {}) }}
            onClick={() => { setAmount(String(q)); setErr(""); }}
          >
            ${q}
          </button>
        ))}
      </div>
      <form onSubmit={handleAmountSubmit}>
        <div style={s.amtField}>
          <span style={s.currency}>$</span>
          <input
            type="number" min="5" max="5000" step="0.01" placeholder="0.00"
            value={amount}
            onChange={e => { setAmount(e.target.value); setErr(""); }}
            style={s.amtInput}
          />
        </div>
        {err && <p style={s.errMsg}>{err}</p>}
        <button type="submit" style={s.btnFilled} disabled={busy || !amount}>
          {busy ? "Loading…" : "Continue"}
        </button>
        <p style={s.hint}>Minimum $5 · Maximum $5,000 per deposit</p>
      </form>
    </div>
  );
}

function StripeDepositForm({ onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <StripeDepositInner onSuccess={onSuccess} />
    </Elements>
  );
}

function WalletPage() {
  const [balance,     setBalance]     = useState(null);
  const [escrow,      setEscrow]      = useState(null);
  const [txns,        setTxns]        = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const depositRef = useRef(null);

  const load = useCallback(() => {
    setPageLoading(true);
    Promise.all([
      apiFetch("/users/me/").then(r => r.ok ? r.json() : null),
      apiFetch("/payments/transactions/").then(r => r.ok ? r.json() : []),
    ])
      .then(([user, history]) => {
        if (user) {
          setBalance(parseFloat(user.wallet_balance ?? 0));
          setEscrow(parseFloat(user.escrow_balance ?? 0));
        }
        setTxns(Array.isArray(history) ? history : []);
      })
      .finally(() => setPageLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (pageLoading) {
    return <div style={s.page}><p style={s.muted}>Loading…</p></div>;
  }

  return (
    <div style={s.page}>

      <div style={s.pageHead}>
        <h1 style={s.title}>Wallet</h1>
        <p style={s.sub}>Add funds to pay for services, or withdraw your earnings.</p>
      </div>

      <div style={s.balanceCard}>
        <div style={s.balanceRow}>
          <div>
            <p style={s.balanceMeta}>Available balance</p>
            <p style={s.balanceAmt}>
              ${balance !== null ? balance.toFixed(2) : "0.00"}
            </p>
            <button
              style={s.depositBtn}
              onClick={() => depositRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            >
              Deposit
            </button>
          </div>
          {escrow > 0 && (
            <div style={s.escrowBlock}>
              <p style={s.balanceMeta}>In escrow</p>
              <p style={s.escrowAmt}>
                ${escrow.toFixed(2)}
              </p>
              <p style={s.escrowHint}>pending client approval</p>
            </div>
          )}
        </div>
      </div>

      <div style={s.actionRow}>
        <div ref={depositRef}>
          <StripeDepositForm onSuccess={data => { setBalance(data.balance); load(); }} />
        </div>
        <FundForm
          title="Withdraw earnings"
          endpoint="/payments/withdraw/"
          min="10"
          btnVariant="ghost"
          submitLabel="Request withdrawal"
          successMsg="Withdrawal requested. Allow 3–5 business days."
          hint="Minimum $10 · Processed in 3–5 business days"
          onSuccess={data => { setBalance(data.new_balance); load(); }}
        />
      </div>

      <div style={s.historyCard}>
        <p style={s.panelTitle}>Transaction history</p>

        {txns.length === 0 ? (
          <p style={s.muted}>No transactions yet — add funds or complete a booking to get started.</p>
        ) : (
          <div>
            {txns.map((t, i) => {
              const meta = TYPE_META[t.type] ?? { label: t.type, sign: "", color: colors.dark };
              const isLast = i === txns.length - 1;
              return (
                <div key={t.id} style={{ ...s.txnRow, ...(isLast ? {} : s.txnBorder) }}>
                  <div style={s.txnLeft}>
                    <span style={{ ...s.txnSign, color: meta.color }}>
                      {meta.sign}
                    </span>
                    <div>
                      <p style={s.txnLabel}>{meta.label}</p>
                      {t.note ? <p style={s.txnNote}>{t.note}</p> : null}
                    </div>
                  </div>
                  <div style={s.txnRight}>
                    <span style={{ ...s.txnAmount, color: meta.color }}>
                      {meta.sign}${t.amount.toFixed(2)}
                    </span>
                    <div style={s.txnMeta}>
                      <span style={s.txnDate}>{formatDate(t.created_at)}</span>
                      {t.status !== "completed" && (
                        <span style={s.txnStatus}>{STATUS_LABEL[t.status] ?? t.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
  pageHead: {
    marginBottom: "22px",
    maxWidth: "720px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: colors.dark,
    margin: "0 0 6px",
  },
  sub: {
    fontSize: "13px",
    color: "#888",
    margin: 0,
    lineHeight: 1.6,
  },

  balanceCard: {
    background: "white",
    border: `1px solid ${colors.border}`,
    borderRadius: "4px",
    padding: "28px 32px",
    marginBottom: "16px",
    maxWidth: "720px",
  },
  balanceRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "48px",
  },
  balanceMeta: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 10px",
  },
  balanceAmt: {
    fontSize: "42px",
    fontWeight: "700",
    color: colors.dark,
    margin: 0,
    letterSpacing: "-1px",
  },
  escrowBlock: {
    borderLeft: "1px solid #e5e7eb",
    paddingLeft: "48px",
  },
  escrowAmt: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1d4ed8",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  escrowHint: {
    fontSize: "11px",
    color: "#aaa",
    margin: "6px 0 0",
  },
  depositBtn: {
    marginTop: "16px",
    padding: "8px 20px",
    background: colors.purple,
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginBottom: "16px",
    maxWidth: "720px",
  },
  panel: {
    background: "white",
    border: `1px solid ${colors.border}`,
    borderRadius: "4px",
    padding: "20px 22px",
  },
  panelTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: colors.dark,
    margin: "0 0 16px",
  },

  depositHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  amountBadge: {
    fontSize: "13px",
    fontWeight: "700",
    color: colors.purple,
    background: "#f5f3ff",
    border: "1px solid #ede9fe",
    borderRadius: "4px",
    padding: "2px 10px",
  },
  testCardHint: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "4px",
    padding: "8px 12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  testCardLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#16a34a",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  testCardNum: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#15803d",
    fontFamily: "monospace",
    letterSpacing: "0.05em",
  },
  testCardSub: {
    fontSize: "11px",
    color: "#16a34a",
  },
  quickAmounts: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  quickBtn: {
    flex: 1,
    padding: "7px 0",
    background: "#f5f3ff",
    color: colors.purple,
    border: "1px solid #ede9fe",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  quickBtnActive: {
    background: colors.purple,
    color: "white",
    border: `1px solid ${colors.purple}`,
  },
  successBlock: {
    textAlign: "center",
    padding: "16px 0 20px",
  },
  successIcon: {
    fontSize: "28px",
    color: "#16a34a",
    margin: "0 0 8px",
  },
  successMsg: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#15803d",
    margin: 0,
  },
  cardElementWrap: {
    border: "1px solid #c4b5fd",
    borderRadius: "4px",
    padding: "10px 12px",
    marginBottom: "12px",
    background: "white",
  },
  amtField: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #c4b5fd",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  currency: {
    padding: "0 12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#a78bfa",
    background: "#faf9ff",
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
    borderRight: "1px solid #c4b5fd",
    flexShrink: 0,
  },
  amtInput: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "14px",
    fontWeight: "500",
    color: colors.dark,
    fontFamily: "'Poppins', sans-serif",
    background: "white",
    width: "100%",
  },

  errMsg: {
    fontSize: "12.5px",
    color: "#ef4444",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "8px 12px",
    margin: "0 0 12px",
  },
  okMsg: {
    fontSize: "12.5px",
    color: "#16a34a",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    padding: "8px 12px",
    margin: "0 0 12px",
  },
  hint: {
    fontSize: "11px",
    color: "#bbb",
    margin: "10px 0 0",
  },
  btnFilled: {
    width: "100%",
    padding: "10px",
    background: colors.purple,
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  btnGhost: {
    width: "100%",
    padding: "10px",
    background: "white",
    color: colors.purple,
    border: `1px solid ${colors.purple}`,
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
  },
  historyCard: {
    background: "white",
    border: `1px solid ${colors.border}`,
    borderRadius: "4px",
    padding: "20px 22px",
    maxWidth: "720px",
  },
  txnRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 0",
  },
  txnBorder: {
    borderBottom: `1px solid ${colors.rowLine}`,
  },
  txnLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  txnSign: {
    width: 28,
    height: 28,
    borderRadius: 0,
    background: colors.rowLine,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    flexShrink: 0,
  },
  txnLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: colors.dark,
    margin: "0 0 2px",
  },
  txnNote: {
    fontSize: "11.5px",
    color: "#bbb",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  txnRight: {
    textAlign: "right",
    flexShrink: 0,
  },
  txnAmount: {
    display: "block",
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "2px",
  },
  txnMeta: {
    display: "flex",
    gap: "6px",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  txnDate: {
    fontSize: "11px",
    color: "#bbb",
  },
  txnStatus: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#f59e0b",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "4px",
    padding: "1px 6px",
  },

  muted: {
    fontSize: "13px",
    color: "#bbb",
    margin: 0,
  },
};

export default WalletPage;
