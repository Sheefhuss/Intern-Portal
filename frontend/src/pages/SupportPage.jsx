import React, { useState } from "react";
import { S } from "../utils/theme";

export default function SupportPage({ session }) {
  const [formData, setFormData] = useState({ subject: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = `mailto:intern@enginow.in?subject=${formData.subject}&body=${formData.message}`;
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", ...S.card, padding: 32 }}>
      <h2>Contact Support</h2>
      <p style={{ color: "#6B7280" }}>Need help? Reach out to us directly.</p>
      
      <div style={{ margin: "20px 0", padding: 16, background: "#F5F3FF", borderRadius: 8 }}>
        <strong>Email:</strong> <a href="mailto:intern@enginow.in" style={{ color: "#7C3AED" }}>intern@enginow.in</a>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input placeholder="Subject" onChange={e => setFormData({...formData, subject: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid #D1D5DB" }} />
        <textarea placeholder="How can we help?" rows={5} onChange={e => setFormData({...formData, message: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid #D1D5DB" }} />
        <button type="submit" style={{ background: "#7C3AED", color: "#fff", padding: 12, borderRadius: 8, border: "none" }}>
          Send Support Email
        </button>
      </form>
    </div>
  );
}