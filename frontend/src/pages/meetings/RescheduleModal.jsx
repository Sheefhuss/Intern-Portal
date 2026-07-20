import { inputStyle, labelStyle, btnPrimary, btnGhost } from "./constants";

export default function RescheduleModal({ target, form, setForm, acting, onReschedule, onClose }) {
  if (!target) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
    }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 420, maxWidth: "90vw" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Reschedule Meeting</div>
        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
          "{target.title}"
          {target.bookedBy?.name && <> — currently booked by <strong>{target.bookedBy.name}</strong>, who will be notified.</>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>New Date & Time *</label>
            <input style={inputStyle} type="datetime-local" value={form.scheduledAt}
              onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Meeting Link (leave blank to keep existing)</label>
            <input style={inputStyle} placeholder="https://meet.brevo.com/..." value={form.meetLink}
              onChange={e => setForm({ ...form, meetLink: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onReschedule} style={btnPrimary} disabled={acting === target._id}>
            {acting === target._id ? "Saving…" : "Reschedule"}
          </button>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
        </div>
      </div>
    </div>
  );
}