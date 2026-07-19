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

export default function OfferLetterPanel() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filesById, setFilesById] = useState({});
  const [sending, setSending] = useState(null);
  const [justSent, setJustSent] = useState(null);
  const [tab, setTab] = useState("pending");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await AuthService.apiFetch("/admin/users?role=intern");
      setInterns(data);
    } catch (err) {
      setError(err.message || "Failed to load interns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pending = interns.filter((i) => !i.offerLetterSentAt);
  const sent = interns.filter((i) => i.offerLetterSentAt);
  const visible = tab === "pending" ? pending : sent;

  const handleFile = (internId, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }
    setFilesById((prev) => ({ ...prev, [internId]: file }));
  };

  const send = async (intern) => {
    const file = filesById[intern._id];
    if (!file) return alert("Choose a PDF file first.");

    setSending(intern._id);
    setError("");
    try {
      const pdfBase64 = await fileToBase64(file);
      await AuthService.apiFetch(`/admin/interns/${intern._id}/offer-letter`, {
        method: "POST",
        body: JSON.stringify({ pdfBase64, filename: file.name }),
      });
      setJustSent(intern._id);
      setFilesById((prev) => {
        const next = { ...prev };
        delete next[intern._id];
        return next;
      });
      await load();
      setTimeout(() => setJustSent(null), 4000);
    } catch (err) {
      setError(err.message || "Failed to send offer letter.");
    } finally {
      setSending(null);
    }
  };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>📄 Offer Letters</div>
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
        Upload the finished offer letter PDF for each intern — it's emailed to them directly.
        Nothing is generated automatically; this is just a place to send what you've already prepared.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "pending", label: `Awaiting Offer Letter (${pending.length})` },
          { id: "sent", label: `Sent (${sent.length})` },
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
          {tab === "pending" ? "Everyone has an offer letter." : "No offer letters sent yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((intern) => {
            const file = filesById[intern._id];
            const isSending = sending === intern._id;
            const isJustSent = justSent === intern._id;

            return (
              <div key={intern._id} style={{
                border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{intern.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{intern.email}</div>
                </div>

                <span style={{
                  background: (domainColor[intern.domain] || "#6B7280") + "22",
                  color: domainColor[intern.domain] || "#6B7280",
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>
                  {intern.domain || "—"}{intern.batch ? ` · ${intern.batch}` : ""}
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
                        onChange={(e) => handleFile(intern._id, e.target.files?.[0])}
                        style={{ display: "none" }}
                      />
                    </label>
                    <button
                      onClick={() => send(intern)}
                      disabled={!file || isSending}
                      style={{
                        padding: "7px 14px",
                        background: !file || isSending ? "#9CA3AF" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
                        color: "#fff", border: "none", borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                        cursor: !file || isSending ? "not-allowed" : "pointer", fontFamily: "inherit",
                      }}
                    >
                      {isSending ? "Sending…" : "Email Offer Letter →"}
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#16A34A" }}>
                    ✓ Sent {new Date(intern.offerLetterSentAt).toLocaleDateString()}
                  </span>
                )}

                {isJustSent && (
                  <div style={{ width: "100%", marginTop: 4, fontSize: 11.5, color: "#16A34A" }}>
                    Offer letter emailed to {intern.name}.
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