import { S } from "../../utils/theme";
import { btnGhost, fmt } from "./constants";
import StatusBadge from "./StatusBadge";

export default function HistoryCard({ m, isAdmin, acting, onPermanentDelete }) {
  return (
    <div style={{ ...S.card, padding: 20, borderLeft: "4px solid #D1D5DB", opacity: 0.85 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{m.title}</span>
            <StatusBadge status={m.status} />
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280", fontWeight: 600 }}>
              Deleted
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span>🕐 {fmt(m.scheduledAt)}</span>
            {m.bookedBy?.name && <span>👤 Was booked by: <strong>{m.bookedBy.name}</strong></span>}
            {m.createdBy?.name && <span>✍️ Requested by: <strong>{m.createdBy.name}</strong></span>}
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => onPermanentDelete(m._id)} disabled={acting === m._id}
            style={{ ...btnGhost, color: "#EF4444", borderColor: "#FCA5A5", fontSize: 12 }}>
            {acting === m._id ? "…" : "Delete Permanently"}
          </button>
        )}
      </div>
    </div>
  );
}