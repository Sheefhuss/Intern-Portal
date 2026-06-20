import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { S } from "../utils/theme";

const statusColors = {
  pending:     { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  submitted:   { bg: "#DBEAFE", text: "#2563EB", label: "Submitted" },
  hr_reviewed: { bg: "#EDE9FE", text: "#7C3AED", label: "HR Reviewed" },
  reviewed:    { bg: "#D1FAE5", text: "#059669", label: "Reviewed" },
};

const creatorBadge = {
  hr:    { bg: "#EDE9FE", text: "#7C3AED", label: "HR" },
  admin: { bg: "#FEE2E2", text: "#DC2626", label: "Admin" },
};

const emptyForm = {
  title: "", description: "", deadline: "",
  submissionLink: "", formLink: "",
  assignedDomain: "", assignedBatch: "", assignedTo: "",
  assignmentType: "batch"
};

export default function TasksPage({ session }) {
  const role = session?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isHR = role === "hr";
  const isManager = isAdmin || isHR;

  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [interns, setInterns]   = useState([]);
  const [posting, setPosting]   = useState(false);
  const [success, setSuccess]   = useState(false);

  const [submitModalTask, setSubmitModalTask] = useState(null);
  const [submitUrl, setSubmitUrl]             = useState("");
  const [submitting, setSubmitting]           = useState(false);
  const [submitError, setSubmitError]         = useState("");

  const [trackingTask, setTrackingTask]       = useState(null);
  const [trackingRows, setTrackingRows]       = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [acting, setActing]                   = useState(null);

  useEffect(() => {
    AuthService.apiFetch("/tasks")
      .then(data => setTasks(data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));

    if (isManager) {
      AuthService.apiFetch("/admin/users?status=active&role=intern")
        .then(data => setInterns(data))
        .catch(() => setInterns([]));
    }
  }, [isManager]);

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const availableDomains = [...new Set(interns.map(i => i.domain).filter(Boolean))];
  const availableBatches = [...new Set(interns.filter(i => i.domain === form.assignedDomain).map(i => i.batch).filter(Boolean))];
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

  const openSubmitModal = (task) => {
    setSubmitModalTask(task);
    setSubmitUrl("");
    setSubmitError("");
  };

  const confirmSubmit = async () => {
    if (!submitUrl.trim()) { setSubmitError("A submission link is required."); return; }
    try { new URL(submitUrl.trim()); } catch { setSubmitError("Please enter a valid URL."); return; }

    setSubmitting(true);
    try {
      await AuthService.apiFetch(`/tasks/${submitModalTask._id}/submit`, {
        method: "PATCH",
        body: JSON.stringify({ submissionUrl: submitUrl.trim() }),
      });
      setTasks(tasks.map(t => t._id === submitModalTask._id
        ? { ...t, status: "submitted", submissionUrl: submitUrl.trim() }
        : t));
      setSubmitModalTask(null);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  const openTracking = async (task) => {
    setTrackingTask(task);
    setTrackingLoading(true);
    try {
      const rows = await AuthService.apiFetch(`/tasks/${task._id}/submissions`);
      setTrackingRows(rows);
    } catch {
      setTrackingRows([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  const forwardSubmission = async (submissionId) => {
    setActing(submissionId);
    try {
      await AuthService.apiFetch(`/tasks/submissions/${submissionId}/forward`, { method: "PATCH" });
      setTrackingRows(rows => rows.map(r => r.submissionId === submissionId ? { ...r, status: "hr_reviewed" } : r));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  };

  const reviewSubmission = async (submissionId) => {
    setActing(submissionId);
    try {
      await AuthService.apiFetch(`/tasks/submissions/${submissionId}/review`, { method: "PATCH" });
      setTrackingRows(rows => rows.map(r => r.submissionId === submissionId ? { ...r, status: "reviewed" } : r));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  };

  const resetSubmission = async (submissionId, internName) => {
    if (!window.confirm(`Reset ${internName}'s submission back to Pending? This clears their submitted link and status.`)) return;
    setActing(submissionId);
    try {
      await AuthService.apiFetch(`/tasks/submissions/${submissionId}/reset`, { method: "PATCH" });
      setTrackingRows(rows => rows.map(r => r.submissionId === submissionId
        ? { ...r, status: "pending", submissionUrl: "", source: "intern" }
        : r));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
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
          {["all", "pending", "submitted", "hr_reviewed", "reviewed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "1px solid",
              borderColor: filter === f ? "#7C3AED" : "#E5E7EB",
              background: filter === f ? "#7C3AED" : "#fff",
              color: filter === f ? "#fff" : "#6B7280",
              cursor: "pointer", textTransform: "capitalize",
            }}>{f === "hr_reviewed" ? "HR Reviewed" : f}</button>
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
          const cb = creatorBadge[task.createdByRole];
          const isBatchTask = !task.assignedTo;
          return (
            <div key={task._id} style={{
              ...S.card, padding: 20,
              borderLeft: `4px solid ${overdue ? "#EF4444" : task.status === "reviewed" ? "#10B981" : "#7C3AED"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{task.title}</span>
                    {!isManager && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                        background: sc.bg, color: sc.text,
                      }}>{sc.label}</span>
                    )}
                    {overdue && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "#FEE2E2", color: "#DC2626" }}>
                        ⚠ Overdue
                      </span>
                    )}
                    {isManager && cb && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                        background: cb.bg, color: cb.text,
                      }}>
                        👤 {cb.label}
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
                      {isBatchTask && (
                        <span style={{ marginLeft: 10 }}>
                          · <strong>{task.submittedCount + task.hrReviewedCount + task.reviewedCount}/{task.assigneeCount}</strong> submitted
                        </span>
                      )}
                    </div>
                  )}

                  {task.description && (
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#4B5563", lineHeight: 1.5 }}>{task.description}</p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap", fontSize: 13 }}>
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
                {task.submissionLink && !isManager && (
                  <a href={task.submissionLink} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
                    <span>📤</span> Submit via Google Form
                  </a>
                )}
                {!isManager && task.submissionUrl && (
                  <a href={task.submissionUrl} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669", textDecoration: "none", fontWeight: 600 }}>
                    <span>🔗</span> View My Submission
                  </a>
                )}
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                {!isManager && task.status === "pending" && (
                  <button onClick={() => openSubmitModal(task)} style={{
                    padding: "8px 18px", background: "#7C3AED", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Mark as Submitted
                  </button>
                )}

                {isManager && (
                  <button onClick={() => openTracking(task)} style={{
                    padding: "8px 18px", background: "#F3F4F6", color: "#374151",
                    border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Track Submissions
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {submitModalTask && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(17,24,39,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 440, maxWidth: "90vw" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 6 }}>Submit Task</div>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
              Paste the link to your completed work for "<strong>{submitModalTask.title}</strong>".
            </p>
            <input
              value={submitUrl}
              onChange={e => setSubmitUrl(e.target.value)}
              placeholder="https://github.com/your-repo/pull/12"
              autoFocus
              style={inputStyle}
            />
            {submitError && <div style={{ color: "#DC2626", fontSize: 12, marginTop: 8 }}>{submitError}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={confirmSubmit} disabled={submitting} style={{
                padding: "10px 22px", background: "#7C3AED", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
                fontFamily: "inherit",
              }}>
                {submitting ? "Submitting…" : "Confirm Submission"}
              </button>
              <button onClick={() => setSubmitModalTask(null)} style={{
                padding: "10px 22px", background: "#fff", color: "#374151",
                border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {trackingTask && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(17,24,39,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 640, maxWidth: "92vw", maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{trackingTask.title}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>Per-intern submission status</div>
              </div>
              <button onClick={() => setTrackingTask(null)} style={{
                background: "#F3F4F6", border: "none", borderRadius: 6, width: 28, height: 28,
                cursor: "pointer", fontSize: 14, color: "#6B7280",
              }}>✕</button>
            </div>

            {trackingLoading ? (
              <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF", fontSize: 13 }}>Loading…</div>
            ) : trackingRows.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF", fontSize: 13 }}>No interns assigned to this task.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {trackingRows.map(row => {
                  const sc = statusColors[row.status] || statusColors.pending;
                  const isActing = acting === row.submissionId;
                  return (
                    <div key={row.internId} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", border: "1px solid #F3F4F6", borderRadius: 8, flexWrap: "wrap", gap: 10,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{row.internName}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{row.internEmail}</div>
                        {row.submissionUrl && (
                          <a href={row.submissionUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#2563EB", fontWeight: 600 }}>
                            View submission ↗
                          </a>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>
                          {sc.label}
                        </span>
                        {row.source === "backfill" && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#FEF3C7", color: "#92400E" }} title="This status was migrated from old data, not submitted by the intern through the portal.">
                            ⚠ Backfilled
                          </span>
                        )}
                        {isHR && row.status === "submitted" && row.submissionId && (
                          <button onClick={() => forwardSubmission(row.submissionId)} disabled={isActing} style={{
                            padding: "6px 12px", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff",
                            border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: isActing ? "not-allowed" : "pointer", fontFamily: "inherit",
                          }}>
                            {isActing ? "…" : "Forward →"}
                          </button>
                        )}
                        {isAdmin && row.status === "hr_reviewed" && row.submissionId && (
                          <button onClick={() => reviewSubmission(row.submissionId)} disabled={isActing} style={{
                            padding: "6px 12px", background: "#10B981", color: "#fff",
                            border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: isActing ? "not-allowed" : "pointer", fontFamily: "inherit",
                          }}>
                            {isActing ? "…" : "✓ Review"}
                          </button>
                        )}
                        {isAdmin && row.status !== "pending" && row.submissionId && (
                          <button onClick={() => resetSubmission(row.submissionId, row.internName)} disabled={isActing} style={{
                            padding: "6px 12px", background: "#fff", color: "#DC2626",
                            border: "1px solid #FCA5A5", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: isActing ? "not-allowed" : "pointer", fontFamily: "inherit",
                          }}>
                            {isActing ? "…" : "↺ Reset"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}