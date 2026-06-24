import React from "react";
import { COLORS, S } from "../../utils/theme";
import { domainColor } from "../../utils/internsConstants";

export default function PendingTable({ pending, forwarding, forward }) {
  return (
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
  );
}