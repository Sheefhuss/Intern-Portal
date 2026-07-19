import { useState, useEffect } from "react";
import { AuthService } from "../../auth/authService";
import { COLORS, S } from "../../utils/theme";
import { domainColor } from "../../utils/adminConstants";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });

export default function CertificateIssuePanel() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filesByCert, setFilesByCert] = useState({});
  const [issuing, setIssuing] = useState(null);
  const [justIssued, setJustIssued] = useState(null);
  const [tab, setTab] = useState("pending");
  const [recheckId, setRecheckId] = useState("");
  const [rechecking, setRechecking] = useState(false);
  const [recheckMsg, setRecheckMsg] = useState("");

  const [interns, setInterns] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [data, internList] = await Promise.all([
        AuthService.apiFetch("/certificates"),
        AuthService.apiFetch("/admin/users?role=intern"),
      ]);
      setCertificates(data);
      setInterns(internList);
    } catch (err) {
      setError(err.message || "Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const recheck = async () => {
    if (!recheckId) return;
    setRechecking(true);
    setRecheckMsg("");
    try {
      const result = await AuthService.apiFetch(`/tasks/certificates/${recheckId}/resend`, {
        method: "POST",
      });
      setRecheckMsg(
        result?.certificate
          ? "Certificate refreshed — check the Awaiting tab below."
          : "All of this intern's tasks aren't reviewed yet, or nothing changed."
      );
      await load();
    } catch (err) {
      setRecheckMsg(err.message || "Recheck failed.");
    } finally {
      setRechecking(false);
    }
  };

  const pending = certificates.filter((c) => !c.emailSent);
  const issued = certificates.filter((c) => c.emailSent);
  const visible = tab === "pending" ? pending : issued;

  const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8MB raw file (~10.7MB once base64-encoded, safely under the server's 15MB JSON limit)

  const handleFile = (certId, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      alert("That PDF is too large (max 8MB). Try compressing it first.");
      return;
    }
    setFilesByCert((prev) => ({ ...prev, [certId]: file }));
  };

  const issue = async (cert) => {
    const file = filesByCert[cert.certificateId];
    if (!file) return alert("Choose a PDF file first.");

    setIssuing(cert.certificateId);
    setError("");
    try {
      const pdfBase64 = await fileToBase64(file);
      await AuthService.apiFetch(`/certificates/${cert.certificateId}/issue`, {
        method: "POST",
        body: JSON.stringify({ pdfBase64, filename: file.name }),
      });
      setJustIssued(cert.certificateId);
      setFilesByCert((prev) => {
        const next = { ...prev };
        delete next[cert.certificateId];
        return next;
      });
      await load();
      setTimeout(() => setJustIssued(null), 4000);
    } catch (err) {
      setError(err.message || "Failed to issue certificate.");
    } finally {
      setIssuing(null);
    }
  };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>🎓 Certificates</div>
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
        Interns land here once all their assigned tasks are reviewed. Upload the finished
        certificate PDF for each — it's emailed to them directly, nothing is generated automatically.
      </p>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "10px 12px", background: "#FAFAFA", border: `1px solid ${COLORS.border}`,
        borderRadius: 8, marginBottom: 16,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
          Intern's tasks all done but not showing up above?
        </span>
        <select
          value={recheckId}
          onChange={(e) => { setRecheckId(e.target.value); setRecheckMsg(""); }}
          style={{
            fontSize: 12, padding: "6px 8px", borderRadius: 6,
            border: "1px solid #D1D5DB", fontFamily: "inherit", minWidth: 200,
          }}
        >
          <option value="">Select an intern…</option>
          {interns.map((i) => (
            <option key={i._id} value={i._id}>{i.name} ({i.email})</option>
          ))}
        </select>
        <button
          onClick={recheck}
          disabled={!recheckId || rechecking}
          style={{
            padding: "6px 14px",
            background: !recheckId || rechecking ? "#9CA3AF" : "#7C3AED",
            color: "#fff", border: "none", borderRadius: 6, fontSize: 11.5, fontWeight: 600,
            cursor: !recheckId || rechecking ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}
        >
          {rechecking ? "Checking…" : "Recheck certificate"}
        </button>
        {recheckMsg && (
          <span style={{ fontSize: 11.5, color: "#374151" }}>{recheckMsg}</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "pending", label: `Awaiting Certificate (${pending.length})` },
          { id: "issued", label: `Issued (${issued.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "1px solid " + (tab === t.id ? "#7C3AED" : COLORS.border),
              background: tab === t.id ? "#7C3AED" : "#fff",
              color: tab === t.id ? "#fff" : "#374151",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#DC2626", marginBottom: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: COLORS.muted, padding: "24px 0", fontSize: 13 }}>
          Loading…
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: "center", color: COLORS.muted, padding: "24px 0", fontSize: 13 }}>
          {tab === "pending" ? "Nobody is waiting on a certificate right now." : "No certificates issued yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((cert) => {
            const student = cert.student || {};
            const file = filesByCert[cert.certificateId];
            const isIssuing = issuing === cert.certificateId;
            const isJustIssued = justIssued === cert.certificateId;

            return (
              <div key={cert._id} style={{
                border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{student.name || "Unknown intern"}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{student.email}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2, fontFamily: "'Courier New',monospace" }}>
                    {cert.certificateId}
                  </div>
                </div>

                <span style={{
                  background: (domainColor[cert.domain] || "#6B7280") + "22",
                  color: domainColor[cert.domain] || "#6B7280",
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>
                  {cert.domain || "—"}{cert.batch ? ` · ${cert.batch}` : ""}
                </span>

                {tab === "pending" ? (
                  <>
                    <label style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", border: "1.5px solid #E5E7EB", borderRadius: 7,
                      fontSize: 11.5, fontWeight: 600, color: "#374151", cursor: "pointer",
                    }}>
                      📎 {file ? file.name.slice(0, 22) : "Choose PDF"}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFile(cert.certificateId, e.target.files?.[0])}
                        style={{ display: "none" }}
                      />
                    </label>
                    <button
                      onClick={() => issue(cert)}
                      disabled={!file || isIssuing}
                      style={{
                        padding: "7px 14px",
                        background: !file || isIssuing ? "#9CA3AF" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
                        color: "#fff", border: "none", borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                        cursor: !file || isIssuing ? "not-allowed" : "pointer", fontFamily: "inherit",
                      }}
                    >
                      {isIssuing ? "Sending…" : "Email Certificate →"}
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#16A34A" }}>
                    ✓ Emailed
                  </span>
                )}

                {isJustIssued && (
                  <div style={{ width: "100%", marginTop: 4, fontSize: 11.5, color: "#16A34A" }}>
                    Certificate emailed to {student.name}.
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