import React, { useState, useEffect } from "react";
import { S, COLORS } from "../utils/theme";

export default function InternsPage() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/internships");
        if (!response.ok) throw new Error("Failed to fetch internship cluster.");
        const data = await response.json();
        setInternships(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  if (loading) return <div style={{ color: COLORS.text }}>Loading cluster data...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={S.card}>
      <h3 style={{ marginBottom: 16, color: COLORS.text }}>👥 Active Intern Registry</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.border}`, color: COLORS.muted, textAlign: "left" }}>
            <th style={{ padding: 12 }}>Position / Title</th>
            <th style={{ padding: 12 }}>Domain</th>
            <th style={{ padding: 12 }}>Company</th>
            <th style={{ padding: 12 }}>Contact Email</th>
          </tr>
        </thead>
        <tbody>
          {internships.map((internship) => (
            <tr key={internship._id} style={{ borderBottom: `1px solid ${COLORS.border}`, color: COLORS.text }}>
              <td style={{ padding: 12, fontWeight: 500 }}>{internship.title || "Untitled Position"}</td>
              <td style={{ padding: 12 }}><span style={{ backgroundColor: COLORS.border, padding: "4px 8px", borderRadius: 4, fontSize: 11 }}>{internship.domain || "General"}</span></td>
              <td style={{ padding: 12 }}>{internship.company?.name || "N/A"}</td>
              <td style={{ padding: 12, color: COLORS.muted }}>{internship.company?.email || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}