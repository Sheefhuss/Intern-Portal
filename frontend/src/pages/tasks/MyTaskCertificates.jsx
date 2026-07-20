import { useState, useEffect } from "react";
import { AuthService, API } from "../../auth/authService";
import { COLORS, S } from "../../utils/theme";

export default function MyTaskCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(null);
  const [justResent, setJustResent] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await AuthService.apiFetch("/task-certificates/my");
      setCertificates(data);
    } catch (err) {
      setError(err.message || "Couldn't load your task certificates. Try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const requestResend = async (cert) => {
    setResending(cert.certificateId);
    setError("");
    try {
      await AuthService.apiFetch(`/task-certificates/${cert.certificateId}/request-resend`, {
        method: "POST",
      });
      setJustResent(cert.certificateId);
      setTimeout(() => setJustResent(null), 5000);
    } catch (err) {
      setError(err.message || "Failed to send request. Please try again in a moment.");
    } finally {
      setResending(null);
    }
  };

  if (loading) return null;
  if (!error && certificates.length === 0) return null;

  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>🎓 My Task Certificates</div>

      {error && (
        <div style={{ padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#DC2626", marginBottom: 10 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {certificates.map((cert) => {
          const isResending = resending === cert.certificateId;
          const isJustResent = justResent === cert.certificateId;
          return (
            <div key={cert._id} style={{
              border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{cert.task?.title || cert.taskTitle}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2, fontFamily: "'Courier New',monospace" }}>
                  {cert.certificateId}
                </div>
              </div>

              <a
                href={`${API}/task-certificates/${cert.certificateId}/view`}
                target="_blank" rel="noreferrer"
                style={{
                  padding: "6px 12px", background: "#F3F4F6", color: "#374151",
                  border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                  textDecoration: "none", fontFamily: "inherit",
                }}
              >
                👁 View
              </a>

              <button
                onClick={() => requestResend(cert)}
                disabled={isResending}
                style={{
                  padding: "6px 12px",
                  background: isResending ? "#9CA3AF" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
                  color: "#fff", border: "none", borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                  cursor: isResending ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {isResending ? "Sending…" : "🔔 Didn't get it? Ask admin"}
              </button>

              {isJustResent && (
                <span style={{ fontSize: 11.5, color: "#16A34A" }}>Admin has been notified.</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}