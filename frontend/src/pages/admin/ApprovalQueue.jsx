import React from "react";
import { COLORS, S } from "../../utils/theme";
import { domainColor } from "../../utils/adminConstants";

export default function ApprovalQueue({ reviewed, batchInputs, setBatchInputs, decide, acting }) {
  return (
    <div style={S.card}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>⚙️ Admin Approval Queue</div>
      <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>
        These applications have been reviewed and forwarded by HR.
      </p>

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
                  <span style={{
                    background: (domainColor[u.domain] || "#6B7280") + "22",
                    color: domainColor[u.domain] || "#6B7280",
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  }}>
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