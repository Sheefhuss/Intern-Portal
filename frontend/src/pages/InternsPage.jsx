import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { COLORS, S } from "../utils/theme";

const domainColor = {
  Frontend: "#3B82F6", Backend: "#10B981", "Full Stack": "#8B5CF6",
  Design: "#F59E0B", DevOps: "#EF4444", "ML/AI": "#06B6D4",
};

export default function InternsPage({ session }) {
  const role = session?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isHR    = role === "hr";

  const [pending, setPending]       = useState([]);
  const [active, setActive]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [forwarding, setForwarding] = useState(null);
  const [tab, setTab]               = useState("pending");

  // Batch editing state
  const [editingBatch, setEditingBatch]   = useState(null); // intern id
  const [batchInput, setBatchInput]       = useState("");
  const [savingBatch, setSavingBatch]     = useState(false);

  // Announcement state
  const [annText, setAnnText]         = useState("");
  const [annRole, setAnnRole]         = useState("all");
  const [annPosting, setAnnPosting]   = useState(false);
  const [annSuccess, setAnnSuccess]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pend, act] = await Promise.all([
        AuthService.apiFetch("/auth/applications/pending"),
        AuthService.apiFetch("/auth/interns"),
      ]);
      setPending(pend);
      setActive(act);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const forward = async (id) => {
    setForwarding(id);
    try {
      await AuthService.apiFetch(`/auth/applications/${id}/forward`, { method: "PATCH" });
      await load();
    } catch (err) { alert(err.message); }
    finally { setForwarding(null); }
  };

  const saveBatch = async (id) => {
    if (!batchInput.trim()) return alert("Batch cannot be empty.");
    setSavingBatch(true);
    try {
      const updated = await AuthService.apiFetch(`/auth/interns/${id}/batch`, {
        method: "PATCH",
        body: JSON.stringify({ batch: batchInput }),
      });
      setActive(prev => prev.map(u => u._id === id ? { ...u, batch: updated.user.batch } : u));
      setEditingBatch(null);
      setBatchInput("");
    } catch (err) { alert(err.message); }
    finally { setSavingBatch(false); }
  };

  const sendAnnouncement = async () => {
    if (!annText.trim()) return alert("Announcement text is required.");
    setAnnPosting(true);
    try {
      await AuthService.apiFetch("/announcements", {
        method: "POST",
        body: JSON.stringify({ text: annText, role: annRole }),
      });
      setAnnText("");
      setAnnSuccess(true);
      setTimeout(() => setAnnSuccess(false), 3000);
    } catch (err) { alert(err.message); }
    finally { setAnnPosting(false); }
  };

  const inputStyle = {
    padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
    fontSize: 13, fontFamily: "inherit", outline: "none",
  };

  if (loading) return <div style={{ color: "#6B7280", padding: 20 }}>Loading…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Announcement Panel (HR + Admin) ── */}
      {(isAdmin || isHR) && (
        <div style={{ ...S.card, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#111827" }}>
            📢 Send Announcement
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              value={annText}
              onChange={e => setAnnText(e.target.value)}
              placeholder="Write your announcement here…"
              rows={3}
              style={{ ...inputStyle, width: "100%", resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={annRole}
                onChange={e => setAnnRole(e.target.value)}
                style={{ ...inputStyle, minWidth: 160 }}
              >
                <option value="all">Everyone</option>
                <option value="intern">Interns only</option>
                <option value="hr">HR only</option>
                <option value="admin">Admin only</option>
              </select>
              <button
                onClick={sendAnnouncement}
                disabled={annPosting}
                style={{
                  padding: "9px 20px", background: "#7C3AED", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: annPosting ? "not-allowed" : "pointer",
                  opacity: annPosting ? 0.7 : 1, fontFamily: "inherit",
                }}
              >
                {annPosting ? "Sending…" : "Send Announcement"}
              </button>
              {annSuccess && (
                <span style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}>
                  ✓ Announcement sent!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          ["pending", `Pending Review (${pending.length})`],
          ["active",  `Active Interns (${active.length})`],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "9px 20px", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === id ? "#7C3AED" : "#fff",
            color:      tab === id ? "#fff"    : "#6B7280",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}>{label}</button>
        ))}
      </div>

      {/* ── Pending Applications ── */}
      {tab === "pending" && (
        <div style={S.card}>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>📋 Pending Intern Applications</div>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>
            Review applicants and forward approved ones to Admin.
          </p>
          {pending.length === 0 ? (
            <div style={{ textAlign: "center", color: COLORS.muted, padding: "32px 0", fontSize: 13 }}>
              No pending applications.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: COLORS.muted, textAlign: "left", borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: "8px 12px" }}>Name</th>
                  <th style={{ padding: "8px 12px" }}>Email</th>
                  <th style={{ padding: "8px 12px" }}>Domain</th>
                  <th style={{ padding: "8px 12px" }}>Applied</th>
                  <th style={{ padding: "8px 12px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(u => (
                  <tr key={u._id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px" }}><strong>{u.name}</strong></td>
                    <td style={{ padding: "12px", color: COLORS.muted }}>{u.email}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        background: (domainColor[u.domain] || "#6B7280") + "22",
                        color: domainColor[u.domain] || "#6B7280",
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>{u.domain}</span>
                    </td>
                    <td style={{ padding: "12px", color: COLORS.muted }}>
                      {new Date(u.appliedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => forward(u._id)}
                        disabled={forwarding === u._id}
                        style={{
                          background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                          color: "#fff", border: "none", borderRadius: 7,
                          padding: "6px 14px", fontSize: 12, fontWeight: 600,
                          cursor: forwarding === u._id ? "not-allowed" : "pointer",
                          fontFamily: "inherit", opacity: forwarding === u._id ? 0.6 : 1,
                        }}
                      >
                        {forwarding === u._id ? "Forwarding…" : "Forward to Admin →"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Active Interns ── */}
      {tab === "active" && (
        <div style={S.card}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>👥 Active Intern Registry</div>
          {active.length === 0 ? (
            <div style={{ textAlign: "center", color: COLORS.muted, padding: "32px 0", fontSize: 13 }}>
              No active interns yet.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: COLORS.muted, textAlign: "left", borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: "8px 12px" }}>Name</th>
                  <th style={{ padding: "8px 12px" }}>Email</th>
                  <th style={{ padding: "8px 12px" }}>Domain</th>
                  <th style={{ padding: "8px 12px" }}>Batch</th>
                </tr>
              </thead>
              <tbody>
                {active.map(u => (
                  <tr key={u._id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px" }}><strong>{u.name}</strong></td>
                    <td style={{ padding: "12px", color: COLORS.muted }}>{u.email}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        background: (domainColor[u.domain] || "#6B7280") + "22",
                        color: domainColor[u.domain] || "#6B7280",
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>{u.domain}</span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {/* ── Inline Batch Edit (Admin only) ── */}
                      {(isAdmin || isHR) && editingBatch === u._id ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input
                            value={batchInput}
                            onChange={e => setBatchInput(e.target.value)}
                            placeholder="e.g. Batch-1"
                            style={{ ...inputStyle, width: 110 }}
                            autoFocus
                          />
                          <button
                            onClick={() => saveBatch(u._id)}
                            disabled={savingBatch}
                            style={{
                              padding: "6px 12px", background: "#7C3AED", color: "#fff",
                              border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            {savingBatch ? "…" : "Save"}
                          </button>
                          <button
                            onClick={() => { setEditingBatch(null); setBatchInput(""); }}
                            style={{
                              padding: "6px 10px", background: "#F3F4F6", color: "#374151",
                              border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 12,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: u.batch ? "#111827" : COLORS.muted }}>
                            {u.batch || "—"}
                          </span>
                          {(isAdmin || isHR) && (
                            <button
                              onClick={() => { setEditingBatch(u._id); setBatchInput(u.batch || ""); }}
                              style={{
                                padding: "3px 8px", background: "transparent",
                                border: "1px solid #E5E7EB", borderRadius: 6,
                                fontSize: 11, color: "#6B7280", cursor: "pointer",
                              }}
                            >
                              ✏ Edit
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}