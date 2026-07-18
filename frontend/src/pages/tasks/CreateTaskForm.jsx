import { S } from "../../utils/theme";
import { inputStyle, labelStyle } from "../../utils/tasksConstants";

export default function CreateTaskForm({
  form, setForm, interns, posting, handleCreate, onCancel,
  handleDomainChange, handleBatchChange,
}) {
  const availableDomains = [...new Set(interns.map(i => i.domain).filter(Boolean))];
  const availableBatches = [...new Set(interns.filter(i => i.domain === form.assignedDomain).map(i => i.batch).filter(Boolean))];
  const availableInterns = interns.filter(i => i.domain === form.assignedDomain && i.batch === form.assignedBatch);

  return (
    <div style={{ ...S.card, padding: 24, background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, color: "#111827" }}>➕ Create New Task</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <div>
          <label style={labelStyle}>Task Title *</label>
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Build Landing Page"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Deadline</label>
          <input
            type="date"
            value={form.deadline}
            onChange={e => setForm({ ...form, deadline: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ padding: "16px", background: "#fff", borderRadius: 8, border: "1px solid #E5E7EB", gridColumn: "1 / -1" }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: "#374151" }}>Assignment Target</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <label style={labelStyle}>1. Select Domain *</label>
              <select value={form.assignedDomain} onChange={handleDomainChange} style={inputStyle}>
                <option value="">— Select Domain —</option>
                {availableDomains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>2. Select Batch *</label>
              <select value={form.assignedBatch} onChange={handleBatchChange} disabled={!form.assignedDomain} style={{ ...inputStyle, opacity: form.assignedDomain ? 1 : 0.6 }}>
                <option value="">— Select Batch —</option>
                {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>3. Assignment Type *</label>
              <select
                value={form.assignmentType}
                onChange={e => setForm({ ...form, assignmentType: e.target.value, assignedTo: "" })}
                disabled={!form.assignedBatch}
                style={{ ...inputStyle, opacity: form.assignedBatch ? 1 : 0.6 }}
              >
                <option value="batch">Entire Batch</option>
                <option value="intern">Specific Intern</option>
              </select>
            </div>

            {form.assignmentType === "intern" && (
              <div>
                <label style={labelStyle}>4. Select Intern *</label>
                <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} style={inputStyle}>
                  <option value="">— Select Intern —</option>
                  {availableInterns.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Google Form / Submission Link</label>
          <input
            value={form.submissionLink}
            onChange={e => setForm({ ...form, submissionLink: e.target.value })}
            placeholder="https://forms.google.com/..."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.requiresLink}
              onChange={e => setForm({ ...form, requiresLink: e.target.checked })}
            />
            Require interns to paste a submission link
          </label>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
            Turn this off if the Google Form above <em>is</em> the submission — interns will just be able to mark the task as done with one click.
          </div>
        </div>

        <div>
          <label style={labelStyle}>Brief / Resource Link</label>
          <input
            value={form.formLink}
            onChange={e => setForm({ ...form, formLink: e.target.value })}
            placeholder="https://docs.google.com/..."
            style={inputStyle}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the task requirements..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={handleCreate} disabled={posting} style={{
          padding: "10px 24px", background: "#7C3AED", color: "#fff",
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: posting ? "not-allowed" : "pointer", opacity: posting ? 0.7 : 1,
          fontFamily: "inherit",
        }}>
          {posting ? "Creating..." : "Create Task"}
        </button>
        <button onClick={onCancel} style={{
          padding: "10px 24px", background: "#fff", color: "#374151",
          border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}