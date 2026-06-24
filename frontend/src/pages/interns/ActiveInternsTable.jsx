import React, { useState } from "react";
import { COLORS, S } from "../../utils/theme";
import { domainColor, statusColors } from "../../utils/internsConstants";
import ProgressBar from "../../components/ProgressBar";

export default function ActiveInternsTable({ active, progress }) {
  const [expandedIntern, setExpandedIntern] = useState(null);

  const getInternTasks = (user) => progress[user._id] || [];

  return (
    <div style={S.card}>
      <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>👥 Active Intern Registry</div>
      {active.length === 0 ? (
        <div style={{ textAlign: "center", color: COLORS.muted, padding: "32px 0", fontSize: 13 }}>
          No active interns yet.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: COLORS.muted, textAlign: "left", borderBottom: `1px solid ${COLORS.border}` }}>
              <th style={{ padding: "8px 12px" }}>Name / Email</th>
              <th style={{ padding: "8px 12px" }}>Domain & Batch</th>
              <th style={{ padding: "8px 12px" }}>Joining Date</th>
              <th style={{ padding: "8px 12px", width: 200 }}>Overall Progress</th>
              <th style={{ padding: "8px 12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.map(u => {
              const internTasks = getInternTasks(u);
              const submittedCount = internTasks.filter(t => ['submitted', 'hr_reviewed', 'reviewed'].includes(t.status)).length;
              const reviewedCount = internTasks.filter(t => t.status === 'reviewed').length;
              const total = internTasks.length;
              const progressPercent = total === 0 ? 0 : Math.round((reviewedCount / total) * 100);
              const isExpanded = expandedIntern === u._id;

              return (
                <React.Fragment key={u._id}>
                  <tr style={{ borderBottom: isExpanded ? "none" : `1px solid ${COLORS.border}`, background: isExpanded ? "#F9FAFB" : "#fff" }}>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          background: (domainColor[u.domain] || "#6B7280") + "22",
                          color: domainColor[u.domain] || "#6B7280",
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        }}>{u.domain}</span>
                        <span style={{ fontSize: 12, color: "#4B5563", fontWeight: 600 }}>{u.batch || "No Batch"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px", color: "#4B5563" }}>
                      {new Date(u.appliedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4, fontWeight: 600, color: "#4B5563" }}>
                        <span>{reviewedCount} reviewed · {submittedCount} submitted / {total}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <ProgressBar pct={progressPercent} />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => setExpandedIntern(isExpanded ? null : u._id)}
                        style={{
                          background: isExpanded ? "#E5E7EB" : "#F3F4F6", color: "#374151",
                          border: "1px solid #D1D5DB", borderRadius: 6, padding: "6px 12px",
                          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                        }}
                      >
                        {isExpanded ? "Close" : "Track Submissions"}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${COLORS.border}` }}>
                      <td colSpan="5" style={{ padding: "0 24px 24px 24px" }}>
                        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}>
                          <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "#111827" }}>Assigned Tasks & Submissions</h4>
                          {internTasks.length === 0 ? (
                            <div style={{ fontSize: 12, color: COLORS.muted }}>No tasks assigned to this intern yet.</div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {internTasks.map(task => {
                                const sc = statusColors[task.status] || statusColors.pending;
                                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status === "pending";
                                return (
                                  <div key={task.taskId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid #F3F4F6", borderRadius: 6 }}>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{task.title}</div>
                                      <div style={{ fontSize: 11, color: isOverdue ? "#DC2626" : COLORS.muted, marginTop: 2 }}>
                                        {task.deadline ? `Due: ${new Date(task.deadline).toLocaleDateString("en-IN")}` : "No deadline"}
                                        {isOverdue && " (Overdue)"}
                                      </div>
                                      {task.submissionUrl && (
                                        <a href={task.submissionUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#2563EB", fontWeight: 600 }}>
                                          View submission ↗
                                        </a>
                                      )}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      {task.source === "backfill" && (
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#FEF3C7", color: "#92400E" }} title="This status was migrated from old data, not submitted by the intern through the portal.">
                                          ⚠ Backfilled
                                        </span>
                                      )}
                                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>
                                        {sc.label}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}