import { S } from "../../utils/theme";
import { inputStyle, labelStyle, btnPrimary, btnGhost } from "./constants";

export default function RequestForm({ reqForm, setReqForm, requesting, onSubmit, onCancel }) {
  return (
    <div style={{ ...S.card, padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: "#111827" }}>Request a Meeting</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} placeholder="e.g. Task clarification" value={reqForm.title}
            onChange={e => setReqForm({ ...reqForm, title: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Preferred Date & Time</label>
          <input style={inputStyle} type="datetime-local" value={reqForm.preferredAt}
            onChange={e => setReqForm({ ...reqForm, preferredAt: e.target.value })} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Purpose / Note *</label>
          <textarea style={{ ...inputStyle, height: 80, resize: "vertical" }}
            placeholder="Briefly describe what you'd like to discuss…"
            value={reqForm.requestNote}
            onChange={e => setReqForm({ ...reqForm, requestNote: e.target.value })} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onSubmit} style={btnPrimary} disabled={requesting}>
          {requesting ? "Sending…" : "Send Request"}
        </button>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}
