import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import { COUNTRIES } from "../constants";

const DARK = "#0f0620";
const PURPLE = "rgb(83, 58, 253)";

function EditableRow({ field, label, display, inputType = 'text', options = null,
                       editingField, editValue, editError, saving,
                       onEdit, onSave, onCancel, onValueChange }) {
  const isEditing = editingField === field;
  return (
    <div style={s.fieldRow}>
      <div style={{ flex: 1 }}>
        <p style={s.fieldLabel}>{label}</p>
        {isEditing ? (
          <div>
            {options ? (
              <select
                value={editValue}
                onChange={e => onValueChange(e.target.value)}
                style={s.editInput}
                autoFocus
              >
                {options.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={inputType}
                value={editValue}
                onChange={e => onValueChange(e.target.value)}
                style={s.editInput}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') onSave(field); if (e.key === 'Escape') onCancel(); }}
              />
            )}
            {editError && <p style={s.editError}>{editError}</p>}
            <div style={s.editActions}>
              <button onClick={() => onSave(field)} disabled={saving} style={s.saveBtn}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={onCancel} style={s.cancelBtn}>Cancel</button>
            </div>
          </div>
        ) : (
          <p style={s.fieldValue}>{display || <span style={s.empty}>—</span>}</p>
        )}
      </div>
      {!isEditing && (
        <span style={s.editBtn} onClick={() => onEdit(field)}>Edit</span>
      )}
    </div>
  );
}

function AccountPage({ currentUser, onSelectService }) {
  const [user,         setUser]         = useState(currentUser);
  const [services,     setServices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [editValue,    setEditValue]    = useState('');
  const [editError,    setEditError]    = useState('');
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    apiFetch("/users/me/")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setUser(data);
        if (data.role === "provider") {
          return apiFetch(`/services/?provider=${data.id}`)
            .then(r => r.ok ? r.json() : [])
            .then(setServices);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function startEdit(field) {
    setEditingField(field);
    setEditValue(user[field] ?? '');
    setEditError('');
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue('');
    setEditError('');
  }

  async function saveEdit(field) {
    setSaving(true);
    setEditError('');
    try {
      const res = await apiFetch('/users/me/', {
        method: 'PATCH',
        body: JSON.stringify({ [field]: editValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Object.values(data)[0];
        setEditError(Array.isArray(msg) ? msg[0] : String(msg));
        return;
      }
      setUser(data);
      setEditingField(null);
    } catch {
      setEditError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) return <div style={s.page}><p style={s.muted}>Not logged in.</p></div>;
  if (loading)      return <div style={s.page}><p style={s.muted}>Loading…</p></div>;

  const isProvider  = user.role === "provider";
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
  const skillList   = user.skills ? user.skills.split(",").map(sk => sk.trim()).filter(Boolean) : [];

  const formatDob = dob => {
    if (!dob) return null;
    const d = new Date(dob);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const rowProps = { editingField, editValue, editError, saving, onEdit: startEdit, onSave: saveEdit, onCancel: cancelEdit, onValueChange: setEditValue };

  return (
    <div style={s.page}>

      {/* Top bar */}
      <div style={s.topBar}>
        <h1 style={s.welcome}>Welcome back, {displayName}</h1>
        <div style={s.walletPill}>
          <span style={s.walletLabel}>Balance</span>
          <span style={s.walletAmount}>${parseFloat(user.wallet_balance || 0).toFixed(2)}</span>
        </div>
      </div>

      {(user.city || user.country || user.tagline) && (
        <div style={s.subRow}>
          {(user.city || user.country) && (
            <span style={s.sub}>
              {[user.city, user.country].filter(Boolean).join(", ")}
            </span>
          )}
          {user.tagline && <span style={s.tagline}>{user.tagline}</span>}
        </div>
      )}

      <hr style={s.topDivider} />

      {/*Usernamee */}
      <div style={s.row}>
        <span style={s.rowLabel}>Username</span>
        <div style={s.rowFields}>
          <EditableRow {...rowProps} field="username" label="Username" display={user.username} />
        </div>
      </div>

      <hr style={s.rowDivider} />

      {/*Account type */}
      <div style={s.row}>
        <span style={s.rowLabel}>Account type</span>
        <div style={s.rowFields}>
          <EditableRow
            {...rowProps}
            field="role"
            label="Role"
            display={isProvider ? "Service Provider" : "Customer"}
            options={[
              { value: 'requester', label: 'Customer' },
              { value: 'provider', label: 'Service Provider' },
            ]}
          />
        </div>
      </div>

      <hr style={s.rowDivider} />

      {/* Contact informationn */}
      <div style={s.row}>
        <span style={s.rowLabel}>Contact info</span>
        <div style={s.rowFields}>
          <EditableRow {...rowProps} field="email" label="Email address" display={user.email} inputType="email" />
          <hr style={s.subDivider} />
          <EditableRow {...rowProps} field="phone" label="Phone number" display={user.phone} inputType="tel" />
        </div>
      </div>

      <hr style={s.rowDivider} />

      {/* Personal information */}
      <div style={s.row}>
        <span style={s.rowLabel}>Personal info</span>
        <div style={s.rowFields}>
          <EditableRow {...rowProps} field="address" label="Address" display={user.address} />
          <hr style={s.subDivider} />
          <EditableRow
            {...rowProps}
            field="date_of_birth"
            label="Date of birth"
            display={formatDob(user.date_of_birth)}
            inputType="date"
          />
          <hr style={s.subDivider} />
          <EditableRow
            {...rowProps}
            field="country"
            label="Country"
            display={user.country}
            options={COUNTRIES.map(c => ({ value: c, label: c }))}
          />
          <hr style={s.subDivider} />
          <EditableRow {...rowProps} field="city" label="City" display={user.city} />
        </div>
      </div>

      {/* Provider sections */}
      {isProvider && (
        <>
          <hr style={s.rowDivider} />

          {skillList.length > 0 && (
            <>
              <div style={s.row}>
                <span style={s.rowLabel}>Skills</span>
                <div style={s.rowFields}>
                  <div style={s.fieldRow}>
                    <div style={s.chips}>
                      {skillList.map(skill => (
                        <span key={skill} style={s.chip}>{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <hr style={s.rowDivider} />
            </>
          )}

          <div style={s.row}>
            <span style={s.rowLabel}>Your listings</span>
            <div style={s.rowFields}>
              {services.length === 0 ? (
                <p style={s.muted}>No listings yet — click "Offer Services" to add one.</p>
              ) : (
                services.map((svc, i) => (
                  <div key={svc.id}>
                    {i > 0 && <hr style={s.subDivider} />}
                    <div style={s.fieldRow} onClick={() => onSelectService?.(svc.id)}>
                      <div>
                        <p style={s.fieldLabel}>{svc.category}</p>
                        <p style={s.fieldValue}>{svc.title}</p>
                        <p style={s.fieldSub}>{svc.description}</p>
                      </div>
                      <span style={s.fieldPrice}>${parseFloat(svc.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}

const s = {
  page: {
    padding: "20px 40px",
    fontFamily: "'Poppins', sans-serif",
    background: "#f7f6ff",
    minHeight: "100%",
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  welcome: {
    fontSize: "22px",
    fontWeight: "700",
    color: DARK,
    margin: 0,
  },
  walletPill: {
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "10px",
    padding: "10px 18px",
    textAlign: "center",
    flexShrink: 0,
  },
  walletLabel: {
    display: "block",
    fontSize: "10px",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "2px",
  },
  walletAmount: {
    fontSize: "18px",
    fontWeight: "700",
    color: DARK,
  },
  subRow: {
    display: "flex",
    gap: "14px",
    marginBottom: "16px",
  },
  sub: { fontSize: "13px", color: "#888" },
  tagline: { fontSize: "13px", color: "#555" },
  topDivider: { border: "none", borderTop: "1px solid #e5e7eb", margin: "0 0 0" },
  rowDivider: { border: "none", borderTop: "1px solid #e5e7eb", margin: 0 },
  subDivider: { border: "none", borderTop: "1px solid #f0f0f0", margin: "14px 0" },
  row: {
    display: "flex",
    alignItems: "flex-start",
    padding: "22px 0",
    gap: "32px",
  },
  rowLabel: {
    width: 200,
    flexShrink: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: DARK,
    paddingTop: "2px",
  },
  rowFields: { flex: 1 },
  fieldRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
  },
  fieldLabel: { fontSize: "13px", color: "#aaa", margin: "0 0 3px" },
  fieldValue: { fontSize: "15px", fontWeight: "500", color: DARK, margin: 0 },
  fieldSub: { fontSize: "12.5px", color: "#888", margin: "2px 0 0" },
  fieldPrice: { fontSize: "15px", fontWeight: "700", color: DARK, flexShrink: 0 },
  editBtn: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#3b82f6",
    cursor: "pointer",
    flexShrink: 0,
    paddingTop: "2px",
  },
  empty: { color: "#d1d5db", fontWeight: "400" },
  editInput: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "14px",
    padding: "7px 10px",
    border: "1px solid #c4b5fd",
    borderRadius: "6px",
    outline: "none",
    color: DARK,
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "8px",
  },
  editActions: { display: "flex", gap: "8px" },
  saveBtn: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "12.5px",
    fontWeight: "600",
    background: PURPLE,
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "6px 14px",
    cursor: "pointer",
  },
  cancelBtn: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "12.5px",
    fontWeight: "500",
    background: "none",
    color: "#888",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "6px 14px",
    cursor: "pointer",
  },
  editError: {
    fontSize: "12px",
    color: "#ef4444",
    margin: "0 0 8px",
  },
  chips: { display: "flex", flexWrap: "wrap", gap: "7px", flex: 1 },
  chip: {
    background: "white",
    border: "1px solid #ddd6fe",
    color: "#555",
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: "12.5px",
  },
  muted: { fontSize: "13.5px", color: "#aaa", margin: 0 },
};

export default AccountPage;
