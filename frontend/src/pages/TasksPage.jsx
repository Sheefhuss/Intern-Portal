import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { S } from "../utils/theme";

const statusColors = {
  pending:   { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  submitted: { bg: "#DBEAFE", text: "#2563EB", label: "Submitted" },
  reviewed:  { bg: "#D1FAE5", text: "#059669", label: "Reviewed" },
};

const emptyForm = {
  title: "", description: "", deadline: "", duration: "",
  submissionLink: "", formLink: "", 
  assignedDomain: "", assignedBatch: "", assignedTo: "",
  assignmentType: "batch"
};

export default function TasksPage({ session }) {
  const role = session?.role?.toLowerCase();
  const isManager = ["admin", "hr"].includes(role);

  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [interns, setInterns]   = useState([]);
  const [posting, setPosting]   = useState(false);
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    AuthService.apiFetch("/tasks")
      .then(data => setTasks(data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));

    if (isManager) {
      AuthService.apiFetch("/auth/interns")
        .then(data => setInterns(data || []))
        .catch(() => setInterns([]));
    }
  }, [isManager]);

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const availableDomains = [...new Set(interns.map(i => i.domain).filter(Boolean))];
  const availableBatches = form.assignedDomain 
    ? [...new Set(interns.filter(i => i.domain === form.assignedDomain).map(i => i.batch).filter(Boolean))]
    : [];
  const availableInterns = interns.filter(i => i.domain === form.assignedDomain && i.batch === form.assignedBatch);

  const handleDomainChange = (e) => {
    setForm({ ...form, assignedDomain: e.target.value, assignedBatch: "", assignedTo: "" });
  };

  const handleBatchChange = (e) => {
    setForm({ ...form, assignedBatch: e.target.value, assignedTo: "" });
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return alert("Title is required.");
    if (!form.assignedDomain) return alert("Domain selection is required.");
    if (!form.assignedBatch) return alert("Batch selection is required.");
    if (form.assignmentType === "intern" && !form.assignedTo) return alert("Please select a specific intern.");
    
    setPosting(true);
    try {
      const newTask = await AuthService.apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTasks([newTask, ...tasks]);
      setForm(emptyForm);
      setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { alert("Failed to create task."); }
    finally { setPosting(false); }
  };

  const handleSubmit = async (taskId) => {
    try {
      await AuthService.apiFetch(`/tasks/${taskId}/submit`, { method: "PATCH" });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: "submitted" } : t));
    } catch { alert("Failed to update status."); }
  };

  const handleReview = async (taskId) => {
    try {
      await AuthService.apiFetch(`/tasks/${taskId}/review`, { method: "PATCH" });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: "reviewed" } : t));
    } catch { alert("Failed to mark as reviewed."); }
  };

  const isOverdue = (deadline) => deadline && new Date(deadline) < new Date();

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #E5E7EB", fontSize: 13,
    fontFamily: "inherit", boxSizing: "border-box", outline: "none",
  };

  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>

      <div style={{ ...S.card, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
            {isManager ? "📋 Task Management" : "📋 My Tasks & Projects"}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} {isManager ? "total" : "assigned"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {["all", "pending", "submitted", "reviewed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "1px solid",
              borderColor: filter === f ? "#7C3AED" : "#E5E7EB",
              background: filter === f ? "#7C3AED" : "#fff",
              color: filter === f ? "#fff" : "#6B7280",
              cursor: "pointer", textTransform: "capitalize",
            }}>{f}</button>
          ))}
          {isManager && (
            <button onClick={() => setShowForm(!showForm)} style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "1px solid #7C3AED",
              background: showForm ? "#F5F3FF" : "#7C3AED",
              color: showForm ? "#7C3AED" : "#fff",
              cursor: "pointer",
            }}>
              {showForm ? "✕ Cancel" : "+ New Task"}
            </button>
          )}
          {success && <span style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}>✓ Task created!</span>}
        </div>
      </div>

      {isManager && showForm && (
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
            
            <div>
              <label style={labelStyle}>Estimated Duration</label>
              <input
                value={form.duration}
                onChange={e => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 3 days"
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
            <button onClick={() => { setForm(emptyForm); setShowForm(false); }} style={{
              padding: "10px 24px", background: "#fff", color: "#374151",
              border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF" }}>Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#9CA3AF" }}>
          {isManager ? "No tasks yet. Create one above." : "No tasks assigned yet."}
        </div>
      ) : (
        filtered.map(task => {
          const overdue = isOverdue(task.deadline) && task.status === "pending";
          const sc = statusColors[task.status] || statusColors.pending;
          return (
            <div key={task._id} style={{
              ...S.card, padding: 20,
              borderLeft: `4px solid ${overdue ? "#EF4444" : task.status === "reviewed" ? "#10B981" : "#7C3AED"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{task.title}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                      background: sc.bg, color: sc.text,
                    }}>{sc.label}</span>
                    {overdue && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "#FEE2E2", color: "#DC2626" }}>
                        ⚠ Overdue
                      </span>
                    )}
                  </div>
                  
                  {isManager && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#6B7280" }}>
                      Assigned to: <span style={{ fontWeight: 600, color: "#4B5563" }}>
                        {task.assignedTo 
                          ? "Specific Intern" 
                          : `${task.assignedDomain || "Any Domain"} - ${task.assignedBatch || "Any Batch"} (Entire Batch)`}
                      </span>
                    </div>
                  )}

                  {task.description && (
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#4B5563", lineHeight: 1.5 }}>{task.description}</p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap", fontSize: 13 }}>
                {task.duration && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6B7280" }}>
                    <span>⏳</span>
                    <span>Est. Duration: <strong>{task.duration}</strong></span>
                  </div>
                )}
                {task.deadline && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: overdue ? "#DC2626" : "#6B7280" }}>
                    <span>📅</span>
                    <span>Due: <strong>{new Date(task.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
                  </div>
                )}
                {task.formLink && (
                  <a href={task.formLink} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, color: "#7C3AED", textDecoration: "none", fontWeight: 600 }}>
                    <span>📄</span> View Brief
                  </a>
                )}
                {task.submissionLink && (
                  <a href={task.submissionLink} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
                    <span>📤</span> Submit via Google Form
                  </a>
                )}
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                {!isManager && task.status === "pending" && (
                  <button onClick={() => handleSubmit(task._id)} style={{
                    padding: "8px 18px", background: "#7C3AED", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Mark as Submitted
                  </button>
                )}
                {isManager && task.status === "submitted" && (
                  <button onClick={() => handleReview(task._id)} style={{
                    padding: "8px 18px", background: "#10B981", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    ✓ Mark as Reviewed
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}