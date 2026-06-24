import { S, COLORS } from "../../utils/theme"; 
import { btnPrimary, btnGhost, fmt } from "./constants"; 
import StatusBadge from "./StatusBadge";

export function InternSlotCard({ m, acting, alreadyBooked, onBook }) {
  return (
    <div style={{ ...S.card, padding: 20, borderLeft: "4px solid #10B981" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{m.title}</span>
            <StatusBadge status={m.status} />
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span>🕐 {fmt(m.scheduledAt)}</span>
            <span>⏱ {m.duration} min</span>
          </div>
        </div>
        <button onClick={() => onBook(m._id)} disabled={acting === m._id || alreadyBooked}
          style={{
            ...btnPrimary,
            background: alreadyBooked ? "#9CA3AF" : "#10B981",
            cursor: alreadyBooked ? "not-allowed" : "pointer",
          }}>
          {acting === m._id ? "Booking…" : alreadyBooked ? "Already Booked" : "Book Slot"}
        </button>
      </div>
    </div>
  );
}

export function BookedCard({ m, acting, onCancel }) {
  return (
    <div style={{ ...S.card, padding: 24, borderLeft: "4px solid #2563EB", background: "linear-gradient(135deg, #EFF6FF, #fff)" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🎉 Your Booked Meeting</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{m.title}</span>
        <StatusBadge status={m.status} />
      </div>
      <div style={{ fontSize: 13, color: "#6B7280", display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 14 }}>
        <span>🕐 {fmt(m.scheduledAt)}</span>
        <span>⏱ {m.duration} min</span>
      </div>
      {m.meetLink && (
        <a href={m.meetLink} target="_blank" rel="noreferrer"
          style={{
            display: "inline-block", padding: "10px 20px", background: COLORS.purple,
            color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 14,
          }}>
          🔗 Join Meeting
        </a>
      )}
      <div>
        <button onClick={() => onCancel(m._id)} disabled={acting === m._id}
          style={{ ...btnGhost, color: "#EF4444", borderColor: "#FCA5A5", fontSize: 12 }}>
          {acting === m._id ? "Cancelling…" : "Cancel Booking"}
        </button>
      </div>
    </div>
  );
}

export function MyRequestCard({ m }) {
  const borderColor = m.status === "approved" ? "#10B981"
    : m.status === "rejected" ? "#EF4444"
    : "#F59E0B";

  return (
    <div style={{ ...S.card, padding: 20, borderLeft: `4px solid ${borderColor}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{m.title}</span>
        <StatusBadge status={m.status} />
      </div>
      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>
        {m.scheduledAt && <span>Preferred: {fmt(m.scheduledAt)}</span>}
      </div>
      {m.requestNote && (
        <div style={{ fontSize: 13, color: "#4B5563", padding: "10px 14px", background: "#F9FAFB", borderRadius: 8, marginBottom: 10 }}>
          {m.requestNote}
        </div>
      )}
      {m.status === "approved" && m.approvalLink && (
        <a href={m.approvalLink} target="_blank" rel="noreferrer"
          style={{
            display: "inline-block", padding: "10px 20px", background: "#10B981",
            color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
          🔗 Join Meeting
        </a>
      )}
      {m.status === "approved" && !m.approvalLink && (
        <div style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>
          ✅ Approved — meeting link will be shared soon.
        </div>
      )}
      {m.status === "rejected" && (
        <div style={{ fontSize: 13, color: "#DC2626" }}>
          ❌ Not approved. Contact HR for details.
        </div>
      )}
    </div>
  );
}
