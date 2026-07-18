import React, { useState } from "react";
import { COLORS, S } from "../../utils/theme";
import { domainColor } from "../../utils/adminConstants";
import { DOMAINS } from "../../data/database";

export default function InviteIntern({ invited, batches, inviting, invite, resending, resendPasscode }) {
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [domain, setDomain] = useState("");
  const [batch, setBatch]   = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("passcode_email");
  const [lastPasscode, setLastPasscode] = useState(null);

  const batchOptions = batches.filter(b => b.domain === domain);

  const deliveryOptions = [
    { id: "passcode_email",     label: "Email the passcode directly",        hint: "A short email with just the one-time passcode." },
    { id: "offer_letter_email", label: "Email an offer letter",              hint: "A formal offer letter email with the passcode embedded inside it." },
    { id: "manual",             label: "Don't send an email",                hint: "You'll share the offer letter and passcode yourself, outside the portal." },
  ];

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !domain) return alert("Name, email, and domain are required.");
    const result = await invite({ name: name.trim(), email: email.trim(), domain, batch, deliveryMethod });
    if (result) {
      setLastPasscode({ email: email.trim(), passcode: result.passcode, emailSent: result.emailSent, deliveryMethod: result.deliveryMethod });
      setName(""); setEmail(""); setDomain(""); setBatch(""); setDeliveryMethod("passcode_email");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>✉️ Invite an Intern</div>
        <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 18 }}>
          Add their email, domain, and batch here — no HR review, no Admin approval step.
          We'll email them a one-time passcode; they use it under "Create Account" to set
          their own password and activate access.
        </p>

        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Intern's full name"
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="intern@example.com"
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Domain</label>
            <select value={domain} onChange={e => { setDomain(e.target.value); setBatch(""); }}
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
              <option value="">Select domain…</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Batch (optional)</label>
            <select value={batch} onChange={e => setBatch(e.target.value)} disabled={!domain}
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: domain ? "pointer" : "not-allowed", boxSizing: "border-box" }}>
              <option value="">No batch yet</option>
              {batchOptions.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              How should the passcode reach them?
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {deliveryOptions.map(opt => (
                <label key={opt.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                  border: `1.5px solid ${deliveryMethod === opt.id ? "#7C3AED" : "#E5E7EB"}`,
                  borderRadius: 8, cursor: "pointer",
                  background: deliveryMethod === opt.id ? "#F5F3FF" : "#fff",
                }}>
                  <input type="radio" name="deliveryMethod" value={opt.id}
                    checked={deliveryMethod === opt.id}
                    onChange={() => setDeliveryMethod(opt.id)}
                    style={{ marginTop: 3 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{opt.label}</div>
                    <div style={{ fontSize: 11.5, color: "#6B7280" }}>{opt.hint}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" disabled={inviting} style={{
              padding: "10px 22px", background: inviting ? "#9CA3AF" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
              color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: inviting ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}>
              {inviting ? "Sending invite…" : "Send Invite →"}
            </button>
          </div>
        </form>

        {lastPasscode && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, fontSize: 12, color: "#16A34A" }}>
            Invited <strong>{lastPasscode.email}</strong>.{" "}
            {lastPasscode.deliveryMethod === "manual" ? (
              <>No email was sent — share this passcode with them yourself:{" "}</>
            ) : lastPasscode.emailSent ? (
              <>{lastPasscode.deliveryMethod === "offer_letter_email" ? "Offer letter" : "Passcode"} emailed to them — it's also shown here in case the email doesn't arrive:{" "}</>
            ) : (
              <>The email failed to send — share this passcode with them yourself:{" "}</>
            )}
            <strong style={{ letterSpacing: 2 }}>{lastPasscode.passcode}</strong>
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>⏳ Awaiting Activation ({invited.length})</div>
        <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>
          Invited but haven't created their account yet.
        </p>

        {invited.length === 0 ? (
          <div style={{ textAlign: "center", color: COLORS.muted, padding: "24px 0", fontSize: 13 }}>
            Nobody is waiting on activation right now.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invited.map(u => (
              <div key={u._id} style={{
                border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{u.email}</div>
                </div>
                <span style={{
                  background: (domainColor[u.domain] || "#6B7280") + "22",
                  color: domainColor[u.domain] || "#6B7280",
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>
                  {u.domain}{u.batch ? ` · ${u.batch}` : ""}
                </span>
                <button
                  onClick={() => resendPasscode(u._id)}
                  disabled={resending === u._id}
                  style={{
                    background: "#fff", color: "#7C3AED", border: "1px solid #DDD6FE",
                    borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 600,
                    cursor: resending === u._id ? "not-allowed" : "pointer", fontFamily: "inherit",
                  }}
                >
                  {resending === u._id ? "Resending…" : "Resend Passcode"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}