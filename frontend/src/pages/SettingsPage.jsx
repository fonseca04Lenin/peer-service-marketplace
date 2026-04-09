import { useState, useEffect } from "react";
import { apiFetch } from "../api";

const PURPLE = "rgb(83, 58, 253)";
const DARK   = "#0f0620";

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ ...s.track, background: on ? PURPLE : "#d1d5db" }}>
      <div style={{ ...s.thumb, transform: on ? "translateX(20px)" : "translateX(2px)" }} />
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div style={s.settingRow}>
      <div style={{ flex: 1 }}>
        <p style={s.settingLabel}>{label}</p>
        <p style={s.settingDesc}>{desc}</p>
      </div>
      <div style={s.settingControl}>{children}</div>
    </div>
  );
}

function SettingsPage({ currentUser, onLogout }) {
  const [profilePublic,  setProfilePublic]  = useState(true);
  const [messagingPref,  setMessagingPref]  = useState("anyone");
  const [showModal,      setShowModal]      = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState("");
  const [saving,         setSaving]         = useState(false);

  // Load current preferences from API
  useEffect(() => {
    apiFetch("/users/me/")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        setProfilePublic(data.profile_public ?? true);
        setMessagingPref(data.messaging_pref ?? "anyone");
      });
  }, []);

  function patch(fields) {
    setSaving(true);
    apiFetch("/users/me/", {
      method: "PATCH",
      body: JSON.stringify(fields),
    }).finally(() => setSaving(false));
  }

  function handleTogglePublic() {
    const next = !profilePublic;
    setProfilePublic(next);
    patch({ profile_public: next });
  }

  function handleMessagingChange(e) {
    const next = e.target.value;
    setMessagingPref(next);
    patch({ messaging_pref: next });
  }

  function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    apiFetch("/users/me/", { method: "DELETE" }).then(() => onLogout?.());
  }

  return (
    <div style={s.page}>
      <div style={s.headerRow}>
        <h1 style={s.title}>Settings</h1>
        {saving && <span style={s.savingText}>Saving...</span>}
      </div>

      {/* Privacy */}
      <div style={s.section}>
        <p style={s.sectionLabel}>Privacy</p>

        <SettingRow
          label="Public Profile"
          desc="When off, only users you've booked with can see your profile"
        >
          <Toggle on={profilePublic} onToggle={handleTogglePublic} />
        </SettingRow>

        <SettingRow
          label="Who can message you"
          desc="Restrict who is allowed to send you direct messages"
        >
          <select
            style={s.select}
            value={messagingPref}
            onChange={handleMessagingChange}
          >
            <option value="anyone">Anyone</option>
            <option value="booked_only">Only after a booking</option>
          </select>
        </SettingRow>
      </div>

      {/* Danger Zone */}
      <div style={{ ...s.section, borderColor: "#fecaca" }}>
        <p style={{ ...s.sectionLabel, color: "#ef4444" }}>Danger Zone</p>

        <SettingRow
          label="Delete Account"
          desc="Permanently remove your account, services, bookings, and all associated data"
        >
          <button style={s.deleteBtn} onClick={() => setShowModal(true)}>
            Delete Account
          </button>
        </SettingRow>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Delete your account?</h2>
            <p style={s.modalBody}>
              This is permanent and cannot be undone. All your services, bookings,
              messages, and reviews will be erased.
            </p>
            <p style={s.modalPrompt}>
              Type <strong>DELETE</strong> to confirm
            </p>
            <input
              style={s.input}
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
            <div style={s.modalActions}>
              <button
                style={s.cancelBtn}
                onClick={() => { setShowModal(false); setDeleteConfirm(""); }}
              >
                Cancel
              </button>
              <button
                style={{
                  ...s.deleteBtn,
                  opacity: deleteConfirm === "DELETE" ? 1 : 0.4,
                  cursor:  deleteConfirm === "DELETE" ? "pointer" : "not-allowed",
                }}
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    padding: "36px 32px",
    fontFamily: "'Poppins', sans-serif",
    background: "#f7f6ff",
    minHeight: "100%",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "14px",
    marginBottom: "28px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: DARK,
    margin: 0,
  },
  savingText: {
    fontSize: "12px",
    color: "#a78bfa",
    fontWeight: "500",
  },
  section: {
    background: "white",
    border: "1px solid #ede9fe",
    padding: "20px 24px",
    marginBottom: "18px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#a78bfa",
    margin: "0 0 16px",
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    padding: "14px 0",
    borderBottom: "1px solid #f3f0ff",
  },
  settingLabel: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: DARK,
    margin: "0 0 3px",
  },
  settingDesc: {
    fontSize: "12px",
    color: "#888",
    margin: 0,
  },
  settingControl: {
    flexShrink: 0,
  },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
    flexShrink: 0,
  },
  thumb: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    transition: "transform 0.2s",
  },
  select: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "12.5px",
    color: DARK,
    background: "#faf9ff",
    border: "1px solid #ede9fe",
    borderRadius: "8px",
    padding: "7px 12px",
    cursor: "pointer",
    outline: "none",
  },
  deleteBtn: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "12.5px",
    fontWeight: "600",
    color: "white",
    background: "#ef4444",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,6,32,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: DARK,
    margin: "0 0 12px",
  },
  modalBody: {
    fontSize: "13.5px",
    color: "#555",
    lineHeight: 1.6,
    margin: "0 0 16px",
  },
  modalPrompt: {
    fontSize: "13px",
    color: DARK,
    margin: "0 0 10px",
  },
  input: {
    fontFamily: "'Poppins', sans-serif",
    width: "100%",
    boxSizing: "border-box",
    fontSize: "13.5px",
    padding: "10px 14px",
    border: "1px solid #fca5a5",
    borderRadius: "8px",
    outline: "none",
    marginBottom: "20px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  cancelBtn: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "12.5px",
    fontWeight: "500",
    color: "#888",
    background: "none",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
  },
};

export default SettingsPage;
