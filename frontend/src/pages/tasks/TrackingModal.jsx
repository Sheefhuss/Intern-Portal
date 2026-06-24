import React from "react";
import { statusColors } from "../../utils/tasksConstants";

export default function TrackingModal({
  task, rows, loading, acting, isHR, isAdmin,
  onForward, onReview, onReset, onClose,
}) {
  if (!task) return null;

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

                      {isAdmin && row.status !== "pending" && row.submissionId && (
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
      </div>
    </div>
  );
}