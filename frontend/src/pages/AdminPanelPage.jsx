import React, { useState } from "react";
import { SEEDED_USERS } from "../data/database";
import { S, COLORS } from "../utils/theme";

export default function AdminPanelPage() {
  const [users, setUsers] = useState(SEEDED_USERS);
  
  const promoteToHR = (email) => {
    setUsers(users.map(u => u.email === email ? { ...u, role: "hr" } : u));
    const item = SEEDED_USERS.find(u => u.email === email);
    if(item) item.role = "hr";
  };

  return (
    <div style={S.card}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>⚙️ System Admin Workspace</div>
      <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Elevated scope permissions allowed.</p>
      
      <table style={{ width: "100%", fontSize: 13 }}>
        <thead>
          <tr style={{ color: COLORS.muted, textAlign: "left" }}>
            <th>User Identity</th>
            <th>Email Vector</th>
            <th>Role Assignment</th>
            <th>Privilege Mutation</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => (
            <tr key={index} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <td style={{ padding: "12px 0" }}>{u.name}</td>
              <td>{u.email}</td>
              <td><span style={S.tag(u.role === "admin" ? COLORS.danger : u.role === "hr" ? COLORS.warning : COLORS.purple)}>{u.role.toUpperCase()}</span></td>
              <td>
                {u.role === "member" ? (
                  <button style={{ ...S.btn("secondary"), padding: "4px 8px", fontSize: 11 }} onClick={() => promoteToHR(u.email)}>
                    Promote to HR
                  </button>
                ) : <span style={{ fontSize: 11, color: COLORS.muted }}>Max Privileges Handled</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}