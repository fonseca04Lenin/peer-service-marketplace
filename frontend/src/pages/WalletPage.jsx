import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";
import { colors } from "../constants";

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

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function WalletPage() {
  const [balance,     setBalance]     = useState(null);
  const [escrow,      setEscrow]      = useState(null);
  const [txns,        setTxns]        = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // this isthe deposit form state!!!!
  const [depositAmt,  setDepositAmt]  = useState("");
  const [depositing,  setDepositing]  = useState(false);
  const [depositErr,  setDepositErr]  = useState("");
  const [depositOk,   setDepositOk]   = useState(false);
  // thsis is the withdraw one!!
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawErr, setWithdrawErr] = useState("");
  const [withdrawOk,  setWithdrawOk]  = useState(false);

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

  async function handleDeposit(e) {
    e.preventDefault();
    setDepositErr("");
    setDepositOk(false);

    const amt = parseFloat(depositAmt);
    if (!depositAmt || isNaN(amt) || amt <= 0) {
      setDepositErr("Enter a valid amount.");
      return;
    }

    setDepositing(true);
    try {
      const res  = await apiFetch("/payments/deposit/", {
        method: "POST",
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) { setDepositErr(data.error || "Deposit failed."); return; }
      setBalance(data.balance);
      setDepositAmt("");
      setDepositOk(true);
      load();
    } catch {
      setDepositErr("Something went wrong. Try again.");
    } finally {
      setDepositing(false);
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    setWithdrawErr("");
    setWithdrawOk(false);

    const amt = parseFloat(withdrawAmt);
    if (!withdrawAmt || isNaN(amt) || amt <= 0) {
      setWithdrawErr("Enter a valid amount.");
      return;
    }

    setWithdrawing(true);
    try {
      const res  = await apiFetch("/payments/withdraw/", {
        method: "POST",
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) { setWithdrawErr(data.error || "Withdrawal failed."); return; }
      setBalance(data.new_balance);
      setWithdrawAmt("");
      setWithdrawOk(true);
      load();
    } catch {
      setWithdrawErr("Something went wrong. Try again.");
    } finally {
      setWithdrawing(false);
    }
  }

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

        <div style={s.panel}>
          <p style={s.panelTitle}>Add funds</p>
          <form onSubmit={handleDeposit}>
            <div style={s.amtField}>
              <span style={s.currency}>$</span>
              <input
                type="number"
                min="5"
                max="5000"
                step="0.01"
                placeholder="0.00"
                value={depositAmt}
                onChange={e => {
                  setDepositAmt(e.target.value);
                  setDepositErr("");
                  setDepositOk(false);
                }}
                style={s.amtInput}
              />
            </div>
            {depositErr && <p style={s.errMsg}>{depositErr}</p>}
            {depositOk  && <p style={s.okMsg}>Funds added successfully.</p>}
            <button type="submit" style={s.btnFilled} disabled={depositing}>
              {depositing ? "Processing…" : "Add to wallet"}
            </button>
            <p style={s.hint}>Minimum $5 · Maximum $5,000 per deposit</p>
          </form>
        </div>

        <div style={s.panel}>
          <p style={s.panelTitle}>Withdraw earnings</p>
          <form onSubmit={handleWithdraw}>
            <div style={s.amtField}>
              <span style={s.currency}>$</span>
              <input
                type="number"
                min="10"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmt}
                onChange={e => {
                  setWithdrawAmt(e.target.value);
                  setWithdrawErr("");
                  setWithdrawOk(false);
                }}
                style={s.amtInput}
              />
            </div>
            {withdrawErr && <p style={s.errMsg}>{withdrawErr}</p>}
            {withdrawOk  && <p style={s.okMsg}>Withdrawal requested. Allow 3–5 business days.</p>}
            <button type="submit" style={s.btnGhost} disabled={withdrawing}>
              {withdrawing ? "Processing…" : "Request withdrawal"}
            </button>
            <p style={s.hint}>Minimum $10 · Processed in 3–5 business days</p>
          </form>
        </div>

      </div>

      {/* transaction history Code */}
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
