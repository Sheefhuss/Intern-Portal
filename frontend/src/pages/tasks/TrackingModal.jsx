import { useState } from "react";
import { statusColors } from "../../utils/tasksConstants";

export default function TrackingModal({
  task, rows, loading, acting, isHR, isAdmin,
  onForward, onReview, onReset, onClose,
  comments, commentsLoading, postingComment, onPostComment, currentUserId,
}) {
  const [draft, setDraft] = useState("");

  if (!task) return null;

  const handlePost = async () => {
    if (!draft.trim()) return;
    await onPostComment(draft.trim());
    setDraft("");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(17,24,39,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 28,
        width: 660, maxWidth: "92vw", maxHeight: "80vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{task.title}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Per-intern submission status</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F3F4F6", border: "none", borderRadius: 6,
              width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "#6B7280",
            }}
          >✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF", fontSize: 13 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF", fontSize: 13 }}>No interns assigned to this task.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map(row => {
              const sc = statusColors[row.status] || statusColors.pending;
              const isActing = acting === row.submissionId;
              return (
                <div
                  key={row.internId}
                  style={{
                    padding: "12px 14px", border: "1px solid #F3F4F6",
                    borderRadius: 8, display: "flex", flexDirection: "column", gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{row.internName}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{row.internEmail}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px",
                        borderRadius: 20, background: sc.bg, color: sc.text,
                      }}>
                        {sc.label}
                      </span>

                      {row.source === "backfill" && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px",
                          borderRadius: 20, background: "#FEF3C7", color: "#92400E",
                        }} title="Migrated from old data, not submitted through the portal.">
                          ⚠ Backfilled
                        </span>
                      )}

                      {isHR && row.status === "submitted" && row.submissionId && (
                        <button
                          onClick={() => onForward(row.submissionId)}
                          disabled={isActing}
                          style={{
                            padding: "6px 12px",
                            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                            color: "#fff", border: "none", borderRadius: 6,
                            fontSize: 11, fontWeight: 600,
                            cursor: isActing ? "not-allowed" : "pointer", fontFamily: "inherit",
                          }}
                        >
                          {isActing ? "…" : "Forward →"}
                        </button>
                      )}

                      {isAdmin && row.status === "hr_reviewed" && row.submissionId && (
                        <button
                          onClick={() => onReview(row.submissionId)}
                          disabled={isActing}
                          style={{
                            padding: "6px 12px", background: "#10B981", color: "#fff",
                            border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600,
                            cursor: isActing ? "not-allowed" : "pointer", fontFamily: "inherit",
                          }}
                        >
                          {isActing ? "…" : "✓ Review"}
                        </button>
                      )}

                      {(isAdmin || isHR) && row.status !== "pending" && row.submissionId && (
                        <button
                          onClick={() => onReset(row.submissionId, row.internName)}
                          disabled={isActing}
                          style={{
                            padding: "6px 12px", background: "#fff", color: "#DC2626",
                            border: "1px solid #FCA5A5", borderRadius: 6,
                            fontSize: 11, fontWeight: 600,
                            cursor: isActing ? "not-allowed" : "pointer", fontFamily: "inherit",
                          }}
                        >
                          {isActing ? "…" : "↺ Reset"}
                        </button>
                      )}
                    </div>
                  </div>

                  {row.submissionUrl && (
                    <div style={{
                      background: "#F8FAFC", borderRadius: 6, padding: "8px 10px",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    }}>
                      <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>Submission:</div>
                      <a
                        href={row.submissionUrl.startsWith("http") ? row.submissionUrl : `https://${row.submissionUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 11, color: "#2563EB", fontWeight: 600,
                          wordBreak: "break-all", textDecoration: "none",
                        }}
                      >
                        {row.submissionUrl} ↗
                      </a>
                    </div>
                  )}

                  {row.submittedAt && (
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                      Submitted: {new Date(row.submittedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", marginBottom: 10 }}>
            💬 Notes for HR / Admin
          </div>

          {commentsLoading ? (
            <div style={{ textAlign: "center", padding: 16, color: "#9CA3AF", fontSize: 12 }}>Loading notes…</div>
          ) : comments.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>
              No notes yet. Use this to flag issues or updates between HR and Admin on this task.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 220, overflowY: "auto" }}>
              {comments.map(c => {
                const isMine = c.author === currentUserId;
                return (
                  <div
                    key={c._id}
                    style={{
                      padding: "8px 12px", borderRadius: 8,
                      background: isMine ? "#F5F3FF" : "#F9FAFB",
                      border: "1px solid " + (isMine ? "#DDD6FE" : "#F3F4F6"),
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c.authorRole === "admin" ? "#DC2626" : "#7C3AED" }}>
                        {c.authorName} · {c.authorRole.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#374151", whiteSpace: "pre-wrap" }}>{c.text}</div>
                  </div>
                );
              })}
            </div>
          )}

          {(isHR || isAdmin) && (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !postingComment) handlePost(); }}
                placeholder="Add a note for HR/Admin about this task…"
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8,
                  border: "1px solid #E5E7EB", fontSize: 12, fontFamily: "inherit", outline: "none",
                }}
              />
              <button
                onClick={handlePost}
                disabled={postingComment || !draft.trim()}
                style={{
                  padding: "8px 16px", background: "#7C3AED", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: (postingComment || !draft.trim()) ? "not-allowed" : "pointer",
                  opacity: (postingComment || !draft.trim()) ? 0.6 : 1,
                  fontFamily: "inherit",
                }}
              >
                {postingComment ? "Posting…" : "Post"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}