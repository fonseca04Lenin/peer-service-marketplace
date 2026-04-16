import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../api";
import { colors } from "../constants";

function displayName(u) {
  if (!u) return "Unknown";
  return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "Unknown";
}

function getInitials(u) {
  const name = displayName(u);
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function formatSidebarTime(iso) {
  if (!iso) return "";
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  if (diff < 7)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatBubbleTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function Avatar({ user, size = 36 }) {
  if (user?.profile_picture) {
    return (
      <img
        src={user.profile_picture}
        alt={getInitials(user)}
        style={{
          width: size, height: size,
          borderRadius: "50%", objectFit: "cover", flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${colors.purple}, ${colors.gradientEnd})`,
      color: "white", fontWeight: "700",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, flexShrink: 0,
      fontFamily: "'Poppins', sans-serif",
    }}>
      {getInitials(user)}
    </div>
  );
}

function MessagesPage({ currentUser }) {
  const [conversations,  setConversations]  = useState([]);
  const [loadingConvos,  setLoadingConvos]  = useState(true);
  const [activeUserId,   setActiveUserId]   = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [draft,          setDraft]          = useState("");
  const [sending,        setSending]        = useState(false);
  const [sendError,      setSendError]      = useState("");
  const [safetyDismissed, setSafetyDismissed] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const myId = currentUser?.id ?? currentUser?.pk;

  const activeConvo = conversations.find(c => c.other_user?.id === activeUserId);

  const loadConversations = useCallback(() => {
    apiFetch("/messaging/")
      .then(r => r.ok ? r.json() : [])
      .then(data => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvos(false));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    loadConversations();
  }, [currentUser, loadConversations]);

  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(loadConversations, 6000);
    return () => clearInterval(id);
  }, [currentUser, loadConversations]);

  useEffect(() => {
    if (!activeUserId) return;
    const id = setInterval(() => {
      apiFetch(`/messaging/${activeUserId}/`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!Array.isArray(data)) return;
          setMessages(prev => {
            const noChange =
              data.length === prev.length &&
              (data.length === 0 || data[data.length - 1].id === prev[prev.length - 1].id);
            return noChange ? prev : data;
          });
          setConversations(prev => {
            const convo = prev.find(c => c.other_user?.id === activeUserId);
            if (!convo || convo.unread_count === 0) return prev;
            return prev.map(c =>
              c.other_user?.id === activeUserId ? { ...c, unread_count: 0 } : c
            );
          });
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [activeUserId]);

  function openConversation(userId) {
    if (userId === activeUserId) return;
    setActiveUserId(userId);
    setMessages([]);
    setDraft("");
    setSendError("");
    setSafetyDismissed(false);
    setLoadingMsgs(true);

    apiFetch(`/messaging/${userId}/`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        setConversations(prev =>
          prev.map(c => c.other_user?.id === userId ? { ...c, unread_count: 0 } : c)
        );
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const body = draft.trim();
    if (!body || !activeUserId || sending) return;
    setSending(true);
    setSendError("");
    try {
      const res = await apiFetch(`/messaging/${activeUserId}/`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send.");
      }
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setDraft("");
      loadConversations();
    } catch (e) {
      setSendError(e.message || "Could not send message.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!currentUser) {
    return (
      <div style={s.page}>
        <div style={s.emptyState}>
          <p style={s.emptyTitle}>Sign in to view your messages</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>

      <div style={s.sidebar}>
        <div style={s.sideHeader}>
          <h2 style={s.sideTitle}>Messages</h2>
        </div>

        {loadingConvos ? (
          <p style={s.muted}>Loading…</p>
        ) : conversations.length === 0 ? (
          <div style={s.emptyConvos}>
            <p style={{ fontSize: "13px", fontWeight: "600", color: colors.dark, margin: "0 0 6px" }}>
              No conversations yet
            </p>
            <p style={s.muted}>
              When someone messages you or you reach out to a provider, your chats will show up here.
            </p>
          </div>
        ) : (
          <div style={s.convoList}>
            {conversations.map(c => {
              const u      = c.other_user;
              const last   = c.last_message;
              const isOpen = u?.id === activeUserId;
              const isMine = last?.sender?.id === myId;

              return (
                <div
                  key={u?.id}
                  style={{ ...s.convoCard, ...(isOpen ? s.convoCardActive : {}) }}
                  onClick={() => openConversation(u?.id)}
                >
                  <Avatar user={u} size={42} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: c.unread_count > 0 ? "700" : "600",
                        color: colors.dark,
                      }}>
                        {displayName(u)}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "#bbb", flexShrink: 0, marginLeft: "8px" }}>
                        {formatSidebarTime(last?.created_at)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: "11.5px", margin: 0, lineHeight: 1.4,
                      color: c.unread_count > 0 ? "#444" : "#bbb",
                      fontWeight: c.unread_count > 0 ? "500" : "400",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {isMine && <span style={{ color: "#ccc" }}>You: </span>}
                      {last?.body || ""}
                    </p>
                  </div>

                  {c.unread_count > 0 && (
                    <span style={s.unreadBadge}>{c.unread_count}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={s.chatArea}>
        {!activeUserId ? (

          <div style={s.selectPrompt}>
            <div style={s.selectIcon}>✉</div>
            <p style={{ fontSize: "15px", fontWeight: "600", color: colors.dark, margin: "0 0 6px" }}>
              Pick a conversation
            </p>
            <p style={s.muted}>Select a chat on the left to read and reply.</p>
          </div>

        ) : (
          <>
            <div style={s.chatHeader}>
              <Avatar user={activeConvo?.other_user} size={36} />
              <div>
                <p style={s.chatName}>{displayName(activeConvo?.other_user)}</p>
                <p style={s.chatSub}>@{activeConvo?.other_user?.username}</p>
              </div>
            </div>

            {!safetyDismissed && (
              <div style={s.safetyBanner}>
                <span style={s.safetyIcon}>⚠</span>
                <p style={s.safetyText}>
                  <strong>Stay safe.</strong> You may be talking to someone you&apos;ve never , you might get touch-met never share passwords, home addresses, or banking details in chat. Keep all payments and agreements on the platform. If anything feels off, trust your gut and stop responding.
                </p>
                <button style={s.safetyBtn} onClick={() => setSafetyDismissed(true)}>
                  Got it
                </button>
              </div>
            )}

            <div style={s.msgThread}>
              {loadingMsgs ? (
                <p style={{ ...s.muted, textAlign: "center", paddingTop: "48px" }}>Loading…</p>
              ) : messages.length === 0 ? (
                <p style={{ ...s.muted, textAlign: "center", paddingTop: "48px" }}>
                  Nothing yet — send the first message.
                </p>
              ) : (
                messages.map((msg, i) => {
                  const mine      = msg.sender?.id === myId;
                  const prev      = messages[i - 1];
                  const newDay    = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                  const sameAuthor = prev && prev.sender?.id === msg.sender?.id && !newDay;

                  return (
                    <div key={msg.id}>
                      {newDay && (
                        <div style={s.dateSep}>
                          <span style={s.dateSepText}>{formatDateLabel(msg.created_at)}</span>
                        </div>
                      )}

                      <div style={{
                        ...s.bubbleRow,
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginTop: sameAuthor ? "3px" : "12px",
                      }}>
                        {!mine && (
                          <div style={{ width: 28, flexShrink: 0 }}>
                            {!sameAuthor && <Avatar user={msg.sender} size={26} />}
                          </div>
                        )}

                        <div style={{
                          maxWidth: "62%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: mine ? "flex-end" : "flex-start",
                          gap: "2px",
                        }}>
                          <div style={{
                            ...s.bubble,
                            ...(mine ? s.bubbleMine : s.bubbleTheirs),
                            borderTopLeftRadius:  (!mine && sameAuthor) ? "4px" : "16px",
                            borderTopRightRadius: (mine  && sameAuthor) ? "4px" : "16px",
                          }}>
                            {msg.body}
                          </div>
                          {(i === messages.length - 1 || messages[i + 1]?.sender?.id !== msg.sender?.id) && (
                            <span style={s.bubbleTime}>{formatBubbleTime(msg.created_at)}</span>
                          )}
                        </div>

                        {mine && (
                          <div style={{ width: 28, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
                            {!sameAuthor && <Avatar user={currentUser} size={26} />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div style={s.inputArea}>
              {sendError && <p style={s.sendError}>{sendError}</p>}
              <div style={s.inputRow}>
                <textarea
                  ref={inputRef}
                  style={s.textarea}
                  placeholder="Write a message…"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={2000}
                />
                <button
                  style={{
                    ...s.sendBtn,
                    ...(!draft.trim() || sending ? s.sendBtnDisabled : {}),
                  }}
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                >
                  {sending ? "…" : "Send"}
                </button>
              </div>
              <p style={s.inputHint}>Enter to send · Shift + Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    height: "100%",
    fontFamily: "'Poppins', sans-serif",
    overflow: "hidden",
    background: colors.pageBg,
  },

  sidebar: {
    width: "290px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    background: "white",
    borderRight: `1px solid ${colors.border}`,
    overflowY: "auto",
  },
  sideHeader: {
    padding: "22px 20px 14px",
    borderBottom: `1px solid ${colors.border}`,
    position: "sticky",
    top: 0,
    background: "white",
    zIndex: 1,
  },
  sideTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: colors.dark,
    margin: 0,
  },
  convoList: {
    display: "flex",
    flexDirection: "column",
  },
  convoCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "13px 20px",
    borderBottom: "1px solid #f7f5ff",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  convoCardActive: {
    background: colors.border,
  },
  unreadBadge: {
    background: colors.purple,
    color: "white",
    fontSize: "10px",
    fontWeight: "700",
    borderRadius: 0,
    padding: "2px 7px",
    flexShrink: 0,
  },
  emptyConvos: {
    padding: "28px 20px",
  },

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "#faf9ff",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 22px",
    background: "white",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  chatName: {
    fontSize: "14px",
    fontWeight: "700",
    color: colors.dark,
    margin: 0,
  },
  chatSub: {
    fontSize: "11px",
    color: "#bbb",
    margin: 0,
  },

  safetyBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    margin: "12px 20px 0",
    padding: "12px 14px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "4px",
    flexShrink: 0,
  },
  safetyIcon: {
    fontSize: "14px",
    flexShrink: 0,
    marginTop: "1px",
    color: "#b45309",
  },
  safetyText: {
    flex: 1,
    fontSize: "12px",
    color: "#78350f",
    lineHeight: 1.55,
    margin: 0,
  },
  safetyBtn: {
    background: "none",
    border: "1px solid #fcd34d",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#92400e",
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "'Poppins', sans-serif",
  },

  msgThread: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 22px 8px",
    display: "flex",
    flexDirection: "column",
  },

  dateSep: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "16px 0 4px",
  },
  dateSepText: {
    fontSize: "10.5px",
    fontWeight: "600",
    color: "#ccc",
    background: "#faf9ff",
    padding: "2px 12px",
    borderRadius: 0,
    border: `1px solid ${colors.border}`,
  },

  bubbleRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
  },
  bubble: {
    padding: "9px 13px",
    fontSize: "13.5px",
    lineHeight: 1.5,
    borderRadius: "4px",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },
  bubbleMine: {
    background: colors.purple,
    color: "white",
  },
  bubbleTheirs: {
    background: "white",
    color: colors.dark,
    border: `1px solid ${colors.border}`,
  },
  bubbleTime: {
    fontSize: "10px",
    color: "#ccc",
    margin: "0 2px",
  },

  inputArea: {
    padding: "12px 20px 16px",
    background: "white",
    borderTop: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: `1px solid ${colors.border}`,
    borderRadius: "4px",
    padding: "10px 14px",
    fontSize: "13.5px",
    fontFamily: "'Poppins', sans-serif",
    color: colors.dark,
    background: "#faf9ff",
    outline: "none",
    lineHeight: 1.5,
    maxHeight: "120px",
    overflowY: "auto",
  },
  sendBtn: {
    background: colors.purple,
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    flexShrink: 0,
  },
  sendBtnDisabled: {
    background: "#d4c8ff",
    cursor: "default",
  },
  inputHint: {
    fontSize: "10.5px",
    color: "#ccc",
    margin: "6px 0 0",
  },
  sendError: {
    fontSize: "12px",
    color: "#dc2626",
    margin: "0 0 6px",
  },

  emptyState: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#bbb",
    margin: 0,
  },
  selectPrompt: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "40px",
  },
  selectIcon: {
    fontSize: "32px",
    marginBottom: "4px",
    opacity: 0.18,
  },
  muted: {
    fontSize: "12.5px",
    color: "#bbb",
    margin: 0,
    lineHeight: 1.6,
    textAlign: "center",
  },
};

export default MessagesPage;
