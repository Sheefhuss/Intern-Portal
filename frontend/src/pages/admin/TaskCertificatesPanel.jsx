import { useState, useEffect } from "react";
import { AuthService } from "../../auth/authService";
import { COLORS, S } from "../../utils/theme";

export default function TaskCertificatesPanel() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(null);
  const [justResent, setJustResent] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await AuthService.apiFetch("/task-certificates");
      setCertificates(data);
    } catch (err) {
      setError(err.message || "Failed to load task certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resend = async (cert) => {
    setResending(cert.certificateId);
    setError("");
    try {
      await AuthService.apiFetch(`/task-certificates/${cert.certificateId}/resend`, {
        method: "POST",
      });
      setJustResent(cert.certificateId);
      await load();
      setTimeout(() => setJustResent(null), 4000);
    } catch (err) {
      setError(err.message || "Failed to resend certificate.");
    } finally {
      setResending(null);
    }
  };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>📜 Task Certificates</div>
        <button
          onClick={load}
          style={{
            background: "#fff", color: "#7C3AED", border: "1px solid #DDD6FE",
            borderRadius: 7, padding: "5px 12px", fontSize: 11.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          ↻ Refresh
        </button>
      </div>
      <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>
        These are auto-issued the moment an admin reviews a submitted task. If an intern says they
        never got the email (or it failed because of a server issue), just hit Resend — it
        re-generates the PDF and re-sends the email, no need to redo the review.
      </p>

      {error && (
        <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#DC2626", marginBottom: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: COLORS.muted, padding: "24px 0", fontSize: 13 }}>
          Loading…
        </div>
      ) : certificates.length === 0 ? (
        <div style={{ textAlign: "center", color: COLORS.muted, padding: "24px 0", fontSize: 13 }}>
          No task certificates issued yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {certificates.map((cert) => {
            const student = cert.student || {};
            const isResending = resending === cert.certificateId;
            const isJustResent = justResent === cert.certificateId;

            return (
              <div key={cert._id} style={{
                border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{student.name || "Unknown intern"}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{student.email}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                    {cert.task?.title || cert.taskTitle}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2, fontFamily: "'Courier New',monospace" }}>
                    {cert.certificateId}
                  </div>
                </div>

                <span style={{
                  fontSize: 11.5, fontWeight: 600,
                  color: cert.emailSent ? "#16A34A" : "#D97706",
                }}>
                  {cert.emailSent ? "✓ Emailed" : "⏳ Not yet emailed"}
                </span>

                <button
                  onClick={() => resend(cert)}
                  disabled={isResending}
                  style={{
                    padding: "7px 14px",
                    background: isResending ? "#9CA3AF" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
                    color: "#fff", border: "none", borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                    cursor: isResending ? "not-allowed" : "pointer", fontFamily: "inherit",
                  }}
                >
                  {isResending ? "Sending…" : "↻ Resend Email"}
                </button>

                {isJustResent && (
                  <div style={{ width: "100%", marginTop: 4, fontSize: 11.5, color: "#16A34A" }}>
                    Certificate re-sent to {student.name}.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}