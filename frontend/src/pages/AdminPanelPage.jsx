import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { COLORS, S } from "../utils/theme";

export default function AdminPanelPage() {
  const [reviewed, setReviewed] = useState([]);
  const [allInterns, setAllInterns] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [batchInputs, setBatchInputs] = useState({});
  const [tab, setTab]           = useState("queue");

  const load = async () => {
    setLoading(true);
    try {
      const [rev, all] = await Promise.all([
        AuthService.apiFetch("/auth/applications/reviewed"),
        AuthService.apiFetch("/auth/interns"),
      ]);
      setReviewed(rev);
      setAllInterns(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const decide = async (id, decision) => {
    setActing(id + decision);
    try {
      await AuthService.apiFetch(`/auth/applications/${id}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ decision, batch: batchInputs[id] || "" }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const domainColor = { Frontend:"#3B82F6", Backend:"#10B981", "Full Stack":"#8B5CF6", Design:"#F59E0B", DevOps:"#EF4444", "ML/AI":"#06B6D4" };

  if (loading) return <div style={{ color:"#6B7280", padding:20 }}>Loading…</div>;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[["queue", `Approval Queue (${reviewed.length})`], ["interns", `All Interns (${allInterns.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:"9px 20px", border:"none", borderRadius:8,
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            background: tab === id ? "#7C3AED" : "#fff",
            color: tab === id ? "#fff" : "#6B7280",
            boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
          }}>{label}</button>
        ))}
      </div>

      {/* Approval Queue */}
      {tab === "queue" && (
        <div style={S.card}>
          <div style={{ fontWeight:600, fontSize:15, marginBottom:4 }}>⚙️ Admin Approval Queue</div>
          <p style={{ fontSize:12, color:COLORS.muted, marginBottom:16 }}>These applications have been reviewed and forwarded by HR.</p>
          {reviewed.length === 0 ? (
            <div style={{ textAlign:"center", color:COLORS.muted, padding:"32px 0", fontSize:13 }}>
              No applications pending your approval.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {reviewed.map(u => (
                <div key={u._id} style={{
                  border:`1px solid ${COLORS.border}`, borderRadius:12,
                  padding:"16px 20px", display:"flex", alignItems:"center",
                  gap:16, flexWrap:"wrap",
                }}>
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{u.name}</div>
                    <div style={{ fontSize:12, color:COLORS.muted }}>{u.email}</div>
                    <div style={{ marginTop:6 }}>
                      <span style={{ background:(domainColor[u.domain]||"#6B7280")+"22", color:domainColor[u.domain]||"#6B7280", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 }}>
                        {u.domain}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <input
                      type="text"
                      placeholder="Batch (e.g. B1)"
                      value={batchInputs[u._id] || ""}
                      onChange={e => setBatchInputs(p => ({ ...p, [u._id]: e.target.value }))}
                      style={{
                        border:"1.5px solid #E5E7EB", borderRadius:8,
                        padding:"7px 12px", fontSize:12, width:100,
                        fontFamily:"inherit", outline:"none",
                      }}
                    />
                    <button
                      onClick={() => decide(u._id, "active")}
                      disabled={!!acting}
                      style={{
                        background:"#16A34A", color:"#fff", border:"none",
                        borderRadius:8, padding:"8px 16px", fontSize:12,
                        fontWeight:600, cursor: acting ? "not-allowed" : "pointer",
                        fontFamily:"inherit", opacity: acting === u._id+"active" ? 0.6 : 1,
                      }}
                    >
                      {acting === u._id+"active" ? "Approving…" : "✓ Approve"}
                    </button>
                    <button
                      onClick={() => decide(u._id, "rejected")}
                      disabled={!!acting}
                      style={{
                        background:"#DC2626", color:"#fff", border:"none",
                        borderRadius:8, padding:"8px 16px", fontSize:12,
                        fontWeight:600, cursor: acting ? "not-allowed" : "pointer",
                        fontFamily:"inherit", opacity: acting === u._id+"rejected" ? 0.6 : 1,
                      }}
                    >
                      {acting === u._id+"rejected" ? "Rejecting…" : "✗ Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Active Interns */}
      {tab === "interns" && (
        <div style={S.card}>
          <div style={{ fontWeight:600, fontSize:15, marginBottom:16 }}>👥 All Active Interns</div>
          {allInterns.length === 0 ? (
            <div style={{ textAlign:"center", color:COLORS.muted, padding:"32px 0", fontSize:13 }}>No active interns yet.</div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ color:COLORS.muted, textAlign:"left", borderBottom:`1px solid ${COLORS.border}` }}>
                  <th style={{ padding:"8px 12px" }}>Name</th>
                  <th style={{ padding:"8px 12px" }}>Email</th>
                  <th style={{ padding:"8px 12px" }}>Domain</th>
                  <th style={{ padding:"8px 12px" }}>Batch</th>
                  <th style={{ padding:"8px 12px" }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {allInterns.map(u => (
                  <tr key={u._id} style={{ borderBottom:`1px solid ${COLORS.border}` }}>
                    <td style={{ padding:"12px", fontWeight:500 }}>{u.name}</td>
                    <td style={{ padding:"12px", color:COLORS.muted }}>{u.email}</td>
                    <td style={{ padding:"12px" }}>
                      <span style={{ background:(domainColor[u.domain]||"#6B7280")+"22", color:domainColor[u.domain]||"#6B7280", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 }}>
                        {u.domain}
                      </span>
                    </td>
                    <td style={{ padding:"12px", color:COLORS.muted }}>{u.batch || "—"}</td>
                    <td style={{ padding:"12px", color:COLORS.muted }}>{new Date(u.appliedAt).toLocaleDateString("en-IN")}</td>
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