import { S } from "../../utils/theme";
import { inputStyle, labelStyle, btnPrimary, btnGhost } from "./constants";

export default function SlotForm({ slotForm, setSlotForm, posting, onSubmit, onCancel, interns }) {
  return (
    <div style={{ ...S.card, padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: "#111827" }}>Create Meeting Slot</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} placeholder="e.g. Weekly Check-in" value={slotForm.title}
            onChange={e => setSlotForm({ ...slotForm, title: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Meeting Link *</label>
          <input style={inputStyle} placeholder="https://meet.brevo.com/..." value={slotForm.meetLink}
            onChange={e => setSlotForm({ ...slotForm, meetLink: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Date & Time *</label>
          <input style={inputStyle} type="datetime-local" value={slotForm.scheduledAt}
            onChange={e => setSlotForm({ ...slotForm, scheduledAt: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Duration (minutes)</label>
          <input style={inputStyle} type="number" min={15} step={15} value={slotForm.duration}
            onChange={e => setSlotForm({ ...slotForm, duration: Number(e.target.value) })} />
        </div>
        <div>
          <label style={labelStyle}>Scope *</label>
          <select style={inputStyle} value={slotForm.scope}
            onChange={e => setSlotForm({ ...slotForm, scope: e.target.value, domain: "", batch: "", assignedTo: "" })}>
            <option value="global">Global (all interns)</option>
            <option value="batch">Specific Batch</option>
            <option value="intern">Specific Intern</option>
          </select>
        </div>
        {slotForm.scope === "batch" && (
          <>
            <div>
              <label style={labelStyle}>Domain *</label>
              <input style={inputStyle} placeholder="e.g. Engineering" value={slotForm.domain}
                onChange={e => setSlotForm({ ...slotForm, domain: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Batch *</label>
              <input style={inputStyle} placeholder="e.g. Batch A" value={slotForm.batch}
                onChange={e => setSlotForm({ ...slotForm, batch: e.target.value })} />
            </div>
          </>
        )}
        {slotForm.scope === "intern" && (
          <div>
            <label style={labelStyle}>Intern *</label>
            <select style={inputStyle} value={slotForm.assignedTo}
              onChange={e => setSlotForm({ ...slotForm, assignedTo: e.target.value })}>
              <option value="">Select intern</option>
              {interns.map(i => (
                <option key={i._id} value={i._id}>{i.name} — {i.domain} / {i.batch}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={onSubmit} style={btnPrimary} disabled={posting}>
          {posting ? "Creating…" : "Create Slot"}
        </button>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}