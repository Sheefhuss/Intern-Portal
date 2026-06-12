import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { DOMAINS } from "../data/database";

export default function LoginPage({ onLoginSuccess }) {
  const [tab, setTab]           = useState("login"); 
  const [mounted, setMounted]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [showPass, setShowPass] = useState(false);

  // Login fields
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // Apply fields
  const [applyName, setApplyName]         = useState("");
  const [applyEmail, setApplyEmail]       = useState("");
  const [applyPassword, setApplyPassword] = useState("");
  const [applyDomain, setApplyDomain]     = useState("");

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await AuthService.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      await AuthService.register({
        name: applyName,
        email: applyEmail,
        password: applyPassword,
        domain: applyDomain,
      });
      setSuccess("Application submitted! HR will review your request. You'll be able to login once approved.");
      setApplyName(""); setApplyEmail(""); setApplyPassword(""); setApplyDomain("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "#F9FAFB",
    border: "1.5px solid #E5E7EB", borderRadius: 10,
    padding: "12px 14px", color: "#111827",
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0D1B2A 0%, #1a1040 60%, #0D1B2A 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden",
    }}>
      {/* Orbs */}
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)", top:"-100px", right:"-100px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", bottom:"-80px", left:"-80px", pointerEvents:"none" }} />

      <div style={{
        background: "#fff", borderRadius: 24, padding: "40px 44px",
        width: 440, boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        position: "relative", zIndex: 2,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52,
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 22, fontWeight: 800,
            color: "#fff", margin: "0 auto 14px",
            boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
          }}>E</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Enginow Intern Portal</div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "#F3F4F6", borderRadius: 10,
          padding: 4, marginBottom: 28, gap: 4,
        }}>
          {[["login", "Sign In"], ["apply", "Apply as Intern"]].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setError(""); setSuccess(""); }}
              style={{
                flex: 1, padding: "9px 0", border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                background: tab === id ? "#fff" : "transparent",
                color: tab === id ? "#7C3AED" : "#6B7280",
                boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >{label}</button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, padding:"10px 14px", color:"#DC2626", fontSize:13, marginBottom:16 }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:10, padding:"10px 14px", color:"#16A34A", fontSize:13, marginBottom:16, lineHeight: 1.5 }}>
            ✅ {success}
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email address</label>
              <input type="email" style={inputStyle} placeholder="name@enginow.in"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 26 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} style={{ ...inputStyle, paddingRight: 44 }}
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <span onClick={() => setShowPass(!showPass)} style={{
                  position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                  cursor:"pointer", fontSize:16, color:"#9CA3AF",
                }}>{showPass ? "🙈" : "👁"}</span>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{
              width:"100%", padding:"13px",
              background: loading ? "#9CA3AF" : "linear-gradient(135deg, #7C3AED, #6D28D9)",
              color:"#fff", border:"none", borderRadius:10,
              fontSize:14, fontWeight:600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily:"inherit", boxShadow:"0 4px 14px rgba(124,58,237,0.35)",
            }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
            <p style={{ textAlign:"center", fontSize:12, color:"#9CA3AF", marginTop:20 }}>
              No account yet?{" "}
              <span onClick={() => setTab("apply")} style={{ color:"#7C3AED", cursor:"pointer", fontWeight:600 }}>
                Apply as Intern
              </span>
            </p>
          </form>
        )}

        {/* APPLY FORM */}
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
              <label style={labelStyle}>Set Password</label>
              <input type="password" style={inputStyle} placeholder="Min. 6 characters"
                value={applyPassword} onChange={e => setApplyPassword(e.target.value)}
                minLength={6} required />
            </div>
            <button type="submit" disabled={loading} style={{
              width:"100%", padding:"13px",
              background: loading ? "#9CA3AF" : "linear-gradient(135deg, #7C3AED, #6D28D9)",
              color:"#fff", border:"none", borderRadius:10,
              fontSize:14, fontWeight:600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily:"inherit", boxShadow:"0 4px 14px rgba(124,58,237,0.35)",
            }}>
              {loading ? "Submitting…" : "Submit Application →"}
            </button>
            <div style={{ marginTop:16, padding:"10px 14px", background:"#F5F3FF", borderRadius:10, border:"1px solid #DDD6FE" }}>
              <div style={{ fontSize:11, color:"#7C3AED", fontWeight:600, marginBottom:3 }}>How it works</div>
              <div style={{ fontSize:11, color:"#6B7280", lineHeight:1.6 }}>
                1. You submit this form<br/>
                2. HR reviews your application<br/>
                3. Admin gives final approval<br/>
                4. You receive login access
              </div>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}