import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { COLORS, S } from "../utils/theme";

export default function InternsPage() {
  const [pending, setPending]   = useState([]);
  const [active, setActive]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [forwarding, setForwarding] = useState(null);
  const [tab, setTab]           = useState("pending");

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
    } catch (err) {
      alert(err.message);
    } finally {
      setForwarding(null);
    }
  };

  const domainColor = { Frontend:"#3B82F6", Backend:"#10B981", "Full Stack":"#8B5CF6", Design:"#F59E0B", DevOps:"#EF4444", "ML/AI":"#06B6D4" };

  if (loading) return <div style={{ color: "#6B7280", padding: 20 }}>Loading…</div>;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[["pending", `Pending Review (${pending.length})`], ["active", `Active Interns (${active.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:"9px 20px", border:"none", borderRadius:8,
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            background: tab === id ? "#7C3AED" : "#fff",
            color: tab === id ? "#fff" : "#6B7280",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}>{label}</button>
        ))}
      </div>

      {/* Pending Applications */}
      {tab === "pending" && (
        <div style={S.card}>
          <div style={{ fontWeight:600, marginBottom:4, fontSize:15 }}>📋 Pending Intern Applications</div>
          <p style={{ fontSize:12, color:COLORS.muted, marginBottom:16 }}>Review applicants and forward approved ones to Admin.</p>
          {pending.length === 0 ? (
            <div style={{ textAlign:"center", color:COLORS.muted, padding:"32px 0", fontSize:13 }}>
              No pending applications.
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ color:COLORS.muted, textAlign:"left", borderBottom:`1px solid ${COLORS.border}` }}>
                  <th style={{ padding:"8px 12px" }}>Name</th>
                  <th style={{ padding:"8px 12px" }}>Email</th>
                  <th style={{ padding:"8px 12px" }}>Domain</th>
                  <th style={{ padding:"8px 12px" }}>Applied</th>
                  <th style={{ padding:"8px 12px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(u => (
                  <tr key={u._id} style={{ borderBottom:`1px solid ${COLORS.border}` }}>
                    <td style={{ padding:"12px" }}><strong>{u.name}</strong></td>
                    <td style={{ padding:"12px", color:COLORS.muted }}>{u.email}</td>
                    <td style={{ padding:"12px" }}>
                      <span style={{ background: domainColor[u.domain] + "22", color: domainColor[u.domain] || "#6B7280", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 }}>
                        {u.domain}
                      </span>
                    </td>
                    <td style={{ padding:"12px", color:COLORS.muted }}>
                      {new Date(u.appliedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td style={{ padding:"12px" }}>
                      <button
                        onClick={() => forward(u._id)}
                        disabled={forwarding === u._id}
                        style={{
                          background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                          color:"#fff", border:"none", borderRadius:7,
                          padding:"6px 14px", fontSize:12, fontWeight:600,
                          cursor: forwarding === u._id ? "not-allowed" : "pointer",
                          fontFamily:"inherit", opacity: forwarding === u._id ? 0.6 : 1,
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

      {/* Active Interns */}
      {tab === "active" && (
        <div style={S.card}>
          <div style={{ fontWeight:600, marginBottom:16, fontSize:15 }}>👥 Active Intern Registry</div>
          {active.length === 0 ? (
            <div style={{ textAlign:"center", color:COLORS.muted, padding:"32px 0", fontSize:13 }}>
              No active interns yet.
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ color:COLORS.muted, textAlign:"left", borderBottom:`1px solid ${COLORS.border}` }}>
                  <th style={{ padding:"8px 12px" }}>Name</th>
                  <th style={{ padding:"8px 12px" }}>Email</th>
                  <th style={{ padding:"8px 12px" }}>Domain</th>
                  <th style={{ padding:"8px 12px" }}>Batch</th>
                </tr>
              </thead>
              <tbody>
                {active.map(u => (
                  <tr key={u._id} style={{ borderBottom:`1px solid ${COLORS.border}` }}>
                    <td style={{ padding:"12px" }}><strong>{u.name}</strong></td>
                    <td style={{ padding:"12px", color:COLORS.muted }}>{u.email}</td>
                    <td style={{ padding:"12px" }}>
                      <span style={{ background: (domainColor[u.domain]||"#6B7280") + "22", color: domainColor[u.domain]||"#6B7280", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 }}>
                        {u.domain}
                      </span>
                    </td>
                    <td style={{ padding:"12px", color:COLORS.muted }}>{u.batch || "—"}</td>
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