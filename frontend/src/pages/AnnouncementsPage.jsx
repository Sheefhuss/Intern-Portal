import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { S, COLORS } from "../utils/theme";

const statusColors = {
  pending:   { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  submitted: { bg: "#DBEAFE", text: "#2563EB", label: "Submitted" },
  reviewed:  { bg: "#D1FAE5", text: "#059669", label: "Reviewed" },
};

export default function TasksPage({ session }) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    AuthService.apiFetch("/tasks")
      .then(data => setTasks(data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const handleSubmit = async (taskId) => {
    try {
      await AuthService.apiFetch(`/tasks/${taskId}/submit`, { method: "PATCH" });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: "submitted" } : t));
    } catch { alert("Failed to update status."); }
  };

  const isOverdue = (deadline) =>
    deadline && new Date(deadline) < new Date() ;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>

      <div style={{ ...S.card, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>📋 My Tasks & Projects</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF" }}>Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#9CA3AF" }}>
          No tasks found.
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
                {task.submissionLink && (
                  <a href={task.submissionLink} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
                    <span>📤</span> Submit via Google Form
                  </a>
                )}
              </div>

              {task.status === "pending" && (
                <div style={{ marginTop: 14 }}>
                  <button onClick={() => handleSubmit(task._id)} style={{
                    padding: "8px 18px", background: "#7C3AED", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                  }}>
                    Mark as Submitted
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}