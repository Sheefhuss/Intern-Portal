import { useState, useEffect } from "react";
import { AuthService, API } from "../../auth/authService";
import { COLORS, S } from "../../utils/theme";

export default function MyCertificate() {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await AuthService.apiFetch("/certificates/my");
      setCertificate(data);
    } catch (err) {
      setError(err.message || "Couldn't load your certificate status. Try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return null;
  if (!error && !certificate) return null; // nothing issued yet — no need to show an empty card

  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>🏆 My Internship Certificate</div>

      {error && (
        <div style={{ padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#DC2626" }}>
          {error}
        </div>
      )}

      {certificate && (
        <div style={{
          border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Certificate of Completion</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2, fontFamily: "'Courier New',monospace" }}>
              {certificate.certificateId}
            </div>
          </div>

          <a
            href={`${API}/certificates/${certificate.certificateId}/view`}
            target="_blank" rel="noreferrer"
            style={{
              padding: "6px 12px", background: "#F3F4F6", color: "#374151",
              border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11.5, fontWeight: 600,
              textDecoration: "none", fontFamily: "inherit",
            }}
          >
            👁 View
          </a>

          <a
            href={`${API}/certificates/${certificate.certificateId}/download`}
            style={{
              padding: "6px 12px", background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff",
              border: "none", borderRadius: 7, fontSize: 11.5, fontWeight: 600,
              textDecoration: "none", fontFamily: "inherit",
            }}
          >
            ⬇ Download PDF
          </a>
        </div>
      )}
    </div>
  );
}