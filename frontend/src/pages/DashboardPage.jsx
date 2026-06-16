import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import { COLORS, S } from "../utils/theme";
import { AuthService } from "../auth/authService"; 

export default function DashboardPage({ session, notifications, onNavigate }) {
  const role = session?.role?.toLowerCase() || "intern";
  const userName = session?.name || "User";

  const [dbStats, setDbStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await AuthService.apiFetch("/dashboard/stats");
        setDbStats(data);
      } catch (error) {
        setDbStats({ 
          count1: 0, count2: 0, count3: "0%", 
          milestones: [], serverHealth: [] 
        }); 
      } finally {
        setIsLoading(false);
      }
    };

    if (role === "admin" || role === "hr") {
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, [role]);

  const internSteps = [
    { icon: "📝", label: "Intern submits application", done: true },
    { icon: "👔", label: "HR reviews & forwards to Admin", done: role !== "intern" }, 
    { icon: "⚙️", label: "Admin approves & assigns batch", done: false },
    { icon: "✅", label: "Intern gains portal access", done: false },
  ];

  const getRoleConfig = () => {
    const val1 = isLoading ? "..." : dbStats?.count1 || 0;
    const val2 = isLoading ? "..." : dbStats?.count2 || 0;
    const val3 = isLoading ? "..." : dbStats?.count3 || 0;

    switch (role) {
      case "admin":
        return {
          title: "System Administrator",
          stats: [
            { label: "Total Users", value: val1, accent: "#10B981" },
            { label: "Active Sessions", value: val2, accent: "#3B82F6" },
            { label: "System Errors", value: val3, accent: "#F59E0B" },
          ]
        };
      case "hr":
        return {
          title: "Human Resources",
          stats: [
            { label: "Total Interns", value: val1, accent: "#7C3AED" },
            { label: "Pending Reviews", value: val2, accent: "#F59E0B" },
            { label: "Onboarding", value: val3 + "%", accent: "#10B981" },
          ]
        };
      default: 
        return {
          title: "Engineering Intern",
          stats: [
            { label: "Your Role", value: role.toUpperCase(), accent: "#7C3AED" },
            { label: "Portal Status", value: "Live", accent: "#10B981" },
            { label: "Session", value: "Active", accent: "#3B82F6" },
          ]
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.4s ease" }}>
      
      <div style={{ ...S.card, background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", padding: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#111827" }}>Welcome back, {userName}!</h2>
        <p style={{ margin: "4px 0 0 0", color: "#6B7280", fontSize: 14 }}>
          Access level: <strong style={{ color: config.stats[0].accent }}>{config.title}</strong>
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {config.stats.map((stat, i) => (
          <div key={i} style={{ flex: "1 1 200px" }}>
            <StatCard label={stat.label} value={stat.value} accent={stat.accent} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        
        {role === "intern" && (
          <>
            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>🚀 Intern Onboarding Flow</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "📝", label: "Intern submits application", done: true },
                  { icon: "👔", label: "HR reviews & forwards to Admin", done: false },
                  { icon: "⚙️", label: "Admin approves & assigns batch", done: false },
                  { icon: "✅", label: "Intern gains portal access", done: false },
                ].map((step, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 16px", borderRadius: 10,
                    background: step.done ? "#F0FDF4" : "#F9FAFB",
                    border: `1px solid ${step.done ? "#86EFAC" : "#E5E7EB"}`,
                  }}>
                    <span style={{ fontSize: 20 }}>{step.icon}</span>
                    <span style={{ fontSize: 13, color: step.done ? "#16A34A" : "#374151", fontWeight: step.done ? 600 : 400 }}>
                      {step.label}
                    </span>
                    {step.done && <span style={{ marginLeft: "auto", color: "#16A34A", fontWeight: 700 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

          <div style={S.card}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>⚡ Quick Access</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "📋", label: "View My Tasks & Deadlines", page: "tasks" },
                { icon: "📢", label: "Announcements & Notifications", page: "announcements" },
              ].map(({ icon, label, page }) => (
                <button key={page} onClick={() => typeof onNavigate === "function" && onNavigate(page)}
                  style={{
                    ...actionButtonStyle,
                    display: "flex", alignItems: "center", gap: 10,
                    borderLeft: "3px solid #7C3AED",
                  }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span>{label}</span>
                </button>
             ))}
          </div>
      </div>
    </>
  )}
        {role === "hr" && (
          <>
            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>👥 HR Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button style={{ ...actionButtonStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Review Pending Interns</span>
                  {dbStats?.count2 > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                      {dbStats.count2} New
                    </span>
                  )}
                </button>
                <button style={actionButtonStyle}>Export Cohort Data (CSV)</button>
                <button style={actionButtonStyle}>Manage Evaluation Forms</button>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>📅 Upcoming Milestones</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#4B5563" }}>
                {(!dbStats?.milestones || dbStats.milestones.length === 0) ? (
                  <div style={{ color: "#9CA3AF" }}>No upcoming milestones scheduled.</div>
                ) : (
                  dbStats.milestones.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: i !== dbStats.milestones.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <span>{m.title}</span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{m.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {role === "admin" && (
          <>
            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>⚙️ System Operations</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button style={actionButtonStyle}>Manage API Keys</button>
                <button style={{ ...actionButtonStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>View Security Logs</span>
                  {dbStats?.count3 > 0 && (
                    <span style={{ background: "#F59E0B", color: "#fff", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                      {dbStats.count3} Alerts
                    </span>
                  )}
                </button>
                <button style={actionButtonStyle}>Update Role Weights</button>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>🖥️ Server Health</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#4B5563" }}>
                {(!dbStats?.serverHealth || dbStats.serverHealth.length === 0) ? (
                  <div style={{ color: "#9CA3AF" }}>No server health data available.</div>
                ) : (
                  dbStats.serverHealth.map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: i !== dbStats.serverHealth.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <span>{s.metric}</span>
                      <span style={{ fontWeight: 600, color: s.status === "Critical" ? "#EF4444" : s.status === "Warning" ? "#F59E0B" : "#10B981" }}>{s.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const actionButtonStyle = {
  padding: "12px 16px",
  background: "#F3F4F6",
  border: `1px solid #E5E7EB`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
  textAlign: "left",
  cursor: "pointer",
};