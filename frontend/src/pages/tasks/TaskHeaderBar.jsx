import { S } from "../../utils/theme";

export default function TaskHeaderBar({ isManager, taskCount, filter, setFilter, showForm, setShowForm, success }) {
  return (
    <div style={{ ...S.card, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
          {isManager ? "📋 Task Management" : "📋 My Tasks & Projects"}
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
          {taskCount} task{taskCount !== 1 ? "s" : ""} {isManager ? "total" : "assigned"}
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
  );
}