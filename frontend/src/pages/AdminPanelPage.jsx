import React, { useState, useEffect, useMemo } from "react";
import { AuthService } from "../auth/authService";
import { COLORS, S } from "../utils/theme";

const domainColor = {
  Frontend: "#3B82F6", Backend: "#10B981", "Full Stack": "#8B5CF6",
  Design: "#F59E0B", DevOps: "#EF4444", "ML/AI": "#06B6D4",
};

const roleColor = {
  intern: { bg: "#F3F4F6", text: "#374151" },
  hr:     { bg: "#EDE9FE", text: "#7C3AED" },
  admin:  { bg: "#FEE2E2", text: "#DC2626" },
};

const statusColor = {
  active:      { bg: "#D1FAE5", text: "#059669" },
  pending:     { bg: "#FEF3C7", text: "#D97706" },
  hr_reviewed: { bg: "#DBEAFE", text: "#2563EB" },
  rejected:    { bg: "#FEE2E2", text: "#DC2626" },
  revoked:     { bg: "#F3F4F6", text: "#6B7280" },
};

const pillSelect = {
  border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px",
  fontSize: 12, fontWeight: 600, fontFamily: "inherit", outline: "none",
  cursor: "pointer", background: "#fff",
};

export default function AdminPanelPage() {
  const [tab, setTab] = useState("queue");
  const [reviewed, setReviewed] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [batches, setBatches]   = useState([]);
  const [allInterns, setAllInterns] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [batchInputs, setBatchInputs] = useState({});
  const [groupBy, setGroupBy]   = useState("none");

  // batch tab state
  const [newBatchName, setNewBatchName]       = useState("");
  const [newBatchDomains, setNewBatchDomains] = useState([]);
  const [editingBatch, setEditingBatch]     = useState(null);
  const [editBatchName, setEditBatchName]   = useState("");
  const [creatingBatch, setCreatingBatch]   = useState(false);
  const [expandedBatch, setExpandedBatch]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rev, reg, bat] = await Promise.all([
        AuthService.apiFetch("/auth/applications/reviewed"),
        AuthService.apiFetch("/admin/registry"),
        AuthService.apiFetch("/admin/batches"),
      ]);
      setReviewed(rev);
      setRegistry(reg);
      setBatches(bat);
      setAllInterns(reg.filter(u => u.role === "intern"));
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

  const updateUser = async (id, patch) => {
    setActing(id);
    try {
      const updated = await AuthService.apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setRegistry(prev => prev.map(u => u._id === id ? updated : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const revokeUser = async (id, name) => {
    if (!window.confirm(`Revoke access for ${name}? They will be unable to log in.`)) return;
    setActing(id);
    try {
      const updated = await AuthService.apiFetch(`/admin/users/${id}/revoke`, { method: "PATCH" });
      setRegistry(prev => prev.map(u => u._id === id ? updated : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const reactivateUser = async (id) => {
    setActing(id);
    try {
      const updated = await AuthService.apiFetch(`/admin/users/${id}/reactivate`, { method: "PATCH" });
      setRegistry(prev => prev.map(u => u._id === id ? updated : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone. Their tasks will be kept but unlinked.`)) return;
    setActing(id);
    try {
      await AuthService.apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      setRegistry(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const createBatch = async () => {
    if (!newBatchName.trim() || newBatchDomains.length === 0) return alert("Batch name and at least one domain are required.");
    setCreatingBatch(true);
    try {
      const created = [];
      const failed = [];
      for (const domain of newBatchDomains) {
        try {
          const batch = await AuthService.apiFetch("/admin/batches", {
            method: "POST",
            body: JSON.stringify({ name: newBatchName.trim(), domain }),
          });
          created.push(batch);
        } catch (err) {
          failed.push(`${domain}: ${err.message}`);
        }
      }
      if (created.length) setBatches(prev => [...prev, ...created]);
      if (failed.length) alert(`Some batches were not created:\n${failed.join("\n")}`);
      if (created.length) {
        setNewBatchName("");
        setNewBatchDomains([]);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingBatch(false);
    }
  };

  const saveBatchEdit = async (id) => {
    if (!editBatchName.trim()) return alert("Batch name is required.");
    try {
      const updated = await AuthService.apiFetch(`/admin/batches/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editBatchName.trim() }),
      });
      setBatches(prev => prev.map(b => b._id === id ? { ...updated, internCount: b.internCount } : b));
      setEditingBatch(null);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteBatch = async (id, label) => {
    if (!window.confirm(`Delete batch "${label}"? This only works if no interns are assigned to it.`)) return;
    try {
      await AuthService.apiFetch(`/admin/batches/${id}`, { method: "DELETE" });
      setBatches(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const assignInternToBatch = async (batchId, userId) => {
    try {
      await AuthService.apiFetch(`/admin/batches/${batchId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ userId }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const domains = useMemo(
    () => [...new Set(registry.map(u => u.domain).filter(Boolean))],
    [registry]
  );

  const activeInterns = registry.filter(u => u.role === "intern" && u.status === "active");
  const hrStaff       = registry.filter(u => u.role === "hr" && u.status !== "revoked");
  const adminStaff    = registry.filter(u => u.role === "admin" && u.status !== "revoked");
  const inactivePending = registry.filter(u =>
    u.role === "intern" && ["pending", "hr_reviewed", "rejected"].includes(u.status)
  );
  const revokedUsers  = registry.filter(u => u.status === "revoked");

  if (loading) return <div style={{ color: "#6B7280", padding: 20 }}>Loading…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          ["queue", `Approval Queue (${reviewed.length})`],
          ["registry", `Full Registry (${registry.length})`],
          ["batches", `Batches (${batches.length})`],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "9px 20px", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === id ? "#7C3AED" : "#fff",
            color: tab === id ? "#fff" : "#6B7280",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}>{label}</button>
        ))}
      </div>

      {tab === "queue" && (
        <ApprovalQueue
          reviewed={reviewed}
          domainColor={domainColor}
          batchInputs={batchInputs}
          setBatchInputs={setBatchInputs}
          decide={decide}
          acting={acting}
        />
      )}

      {tab === "registry" && (
        <FullRegistry
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          activeInterns={activeInterns}
          hrStaff={hrStaff}
          adminStaff={adminStaff}
          inactivePending={inactivePending}
          revokedUsers={revokedUsers}
          domains={domains}
          batches={batches}
          updateUser={updateUser}
          revokeUser={revokeUser}
          reactivateUser={reactivateUser}
          deleteUser={deleteUser}
          acting={acting}
        />
      )}

      {tab === "batches" && (
        <BatchesTab
          batches={batches}
          allInterns={allInterns}
          domains={domains}
          newBatchName={newBatchName}
          setNewBatchName={setNewBatchName}
          newBatchDomains={newBatchDomains}
          setNewBatchDomains={setNewBatchDomains}
          creatingBatch={creatingBatch}
          createBatch={createBatch}
          editingBatch={editingBatch}
          setEditingBatch={setEditingBatch}
          editBatchName={editBatchName}
          setEditBatchName={setEditBatchName}
          saveBatchEdit={saveBatchEdit}
          deleteBatch={deleteBatch}
          expandedBatch={expandedBatch}
          setExpandedBatch={setExpandedBatch}
          assignInternToBatch={assignInternToBatch}
        />
      )}
    </div>
  );
}

function ApprovalQueue({ reviewed, domainColor, batchInputs, setBatchInputs, decide, acting }) {
  return (
    <div style={S.card}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>⚙️ Admin Approval Queue</div>
      <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>These applications have been reviewed and forwarded by HR.</p>
      {reviewed.length === 0 ? (
        <div style={{ textAlign: "center", color: COLORS.muted, padding: "32px 0", fontSize: 13 }}>
          No applications pending your approval.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviewed.map(u => (
            <div key={u._id} style={{
              border: `1px solid ${COLORS.border}`, borderRadius: 12,
              padding: "16px 20px", display: "flex", alignItems: "center",
              gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{u.email}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ background: (domainColor[u.domain] || "#6B7280") + "22", color: domainColor[u.domain] || "#6B7280", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    {u.domain}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Batch (e.g. B1)"
                  value={batchInputs[u._id] || ""}
                  onChange={e => setBatchInputs(p => ({ ...p, [u._id]: e.target.value }))}
                  style={{
                    border: "1.5px solid #E5E7EB", borderRadius: 8,
                    padding: "7px 12px", fontSize: 12, width: 100,
                    fontFamily: "inherit", outline: "none",
                  }}
                />
                <button
                  onClick={() => decide(u._id, "active")}
                  disabled={!!acting}
                  style={{
                    background: "#16A34A", color: "#fff", border: "none",
                    borderRadius: 8, padding: "8px 16px", fontSize: 12,
                    fontWeight: 600, cursor: acting ? "not-allowed" : "pointer",
                    fontFamily: "inherit", opacity: acting === u._id + "active" ? 0.6 : 1,
                  }}
                >
                  {acting === u._id + "active" ? "Approving…" : "✓ Approve"}
                </button>
                <button
                  onClick={() => decide(u._id, "rejected")}
                  disabled={!!acting}
                  style={{
                    background: "#DC2626", color: "#fff", border: "none",
                    borderRadius: 8, padding: "8px 16px", fontSize: 12,
                    fontWeight: 600, cursor: acting ? "not-allowed" : "pointer",
                    fontFamily: "inherit", opacity: acting === u._id + "rejected" ? 0.6 : 1,
                  }}
                >
                  {acting === u._id + "rejected" ? "Rejecting…" : "✗ Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegistryTable({ users, columns, batches, updateUser, revokeUser, reactivateUser, deleteUser, acting, showBatchEditor, showRoleEditor, showRevoke, showReactivate }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ color: COLORS.muted, textAlign: "left", borderBottom: `1px solid ${COLORS.border}` }}>
          <th style={{ padding: "8px 12px" }}>Name / Email</th>
          <th style={{ padding: "8px 12px" }}>Domain</th>
          <th style={{ padding: "8px 12px" }}>Batch</th>
          <th style={{ padding: "8px 12px" }}>Status</th>
          <th style={{ padding: "8px 12px" }}>Joined</th>
          <th style={{ padding: "8px 12px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => {
          const batchOptions = batches.filter(b => b.domain === u.domain);
          const sc = statusColor[u.status] || statusColor.pending;
          const rc = roleColor[u.role] || roleColor.intern;
          const isActing = acting === u._id;
          return (
            <tr key={u._id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <td style={{ padding: "12px" }}>
                <div style={{ fontWeight: 600, color: "#111827" }}>{u.name}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{u.email}</div>
              </td>
              <td style={{ padding: "12px" }}>
                {u.domain ? (
                  <span style={{ background: (domainColor[u.domain] || "#6B7280") + "22", color: domainColor[u.domain] || "#6B7280", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    {u.domain}
                  </span>
                ) : <span style={{ color: COLORS.muted }}>—</span>}
              </td>
              <td style={{ padding: "12px" }}>
                {showBatchEditor && u.role === "intern" ? (
                  <select
                    value={u.batch || ""}
                    onChange={e => updateUser(u._id, { batch: e.target.value })}
                    disabled={isActing}
                    style={pillSelect}
                  >
                    <option value="">No Batch</option>
                    {batchOptions.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                ) : (
                  <span style={{ color: "#4B5563", fontWeight: 600 }}>{u.batch || "No Batch"}</span>
                )}
              </td>
              <td style={{ padding: "12px" }}>
                <span style={{ background: sc.bg, color: sc.text, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {u.status === "active" ? "Active" : u.status === "hr_reviewed" ? "HR Reviewed" : u.status === "rejected" ? "Rejected" : u.status === "revoked" ? "Revoked" : "Pending"}
                </span>
              </td>
              <td style={{ padding: "12px", color: "#4B5563" }}>
                {new Date(u.appliedAt).toLocaleDateString("en-IN")}
              </td>
              <td style={{ padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {showRoleEditor && (
                    <select
                      value={u.role}
                      onChange={e => updateUser(u._id, { role: e.target.value })}
                      disabled={isActing}
                      style={{ ...pillSelect, background: rc.bg, color: rc.text, border: "none" }}
                    >
                      <option value="intern">Intern</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {showReactivate && (
                    <button
                      onClick={() => reactivateUser(u._id)}
                      disabled={isActing}
                      style={{ background: "#16A34A", color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: isActing ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                    >
                      {isActing ? "…" : "Reactivate"}
                    </button>
                  )}
                  {showRevoke && (
                    <button
                      onClick={() => revokeUser(u._id, u.name)}
                      disabled={isActing}
                      style={{ background: "#F59E0B", color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: isActing ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                    >
                      {isActing ? "…" : "Revoke"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteUser(u._id, u.name)}
                    disabled={isActing}
                    style={{ background: "#fff", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: isActing ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function groupUsers(users, groupBy) {
  if (groupBy === "none") return [{ key: null, label: null, users }];

  const field = groupBy === "domain" ? "domain" : "batch";
  const groups = {};
  users.forEach(u => {
    const key = u[field] || (field === "domain" ? "No Domain" : "No Batch");
    if (!groups[key]) groups[key] = [];
    groups[key].push(u);
  });

  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map(key => ({ key, label: key, users: groups[key] }));
}

function GroupedSection({ users, groupBy, tableProps, ...tableFlags }) {
  const groups = groupUsers(users, groupBy);
  if (groupBy === "none") {
    return <RegistryTable users={users} {...tableProps} {...tableFlags} />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {groups.map(g => (
        <div key={g.key}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ background: "#F3F4F6", padding: "2px 10px", borderRadius: 12 }}>{g.label}</span>
            <span style={{ color: COLORS.muted, fontWeight: 500 }}>({g.users.length})</span>
          </div>
          <RegistryTable users={g.users} {...tableProps} {...tableFlags} />
        </div>
      ))}
    </div>
  );
}

function FullRegistry({ groupBy, setGroupBy, activeInterns, hrStaff, adminStaff, inactivePending, revokedUsers, batches, updateUser, revokeUser, reactivateUser, deleteUser, acting }) {
  const tableProps = { batches, updateUser, revokeUser, reactivateUser, deleteUser, acting };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>👥 Full System Registry</div>
          <p style={{ fontSize: 12, color: COLORS.muted, margin: "4px 0 0" }}>Manage active, inactive, and past system users.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>Group By:</span>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={pillSelect}>
            <option value="none">No Grouping</option>
            <option value="domain">Domain</option>
            <option value="batch">Batch</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionHeader dot="#10B981" title={`Active Interns (${activeInterns.length})`} />
        {activeInterns.length === 0
          ? <Empty text="No active interns yet." />
          : <GroupedSection users={activeInterns} groupBy={groupBy} tableProps={tableProps} showBatchEditor showRoleEditor showRevoke />}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader dot="#7C3AED" title={`HR Staff (${hrStaff.length})`} color="#7C3AED" />
        {hrStaff.length === 0
          ? <Empty text="No HR staff." />
          : <GroupedSection users={hrStaff} groupBy={groupBy} tableProps={tableProps} showRoleEditor showRevoke />}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader dot="#DC2626" title={`Admin Staff (${adminStaff.length})`} color="#DC2626" />
        {adminStaff.length === 0
          ? <Empty text="No other admins." />
          : <GroupedSection users={adminStaff} groupBy={groupBy} tableProps={tableProps} showRoleEditor showRevoke />}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader dot="#F59E0B" title={`Inactive / Pending Interns (${inactivePending.length})`} color="#D97706" />
        {inactivePending.length === 0
          ? <Empty text="No users found in this category." />
          : <GroupedSection users={inactivePending} groupBy={groupBy} tableProps={tableProps} />}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader dot="#6B7280" title={`Revoked (${revokedUsers.length})`} color="#6B7280" />
        {revokedUsers.length === 0
          ? <Empty text="No revoked users." />
          : <GroupedSection users={revokedUsers} groupBy={groupBy} tableProps={tableProps} showReactivate />}
      </div>
    </div>
  );
}

function SectionHeader({ dot, title, color = "#111827" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot, display: "inline-block" }} />
      <span style={{ fontWeight: 700, fontSize: 14, color }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: COLORS.border, marginLeft: 8 }} />
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ textAlign: "center", color: COLORS.muted, padding: "24px 0", fontSize: 13, border: `1px dashed ${COLORS.border}`, borderRadius: 8 }}>{text}</div>;
}

function BatchesTab({
  batches, allInterns, domains,
  newBatchName, setNewBatchName, newBatchDomains, setNewBatchDomains, creatingBatch, createBatch,
  editingBatch, setEditingBatch, editBatchName, setEditBatchName, saveBatchEdit, deleteBatch,
  expandedBatch, setExpandedBatch, assignInternToBatch,
}) {
  const toggleDomain = (d) => {
    setNewBatchDomains(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#111827" }}>➕ Create New Batch</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>Domain(s)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 360 }}>
              {domains.map(d => {
                const selected = newBatchDomains.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDomain(d)}
                    style={{
                      padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${selected ? "#7C3AED" : "#E5E7EB"}`,
                      background: selected ? "#7C3AED" : "#fff",
                      color: selected ? "#fff" : "#6B7280",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {selected ? "✓ " : ""}{d}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Batch Name</label>
            <input
              value={newBatchName}
              onChange={e => setNewBatchName(e.target.value)}
              placeholder="e.g. B1"
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", outline: "none", width: 160 }}
            />
          </div>
          <button
            onClick={createBatch}
            disabled={creatingBatch}
            style={{
              padding: "10px 22px", background: "#7C3AED", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: creatingBatch ? "not-allowed" : "pointer", opacity: creatingBatch ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {creatingBatch ? "Creating…" : "Create Batch"}
          </button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#111827" }}>📦 All Batches</div>
        {batches.length === 0 ? (
          <Empty text="No batches created yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {batches.map(b => {
              const isExpanded = expandedBatch === b._id;
              const isEditing = editingBatch === b._id;
              const batchInterns = allInterns.filter(i => i.domain === b.domain && i.batch === b.name);
              const unassignedInDomain = allInterns.filter(i => i.domain === b.domain && i.batch !== b.name && i.status === "active");

              return (
                <div key={b._id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ background: (domainColor[b.domain] || "#6B7280") + "22", color: domainColor[b.domain] || "#6B7280", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {b.domain}
                      </span>
                      {isEditing ? (
                        <input
                          value={editBatchName}
                          onChange={e => setEditBatchName(e.target.value)}
                          autoFocus
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #7C3AED", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                        />
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{b.name}</span>
                      )}
                      <span style={{ fontSize: 12, color: COLORS.muted }}>{b.internCount} intern{b.internCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => saveBatchEdit(b._id)} style={{ background: "#16A34A", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
                          <button onClick={() => setEditingBatch(null)} style={{ background: "#fff", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setExpandedBatch(isExpanded ? null : b._id)} style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {isExpanded ? "Close" : "Manage Interns"}
                          </button>
                          <button onClick={() => { setEditingBatch(b._id); setEditBatchName(b.name); }} style={{ background: "#fff", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Rename</button>
                          <button onClick={() => deleteBatch(b._id, `${b.domain} / ${b.name}`)} style={{ background: "#fff", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ background: "#F9FAFB", borderTop: `1px solid ${COLORS.border}`, padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Interns in this batch</div>
                      {batchInterns.length === 0 ? (
                        <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 14 }}>No interns assigned yet.</div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                          {batchInterns.map(i => (
                            <span key={i._id} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#374151" }}>
                              {i.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Assign an intern from {b.domain}</div>
                      {unassignedInDomain.length === 0 ? (
                        <div style={{ fontSize: 12, color: COLORS.muted }}>No other active interns in this domain to assign.</div>
                      ) : (
                        <select
                          defaultValue=""
                          onChange={e => { if (e.target.value) { assignInternToBatch(b._id, e.target.value); e.target.value = ""; } }}
                          style={{ ...pillSelect, padding: "8px 12px", minWidth: 220 }}
                        >
                          <option value="">— Select Intern —</option>
                          {unassignedInDomain.map(i => <option key={i._id} value={i._id}>{i.name} ({i.batch || "No Batch"})</option>)}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}