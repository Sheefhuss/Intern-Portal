import React, { useState } from "react";
import { AuthService } from "../auth/authService";
import { S, COLORS } from "../utils/theme";

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    AuthService.login(email, password)
      .then((user) => {
        setLoading(false);
        onLoginSuccess(user);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  };

  return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Enginow Portal</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>Sign in to access your operational space</div>
        </div>

        {error && <div style={{ color: COLORS.danger, fontSize: 12, marginBottom: 12, textAlign: "center" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Corporate Email</label>
            <input type="email" style={S.input} placeholder="name@enginow.in" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Password</label>
            <input type="password" style={S.input} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" style={{ ...S.btn("primary"), width: "100%" }} disabled={loading}>
            {loading ? "Authenticating Token..." : "Sign In Securely"}
          </button>
        </form>
      </div>
    </div>
  );
}