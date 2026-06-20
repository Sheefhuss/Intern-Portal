import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { COLORS, S } from "../utils/theme";

const domainColor = {
  Frontend: "#3B82F6", Backend: "#10B981", "Full Stack": "#8B5CF6",
  Design: "#F59E0B", DevOps: "#EF4444", "ML/AI": "#06B6D4",
};

const statusColors = {
  pending:     { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  submitted:   { bg: "#DBEAFE", text: "#2563EB", label: "Submitted" },
  hr_reviewed: { bg: "#EDE9FE", text: "#7C3AED", label: "HR Reviewed" },
  reviewed:    { bg: "#D1FAE5", text: "#059669", label: "Reviewed" },
};

export default function InternsPage({ session }) {
  const role = session?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isHR    = role === "hr";
  const isManager = isAdmin || isHR;

  const [pending, setPending]       = useState([]);
  const [active, setActive]         = useState([]);
  const [progress, setProgress]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [forwarding, setForwarding] = useState(null);
  const [tab, setTab]               = useState("active");
  const [expandedIntern, setExpandedIntern] = useState(null);

  const [annText, setAnnText]       = useState("");
  const [annRole, setAnnRole]       = useState("all");
  const [annPosting, setAnnPosting] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pend, act, prog] = await Promise.all([
        AuthService.apiFetch("/auth/applications/pending"),
        AuthService.apiFetch("/auth/interns"),
        AuthService.apiFetch("/tasks/progress/interns"),
      ]);
      setPending(pend);
      setActive(act);
      setProgress(prog);
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

  const getInternTasks = (user) => progress[user._id] || [];

  const inputStyle = {
    padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
    fontSize: 13, fontFamily: "inherit", outline: "none",
  };

  if (loading) return <div style={{ color: "#6B7280", padding: 20 }}>Loading…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

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

      <div style={{ display: "flex", gap: 8 }}>
        {[
          ["active",  `Active Interns (${active.length})`],
          ["pending", `Pending Review (${pending.length})`],
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
                  <th style={{ padding: "8px 12px" }}>Name / Email</th>
                  <th style={{ padding: "8px 12px" }}>Domain & Batch</th>
                  <th style={{ padding: "8px 12px" }}>Joining Date</th>
                  <th style={{ padding: "8px 12px", width: 200 }}>Overall Progress</th>
                  <th style={{ padding: "8px 12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {active.map(u => {
                  const internTasks = getInternTasks(u);
                  const submittedCount = internTasks.filter(t => ['submitted', 'hr_reviewed', 'reviewed'].includes(t.status)).length;
                  const reviewedCount = internTasks.filter(t => t.status === 'reviewed').length;
                  const total = internTasks.length;
                  const progressPercent = total === 0 ? 0 : Math.round((reviewedCount / total) * 100);
                  const isExpanded = expandedIntern === u._id;

                  return (
                    <React.Fragment key={u._id}>
                      <tr style={{ borderBottom: isExpanded ? "none" : `1px solid ${COLORS.border}`, background: isExpanded ? "#F9FAFB" : "#fff" }}>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: 600, color: "#111827" }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: COLORS.muted }}>{u.email}</div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              background: (domainColor[u.domain] || "#6B7280") + "22",
                              color: domainColor[u.domain] || "#6B7280",
                              padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            }}>{u.domain}</span>
                            <span style={{ fontSize: 12, color: "#4B5563", fontWeight: 600 }}>{u.batch || "No Batch"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px", color: "#4B5563" }}>
                          {new Date(u.appliedAt).toLocaleDateString("en-IN")}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4, fontWeight: 600, color: "#4B5563" }}>
                            <span>{reviewedCount} reviewed · {submittedCount} submitted / {total}</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div style={{ width: "100%", height: 6, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: "#10B981", width: `${progressPercent}%`, transition: "width 0.3s" }} />
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <button
                            onClick={() => setExpandedIntern(isExpanded ? null : u._id)}
                            style={{
                              background: isExpanded ? "#E5E7EB" : "#F3F4F6", color: "#374151",
                              border: "1px solid #D1D5DB", borderRadius: 6, padding: "6px 12px",
                              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                            }}
                          >
                            {isExpanded ? "Close" : "Track Submissions"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${COLORS.border}` }}>
                          <td colSpan="5" style={{ padding: "0 24px 24px 24px" }}>
                            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}>
                              <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "#111827" }}>Assigned Tasks & Submissions</h4>
                              {internTasks.length === 0 ? (
                                <div style={{ fontSize: 12, color: COLORS.muted }}>No tasks assigned to this intern yet.</div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {internTasks.map(task => {
                                    const sc = statusColors[task.status] || statusColors.pending;
                                    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status === "pending";
                                    return (
                                      <div key={task.taskId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid #F3F4F6", borderRadius: 6 }}>
                                        <div>
                                          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{task.title}</div>
                                          <div style={{ fontSize: 11, color: isOverdue ? "#DC2626" : COLORS.muted, marginTop: 2 }}>
                                            {task.deadline ? `Due: ${new Date(task.deadline).toLocaleDateString("en-IN")}` : "No deadline"}
                                            {isOverdue && " (Overdue)"}
                                          </div>
                                          {task.submissionUrl && (
                                            <a href={task.submissionUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#2563EB", fontWeight: 600 }}>
                                              View submission ↗
                                            </a>
                                          )}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          {task.source === "backfill" && (
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#FEF3C7", color: "#92400E" }} title="This status was migrated from old data, not submitted by the intern through the portal.">
                                              ⚠ Backfilled
                                            </span>
                                          )}
                                          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>
                                            {sc.label}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}