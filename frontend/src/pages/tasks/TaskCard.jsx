import React, { useState } from "react";
import { S } from "../../utils/theme";
import { statusColors, inputStyle } from "../../utils/tasksConstants";

export default function TaskCard({
  task, isManager, currentUserId, submitting, deleting, deletingTask,
  onSubmitClick, onWithdrawClick, onTrackClick, onDeleteClick, onEditDeadline,
}) {
  const sc = statusColors[task.status] || statusColors.pending;
  const isSubmitting = submitting === task._id;
  const isDeleting   = deleting === task._id;
  const isDeletingTask = deletingTask === task._id;
  const isOwner = !!currentUserId && task.createdBy === currentUserId;

  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [deadlineDraft, setDeadlineDraft] = useState("");
  const [savingDeadline, setSavingDeadline] = useState(false);

  const toDateInputValue = (deadline) => (deadline ? new Date(deadline).toISOString().slice(0, 10) : "");

  const startEditingDeadline = () => {
    setDeadlineDraft(toDateInputValue(task.deadline));
    setIsEditingDeadline(true);
  };

  const cancelEditingDeadline = () => {
    setIsEditingDeadline(false);
    setDeadlineDraft("");
  };

  const saveDeadline = async () => {
    setSavingDeadline(true);
    try {
      await onEditDeadline(task, deadlineDraft || null);
      setIsEditingDeadline(false);
    } catch {
      // error already surfaced via alert in the handler; keep the editor open so they can retry
    } finally {
      setSavingDeadline(false);
    }
  };

  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : null;

  const isPastDeadline = task.deadline && new Date(task.deadline) < new Date();

  return (
    <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
              {task.description}
            </div>
          )}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "4px 10px",
          borderRadius: 20, background: sc.bg, color: sc.text, whiteSpace: "nowrap",
        }}>
          {sc.label}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {isEditingDeadline ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="date"
              value={deadlineDraft}
              onChange={e => setDeadlineDraft(e.target.value)}
              style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 12 }}
              autoFocus
            />
            <button
              onClick={saveDeadline}
              disabled={savingDeadline}
              style={{
                padding: "6px 12px", background: "#7C3AED", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: savingDeadline ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}
            >
              {savingDeadline ? "Saving…" : "Save"}
            </button>
            <button
              onClick={cancelEditingDeadline}
              disabled={savingDeadline}
              style={{
                padding: "6px 12px", background: "#fff", color: "#374151",
                border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: savingDeadline ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {deadlineStr ? (
              <div style={{ fontSize: 12, color: isPastDeadline ? "#DC2626" : "#6B7280", fontWeight: isPastDeadline ? 600 : 400 }}>
                {isPastDeadline ? "⚠ " : ""}Due: {deadlineStr}
              </div>
            ) : (
              isManager && isOwner && (
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>No deadline set</div>
              )
            )}
            {isManager && isOwner && onEditDeadline && (
              <button
                onClick={startEditingDeadline}
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  fontSize: 12, color: "#7C3AED", fontWeight: 600, padding: 0,
                }}
              >
                ✎ {deadlineStr ? "Edit" : "Set date"}
              </button>
            )}
          </div>
        )}
        {task.assignedDomain && (
          <div style={{ fontSize: 12, color: "#6B7280" }}>Domain: {task.assignedDomain}</div>
        )}
        {task.assignedBatch && (
          <div style={{ fontSize: 12, color: "#6B7280" }}>Batch: {task.assignedBatch}</div>
        )}
      </div>

      {isManager && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {task.assigneeCount !== undefined && (
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              Assignees: <strong style={{ color: "#111827" }}>{task.assigneeCount}</strong>
            </div>
          )}
          {task.submittedCount !== undefined && (
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              Submitted: <strong style={{ color: "#2563EB" }}>{task.submittedCount}</strong>
            </div>
          )}
          {task.hrReviewedCount !== undefined && (
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              HR Reviewed: <strong style={{ color: "#7C3AED" }}>{task.hrReviewedCount}</strong>
            </div>
          )}
          {task.reviewedCount !== undefined && (
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              Reviewed: <strong style={{ color: "#10B981" }}>{task.reviewedCount}</strong>
            </div>
          )}
        </div>
      )}

      {task.submissionLink && (
        <a
          href={task.submissionLink.startsWith("http") ? task.submissionLink : `https://${task.submissionLink}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
        >
          Submission Form ↗
        </a>
      )}

      {task.formLink && (
        <a
          href={task.formLink.startsWith("http") ? task.formLink : `https://${task.formLink}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
        >
          Task Form ↗
        </a>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 4 }}>
        {isManager ? (
          <>
            <button
              onClick={() => onTrackClick(task)}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #1E40AF, #1D4ED8)",
                color: "#fff", border: "none", borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Track Submissions
            </button>
            {onDeleteClick && isOwner && (
              <button
                onClick={() => onDeleteClick(task)}
                disabled={isDeletingTask}
                style={{
                  padding: "8px 16px", background: "#fff", color: "#DC2626",
                  border: "1px solid #FCA5A5", borderRadius: 8,
                  fontSize: 12, fontWeight: 600,
                  cursor: isDeletingTask ? "not-allowed" : "pointer", fontFamily: "inherit",
                  opacity: isDeletingTask ? 0.7 : 1,
                }}
              >
                {isDeletingTask ? "Deleting…" : "🗑 Delete"}
              </button>
            )}
          </>
        ) : (
          <>
            {task.status === "pending" && (
              <button
                onClick={() => onSubmitClick(task)}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  background: isSubmitting ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)",
                  color: "#fff", border: "none", borderRadius: 8,
                  fontSize: 12, fontWeight: 600,
                  cursor: isSubmitting ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {isSubmitting ? "Submitting…" : task.requiresLink === false ? "Mark as Submitted" : "Submit Task"}
              </button>
            )}

            {task.status === "submitted" && (
              <button
                onClick={() => onWithdrawClick(task._id)}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px", background: "#fff", color: "#DC2626",
                  border: "1px solid #FCA5A5", borderRadius: 8,
                  fontSize: 12, fontWeight: 600,
                  cursor: isDeleting ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {isDeleting ? "Withdrawing…" : "↺ Withdraw"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}