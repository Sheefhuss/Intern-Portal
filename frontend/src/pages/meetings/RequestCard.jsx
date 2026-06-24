import { S } from "../../utils/theme";
import { btnGhost, fmt } from "./constants";
import StatusBadge from "./StatusBadge";

export default function RequestCard({ m, isAdmin, acting, onApprove, onReject, onDelete }) {
  const borderColor = m.status === "approved" ? "#10B981"
    : m.status === "rejected" ? "#EF4444"
    : "#F59E0B";

  return (
    <div style={{ ...S.card, padding: 20, borderLeft: `4px solid ${borderColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{m.title}</span>
            <StatusBadge status={m.status} />
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
            From: <strong>{m.createdBy?.name || "Intern"}</strong>
            {m.scheduledAt && <span style={{ marginLeft: 16 }}>Preferred: {fmt(m.scheduledAt)}</span>}
          </div>
          {m.requestNote && (
            <div style={{ fontSize: 13, color: "#4B5563", marginTop: 8, padding: "10px 14px", background: "#F9FAFB", borderRadius: 8 }}>
              {m.requestNote}
            </div>
          )}
          {m.approvalLink && (
            <a href={m.approvalLink} target="_blank" rel="noreferrer"
              style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: "#10B981", fontWeight: 600, textDecoration: "none" }}>
              🔗 Meeting Link
            </a>
          )}
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {m.status === "pending" && (
              <>
                <button onClick={onApprove} style={{ ...btnGhost, color: "#10B981", borderColor: "#6EE7B7" }}>
                  Approve
                </button>
                <button onClick={() => onReject(m._id)} disabled={acting === m._id}
                  style={{ ...btnGhost, color: "#EF4444", borderColor: "#FCA5A5" }}>
                  {acting === m._id ? "…" : "Reject"}
                </button>
              </>
            )}
            <button onClick={() => onDelete(m._id)} disabled={acting === m._id}
              style={{ ...btnGhost, fontSize: 12 }}>
              {acting === m._id ? "…" : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
