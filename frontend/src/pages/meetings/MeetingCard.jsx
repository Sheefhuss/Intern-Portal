import { S, COLORS } from "../../utils/theme";
import { btnGhost, fmt } from "./constants";
import StatusBadge from "./StatusBadge";

export default function MeetingCard({ m, isAdmin, acting, onDelete, onReschedule }) {
  return (
    <div style={{ ...S.card, padding: 20, borderLeft: `4px solid ${COLORS.purple}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{m.title}</span>
            <StatusBadge status={m.status} />
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280", fontWeight: 600 }}>
              {m.scope}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span>🕐 {fmt(m.scheduledAt)}</span>
            <span>⏱ {m.duration} min</span>
            {m.bookedBy && <span>👤 Booked by: <strong>{m.bookedBy.name || "Intern"}</strong></span>}
          </div>
          {m.meetLink && (
            <a href={m.meetLink} target="_blank" rel="noreferrer"
              style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: COLORS.purple, fontWeight: 600, textDecoration: "none" }}>
              🔗 Meeting Link
            </a>
          )}
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onReschedule(m)} disabled={acting === m._id}
              style={{ ...btnGhost, color: COLORS.purple, borderColor: "#DDD6FE", fontSize: 12 }}>
              Reschedule
            </button>
            <button onClick={() => onDelete(m._id)} disabled={acting === m._id}
              style={{ ...btnGhost, color: "#EF4444", borderColor: "#FCA5A5", fontSize: 12 }}>
              {acting === m._id ? "…" : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}