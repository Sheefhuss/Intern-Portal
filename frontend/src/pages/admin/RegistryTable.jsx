import React from "react";
import { COLORS } from "../../utils/theme";
import { domainColor, roleColor, statusColor, pillSelect } from "../../utils/adminConstants";

export default function RegistryTable({
  users, batches, updateUser, revokeUser, reactivateUser, deleteUser, acting,
  showBatchEditor, showRoleEditor, showRevoke, showReactivate,
}) {
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
                  <span style={{
                    background: (domainColor[u.domain] || "#6B7280") + "22",
                    color: domainColor[u.domain] || "#6B7280",
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  }}>
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
                  {u.status === "active" ? "Active"
                    : u.status === "hr_reviewed" ? "HR Reviewed"
                    : u.status === "rejected" ? "Rejected"
                    : u.status === "revoked" ? "Revoked"
                    : "Pending"}
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