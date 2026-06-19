import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { DOMAINS } from "../data/database";

const checkStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{}|;':",.<>?]/.test(pw)) score++;
  return score;
};

const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "#EF4444", "#F59E0B", "#3B82F6", "#10B981"];

export default function LoginPage({ onLoginSuccess }) {
  const [tab, setTab] = useState("login");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending] = useState(false);

  const [applyName, setApplyName] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyPassword, setApplyPassword] = useState("");
  const [applyDomain, setApplyDomain] = useState("");
  const [pwStrength, setPwStrength] = useState(0);

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPwStrength, setNewPwStrength] = useState(0);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);

    if (params.get("verified") === "true") {
      setSuccess("✅ Email verified! You can now log in.");
      window.history.replaceState({}, "", "/");
    }

    if (window.location.pathname === "/reset-password") {
      const token = params.get("token");
      if (token) {
        setResetToken(token);
        setTab("resetPassword");
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setUnverifiedEmail(null); setLoading(true);
    try {
      const user = await AuthService.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") setUnverifiedEmail(err.email);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await AuthService.resendVerification(unverifiedEmail);
      setError("");
      setSuccess("Verification email resent! Check your inbox.");
      setUnverifiedEmail(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      await AuthService.register({
        name: applyName, email: applyEmail,
        password: applyPassword, domain: applyDomain,
      });
      setSuccess("Application submitted! Check your email to verify your address.");
      setApplyName(""); setApplyEmail(""); setApplyPassword(""); setApplyDomain(""); setPwStrength(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await AuthService.forgotPassword(forgotEmail);
      setSuccess("If that email is registered, a reset link has been sent.");
      setForgotEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await AuthService.resetPassword(resetToken, newPassword);
      setSuccess("✅ Password reset! You can now sign in.");
      setTab("login");
      window.history.replaceState({}, "", "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "#F9FAFB", border: "1.5px solid #E5E7EB",
    borderRadius: 10, padding: "12px 14px", color: "#111827",
    fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 };
  const btnStyle = (disabled) => ({
    width: "100%", padding: "13px", border: "none", borderRadius: 10,
    fontSize: 14, fontWeight: 600, fontFamily: "inherit",
    background: disabled ? "#9CA3AF" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
    color: "#fff", cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0D1B2A 0%,#1a1040 60%,#0D1B2A 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter',sans-serif", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)", top: "-100px", right: "-100px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)", bottom: "-80px", left: "-80px", pointerEvents: "none" }} />

      <div style={{
        background: "#fff", borderRadius: 24, padding: "40px 44px", width: 460,
        boxShadow: "0 32px 80px rgba(0,0,0,0.4)", position: "relative", zIndex: 2,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        maxHeight: "90vh", overflowY: "auto",
      }}>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#7C3AED,#A78BFA)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 auto 12px", boxShadow: "0 8px 24px rgba(124,58,237,0.35)" }}>E</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Enginow Intern Portal</div>
        </div>

        {tab !== "resetPassword" && (
          <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
            {[["login", "Sign In"], ["apply", "Apply"], ["forgot", "Reset Password"]].map(([id, label]) => (
              <button key={id} onClick={() => { setTab(id); setError(""); setSuccess(""); setUnverifiedEmail(null); }}
                style={{
                  flex: 1, padding: "8px 0", border: "none", borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  background: tab === id ? "#fff" : "transparent",
                  color: tab === id ? "#7C3AED" : "#6B7280",
                  boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s",
                }}
              >{label}</button>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
            ⚠ {error}
            {unverifiedEmail && (
              <button onClick={handleResend} disabled={resending} style={{
                display: "block", marginTop: 8, background: "#DC2626", color: "#fff",
                border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12,
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                {resending ? "Resending…" : "Resend Verification Email"}
              </button>
            )}
          </div>
        )}
        {success && (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "10px 14px", color: "#16A34A", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            {success}
          </div>
        )}

        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email address</label>
              <input type="email" style={inputStyle} placeholder="name@enginow.in"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <span onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 16, color: "#9CA3AF" }}>
                  {showPass ? "🙈" : "👁"}
                </span>
              </div>
            </div>
            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
              No account?{" "}
              <span onClick={() => setTab("apply")} style={{ color: "#7C3AED", cursor: "pointer", fontWeight: 600 }}>Apply as Intern</span>
              {"  ·  "}
              <span onClick={() => setTab("forgot")} style={{ color: "#7C3AED", cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
            </p>
          </form>
        )}

        {tab === "apply" && (
          <form onSubmit={handleApply}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" style={inputStyle} placeholder="Your full name"
                value={applyName} onChange={e => setApplyName(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" style={inputStyle} placeholder="your@email.com"
                value={applyEmail} onChange={e => setApplyEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Domain / Interest</label>
              <select style={{ ...inputStyle, cursor: "pointer" }}
                value={applyDomain} onChange={e => setApplyDomain(e.target.value)} required>
                <option value="">Select your domain…</option>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" style={inputStyle} placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
                value={applyPassword}
                onChange={e => { setApplyPassword(e.target.value); setPwStrength(checkStrength(e.target.value)); }}
                minLength={8} required />
              {applyPassword && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 4,
                        background: i <= pwStrength ? strengthColor[pwStrength] : "#E5E7EB",
                        transition: "background 0.3s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor[pwStrength], fontWeight: 600 }}>
                    {strengthLabel[pwStrength]}
                  </div>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading || pwStrength < 4} style={btnStyle(loading || pwStrength < 4)}>
              {loading ? "Submitting…" : "Submit Application →"}
            </button>
            {pwStrength > 0 && pwStrength < 4 && (
              <p style={{ fontSize: 11, color: "#F59E0B", textAlign: "center", marginTop: 8 }}>
                Password needs uppercase, number, and special character
              </p>
            )}
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#F5F3FF", borderRadius: 10, border: "1px solid #DDD6FE" }}>
              <div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600, marginBottom: 3 }}>How it works</div>
              <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.7 }}>
                1. Submit this form<br />
                2. Verify your email (check inbox)<br />
                3. HR reviews your application<br />
                4. Admin approves → you get access
              </div>
            </div>
          </form>
        )}

        {tab === "resetPassword" && (
          <form onSubmit={handleResetPassword}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
              Set New Password
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              Enter your new password below.
            </p>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>New Password</label>
              <input
                type="password" style={inputStyle}
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setNewPwStrength(checkStrength(e.target.value)); }}
                required
              />
              {newPassword && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 4,
                        background: i <= newPwStrength ? strengthColor[newPwStrength] : "#E5E7EB",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor[newPwStrength], fontWeight: 600 }}>
                    {strengthLabel[newPwStrength]}
                  </div>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading || newPwStrength < 4} style={btnStyle(loading || newPwStrength < 4)}>
              {loading ? "Resetting…" : "Reset Password →"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
              <span onClick={() => { setTab("login"); window.history.replaceState({}, "", "/"); }} style={{ color: "#7C3AED", cursor: "pointer", fontWeight: 600 }}>
                ← Back to Sign In
              </span>
            </p>
          </form>
        )}

        {tab === "forgot" && (
          <form onSubmit={handleForgot}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.6 }}>
              Enter your registered email and we'll send you a password reset link.
            </p>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" style={inputStyle} placeholder="your@email.com"
                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading ? "Sending…" : "Send Reset Link →"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
              <span onClick={() => setTab("login")} style={{ color: "#7C3AED", cursor: "pointer", fontWeight: 600 }}>
                ← Back to Sign In
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}