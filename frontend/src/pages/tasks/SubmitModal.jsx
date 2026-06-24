import React, { useState } from "react";

export default function SubmitModal({ task, submitting, onConfirm, onClose }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Submission link is required.");
      return;
    }
    const hasProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://");
    if (!hasProtocol) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setError("");
    onConfirm(trimmed);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(17,24,39,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60,
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 28,
        width: 480, maxWidth: "92vw",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>Submit Task</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{task.title}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F3F4F6", border: "none", borderRadius: 6,
              width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "#6B7280",
            }}
          >✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Submission Link <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="url"
            placeholder="https://drive.google.com/..."
            value={url}
            onChange={e => { setUrl(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleConfirm()}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: error ? "1.5px solid #DC2626" : "1.5px solid #E5E7EB",
              fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box",
              fontFamily: "inherit",
            }}
            autoFocus
          />
          {error && (
            <div style={{ fontSize: 11, color: "#DC2626", marginTop: 5 }}>{error}</div>
          )}
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>
            Paste a Google Drive, GitHub, Notion, or any public link to your work.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "9px 18px", background: "#F3F4F6", border: "none",
              borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151",
              cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              padding: "9px 18px",
              background: submitting ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
          >
            {submitting ? "Submitting…" : "Submit Task"}
          </button>
        </div>
      </div>
    </div>
  );
}