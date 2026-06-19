import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { COLORS, S } from "../utils/theme";

export default function AdminPanelPage() {
  const [reviewed, setReviewed] = useState([]);
  const [allSystemUsers, setAllSystemUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [batchInputs, setBatchInputs] = useState({});
  const [tab, setTab] = useState("queue");
  const [groupBy, setGroupBy] = useState("none");

  const load = async () => {
    setLoading(true);
    try {
      const [rev, allUsers, batchData] = await Promise.all([
        AuthService.apiFetch("/admin/users?status=hr_reviewed"),
        AuthService.apiFetch("/admin/users"),
        AuthService.apiFetch("/admin/batches")
      ]);
      setReviewed(rev);
      setAllSystemUsers(allUsers.filter(u => u.role !== 'admin'));
      setBatches(batchData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createBatch = async (defaultName = "") => {
    const name = window.prompt("Enter name for the new batch:", defaultName);
    if (!name || !name.trim()) return null;
    try {
      setActing("create_batch");
      await AuthService.apiFetch("/admin/batches", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      await load();
      return name.trim();
    } catch (err) {
      alert(err.message);
      return null;
    } finally {
      setActing(null);
    }
  };

  const handleBatchSelect = async (userId, value) => {
    if (value === "CREATE_NEW") {
      const newBatchName = await createBatch();
      if (newBatchName) updateBatch(userId, newBatchName);
    } else {
      updateBatch(userId, value);
    }
  };

  const handleQueueBatchSelect = async (userId, value) => {
    if (value === "CREATE_NEW") {
      const newBatchName = await createBatch();
      if (newBatchName) setBatchInputs(p => ({ ...p, [userId]: newBatchName }));
    } else {
      setBatchInputs(p => ({ ...p, [userId]: value }));
    }
  };

  const editBatch = async (oldName) => {
    const isSure = window.confirm(`Are you sure you want to edit the batch "${oldName}"? All interns assigned to this batch will be notified.`);
    if (!isSure) return;

    const newName = window.prompt(`Enter new name for batch "${oldName}":`, oldName);
    if (!newName || !newName.trim() || newName === oldName) return;

    try {
      setActing("edit_batch");
      await AuthService.apiFetch(`/admin/batches/${encodeURIComponent(oldName)}`, {
        method: "PUT",
        body: JSON.stringify({ newName }),
      });
      await load();
      alert("Batch updated and interns notified successfully.");
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const decide = async (id, decision) => {
    setActing(id + decision);
    try {
      await AuthService.apiFetch(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: decision, batch: batchInputs[id] || "" }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const changeRole = async (id, newRole) => {
    setActing(id + "role");
    try {
      await AuthService.apiFetch(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const updateBatch = async (id, newBatch) => {
    setActing(id + "batch");
    try {
      await AuthService.apiFetch(`/admin/users/${id}/batch`, {
        method: "PATCH",
        body: JSON.stringify({ batch: newBatch }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setActing(id + "status");
    try {
      await AuthService.apiFetch(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const revokeAccess = async (id) => {
    if (!window.confirm("Are you sure you want to revoke access for this user? They will be moved to Past Interns.")) return;
    setActing(id + "revoke");
    try {
      await AuthService.apiFetch(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const deleteHistory = async (id) => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete this past intern's history? This action cannot be undone.")) return;
    setActing(id + "delete");
    try {
      await AuthService.apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const domainColor = { Frontend:"#3B82F6", Backend:"#10B981", "Full Stack":"#8B5CF6", Design:"#F59E0B", DevOps:"#EF4444", "ML/AI":"#06B6D4" };

  const internList = allSystemUsers.filter(u => u.role === "intern");
  const hrList = allSystemUsers.filter(u => u.role === "hr");
  
  const activeInterns = internList.filter(u => u.status === "active");
  const inactiveInterns = internList.filter(u => ["pending", "hr_reviewed"].includes(u.status));
  const pastInterns = internList.filter(u => u.status === "rejected");

  const renderUserTable = (users, showDelete = false) => {
    if (users.length === 0) return <div style={{ color: COLORS.muted, fontSize: 13, padding: "10px 0" }}>No users found in this category.</div>;
    return (
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom: 24 }}>
        <thead>
          <tr style={{ color:COLORS.muted, textAlign:"left", borderBottom:`1px solid ${COLORS.border}` }}>
            <th style={{ padding:"8px 12px" }}>Name / Email</th>
            <th style={{ padding:"8px 12px" }}>Domain</th>
            <th style={{ padding:"8px 12px" }}>Batch</th>
            <th style={{ padding:"8px 12px" }}>Status</th>
            <th style={{ padding:"8px 12px" }}>Joined</th>
            <th style={{ padding:"8px 12px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} style={{ borderBottom:`1px solid ${COLORS.border}` }}>
              <td style={{ padding:"12px" }}>
                <div style={{ fontWeight: 500 }}>{u.name}</div>
                <div style={{ color: COLORS.muted, fontSize: 11 }}>{u.email}</div>
              </td>
              <td style={{ padding:"12px" }}>
                {u.domain ? (
                  <span style={{ background:(domainColor[u.domain]||"#6B7280")+"22", color:domainColor[u.domain]||"#6B7280", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 }}>
                    {u.domain}
                  </span>
                ) : "—"}
              </td>
              <td style={{ padding:"12px" }}>
                <select
                  value={u.batch || ""}
                  onChange={(e) => handleBatchSelect(u._id, e.target.value)}
                  disabled={acting === u._id + "batch"}
                  style={{
                    border: "1px solid #E5E7EB", borderRadius: 6,
                    padding: "6px 8px", fontSize: 12, width: 120,
                    fontFamily: "inherit", outline: "none",
                    background: acting === u._id + "batch" ? "#F3F4F6" : "#fff",
                  }}
                >
                  <option value="">No Batch</option>
                  {batches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  <option value="CREATE_NEW" style={{ fontWeight: "bold", color: "#7C3AED" }}>+ Create New Batch</option>
                </select>
              </td>
              <td style={{ padding:"12px" }}>
                <select
                  value={u.status}
                  onChange={(e) => updateStatus(u._id, e.target.value)}
                  disabled={acting === u._id + "status"}
                  style={{
                    padding: "6px 10px", borderRadius: 6, border: "1px solid #E5E7EB",
                    fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer",
                    background: u.status === "active" ? "#F0FDF4" : u.status === "rejected" ? "#FEF2F2" : "#FFFBEB",
                    color: u.status === "active" ? "#16A34A" : u.status === "rejected" ? "#DC2626" : "#D97706",
                    fontWeight: 600
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="hr_reviewed">HR Reviewed</option>
                  <option value="active">Active</option>
                  <option value="rejected">Past / Rejected</option>
                </select>
              </td>
              <td style={{ padding:"12px", color: COLORS.muted }}>
                {new Date(u.appliedAt).toLocaleDateString("en-IN")}
              </td>
              <td style={{ padding:"12px" }}>
                {showDelete ? (
                  <button
                    onClick={() => deleteHistory(u._id)}
                    disabled={acting === u._id + "delete"}
                    style={{
                      background: "#DC2626", color: "#fff", border: "none",
                      borderRadius: 6, padding: "6px 12px", fontSize: 12,
                      fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                    }}
                  >
                    {acting === u._id + "delete" ? "..." : "Delete History"}
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      disabled={acting === u._id + "role"}
                      style={{
                        padding: "6px 10px", borderRadius: 6, border: "1px solid #E5E7EB",
                        fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer",
                        background: u.role === "hr" ? "#F5F3FF" : "#F9FAFB",
                        color: u.role === "hr" ? "#7C3AED" : "#374151",
                        fontWeight: 600
                      }}
                    >
                      <option value="intern">Intern</option>
                      <option value="hr">HR</option>
                    </select>
                    <button
                      onClick={() => revokeAccess(u._id)}
                      disabled={acting === u._id + "revoke"}
                      style={{
                        background: "#FEE2E2", color: "#DC2626", border: "none",
                        borderRadius: 6, padding: "6px 10px", fontSize: 12,
                        fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      {acting === u._id + "revoke" ? "..." : "Revoke"}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderGroupedUsers = (usersToGroup) => {
    if (groupBy === "none") return renderUserTable(usersToGroup);

    const grouped = usersToGroup.reduce((acc, user) => {
      const key = groupBy === "domain" ? (user.domain || "Unassigned Domain") : (user.batch || "Unassigned Batch");
      if (!acc[key]) acc[key] = [];
      acc[key].push(user);
      return acc;
    }, {});

    return Object.entries(grouped).map(([groupName, groupUsers]) => (
      <div key={groupName} style={{ marginBottom: 20 }}>
        <div style={{ padding: "8px 12px", background: "#F3F4F6", borderRadius: "8px 8px 0 0", fontWeight: 600, fontSize: 13, border: `1px solid ${COLORS.border}`, borderBottom: "none" }}>
          {groupName} ({groupUsers.length})
        </div>
        {renderUserTable(groupUsers)}
      </div>
    ));
  };

  if (loading) return <div style={{ color:"#6B7280", padding:20 }}>Loading…</div>;

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[
          ["queue", `Approval Queue (${reviewed.length})`], 
          ["registry", `Full Registry (${allSystemUsers.length})`],
          ["batches", `Batches (${batches.length})`]
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:"9px 20px", border:"none", borderRadius:8,
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            background: tab === id ? "#7C3AED" : "#fff",
            color: tab === id ? "#fff" : "#6B7280",
            boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
          }}>{label}</button>
        ))}
      </div>

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
                    <select
                      value={batchInputs[u._id] || ""}
                      onChange={e => handleQueueBatchSelect(u._id, e.target.value)}
                      style={{
                        border:"1.5px solid #E5E7EB", borderRadius:8,
                        padding:"7px 12px", fontSize:12, width:130,
                        fontFamily:"inherit", outline:"none",
                        background: "#fff", cursor: "pointer"
                      }}
                    >
                      <option value="">Assign Batch...</option>
                      {batches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                      <option value="CREATE_NEW" style={{ fontWeight: "bold", color: "#7C3AED" }}>+ Create New Batch</option>
                    </select>
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

      {tab === "registry" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:16 }}>👥 Full System Registry</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>Manage active, inactive, and past system users.</div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>Group By:</span>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value)}
                style={{
                  padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
                  fontSize: 12, outline: "none", cursor: "pointer"
                }}
              >
                <option value="none">No Grouping</option>
                <option value="domain">Domain</option>
                <option value="batch">Batch</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, color: "#374151", borderBottom: `2px solid #E5E7EB`, paddingBottom: 8, marginBottom: 16 }}>
              🟢 Active Interns ({activeInterns.length})
            </h3>
            {renderGroupedUsers(activeInterns)}
          </div>

          {hrList.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, color: "#7C3AED", borderBottom: `2px solid #E5E7EB`, paddingBottom: 8, marginBottom: 16 }}>
                🟣 HR Staff ({hrList.length})
              </h3>
              {renderUserTable(hrList)}
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, color: "#D97706", borderBottom: `2px solid #E5E7EB`, paddingBottom: 8, marginBottom: 16 }}>
              🟡 Inactive / Pending Interns ({inactiveInterns.length})
            </h3>
            {renderGroupedUsers(inactiveInterns)}
          </div>

          <div style={{ marginTop: 40, padding: 20, background: "#FEF2F2", borderRadius: 12, border: "1px solid #FEE2E2" }}>
            <h3 style={{ fontSize: 14, color: "#DC2626", marginBottom: 4 }}>
              🔴 Past Interns & Archived Accounts ({pastInterns.length})
            </h3>
            <p style={{ fontSize: 12, color: "#B91C1C", marginBottom: 16 }}>
              Users whose access was rejected or revoked. You can permanently delete their history from the system here.
            </p>
            {renderUserTable(pastInterns, true)}
          </div>
        </div>
      )}

      {tab === "batches" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight:600, fontSize:15 }}>📁 Batch Management</div>
            <button
              onClick={() => createBatch()}
              style={{
                background:"#7C3AED", color:"#fff", border:"none",
                borderRadius:8, padding:"8px 16px", fontSize:12,
                fontWeight:600, cursor: "pointer", fontFamily:"inherit"
              }}
            >
              + Create New Batch
            </button>
          </div>
          
          {batches.length === 0 ? (
            <div style={{ textAlign:"center", color:COLORS.muted, padding:"32px 0", fontSize:13 }}>No batches created yet.</div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ color:COLORS.muted, textAlign:"left", borderBottom:`1px solid ${COLORS.border}` }}>
                  <th style={{ padding:"8px 12px" }}>Batch Name</th>
                  <th style={{ padding:"8px 12px", width: 150 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b._id} style={{ borderBottom:`1px solid ${COLORS.border}` }}>
                    <td style={{ padding:"12px", fontWeight:500 }}>{b.name}</td>
                    <td style={{ padding:"12px" }}>
                      <button
                        onClick={() => editBatch(b.name)}
                        style={{
                          background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB",
                          borderRadius: 6, padding: "6px 12px", fontSize: 12,
                          fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                        }}
                      >
                        Edit Batch
                      </button>
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