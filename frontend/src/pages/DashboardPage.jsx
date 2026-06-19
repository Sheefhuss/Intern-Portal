import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import { COLORS, S } from "../utils/theme";
import { AuthService } from "../auth/authService";

const actionButtonStyle = {
  padding: "12px 16px",
  background: "#F3F4F6",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "inherit",
  width: "100%",
};

export default function DashboardPage({ session, onNavigate }) {
  const role = session?.role?.toLowerCase() || "intern";
  const userName = session?.name || "User";

  const [dbStats, setDbStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AuthService.apiFetch("/dashboard/stats")
      .then(data => setDbStats(data))
      .catch(() => setDbStats({ count1: 0, count2: 0, count3: 0, milestones: [], serverHealth: [] }))
      .finally(() => setIsLoading(false));
  }, [role]);

  const nav = (page) => typeof onNavigate === "function" && onNavigate(page);

  const val = (key, suffix = "") => {
    if (isLoading) return "…";
    const v = dbStats?.[key] ?? 0;
    return suffix ? `${v}${suffix}` : v;
  };

  const getRoleConfig = () => {
    switch (role) {
      case "admin": return {
        title: "System Administrator",
        accentColor: "#10B981",
        stats: [
          { label: "Total Users", value: val("count1"), accent: "#10B981" },
          { label: "Active Interns", value: val("count2"), accent: "#3B82F6" },
          { label: "Unread Alerts", value: val("count3"), accent: "#F59E0B" },
        ],
      };
      case "hr": return {
        title: "Human Resources",
        accentColor: "#7C3AED",
        stats: [
          { label: "Total Interns", value: val("count1"), accent: "#7C3AED" },
          { label: "Pending Reviews", value: val("count2"), accent: "#F59E0B" },
          { label: "Onboarding", value: val("count3", "%"), accent: "#10B981" },
        ],
      };
      default: return {
        title: "Intern",
        accentColor: "#7C3AED",
        stats: [
          { label: "Task Progress", value: val("count1", "%"), accent: "#7C3AED" },
          { label: "Pending Tasks", value: val("count2"), accent: "#10B981" },
          { label: "Unread Alerts", value: val("count3"), accent: "#F59E0B" },
        ],
      };
    }
  };

  const config = getRoleConfig();
  const pendingApprovalsCount = dbStats?.serverHealth?.find(s => s.metric === "Pending Approvals")?.value || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.4s ease" }}>

      <div style={{ ...S.card, background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", padding: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#111827" }}>Welcome back, {userName}!</h2>
        <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>
          Access level: <strong style={{ color: config.accentColor }}>{config.title}</strong>
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
          <div style={S.card}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>🎯 Current Priorities</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => nav("tasks")} style={{
                ...actionButtonStyle,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderLeft: "3px solid #10B981",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span>View Pending Tasks</span>
                </div>
                {dbStats?.count2 > 0 && (
                  <span style={{
                    background: "#10B981", color: "#fff",
                    padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                  }}>
                    {dbStats.count2} Action Needed
                  </span>
                )}
              </button>
              
              <button onClick={() => nav("announcements")} style={{
                ...actionButtonStyle,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderLeft: "3px solid #F59E0B",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📢</span>
                  <span>Check Announcements</span>
                </div>
                {dbStats?.count3 > 0 && (
                  <span style={{
                    background: "#F59E0B", color: "#fff",
                    padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                  }}>
                    {dbStats.count3} Unread
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {role === "hr" && (
          <>
            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>👥 HR Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => nav("interns")}
                  style={{ ...actionButtonStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span>Review Pending Interns</span>
                  {dbStats?.count2 > 0 && (
                    <span style={{
                      background: "#EF4444", color: "#fff",
                      padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                    }}>
                      {dbStats.count2} New
                    </span>
                  )}
                </button>
                <button onClick={() => nav("tasks")} style={actionButtonStyle}>Assign Tasks to Interns</button>
                <button onClick={() => nav("interns")} style={actionButtonStyle}>View Active Intern Registry</button>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>📅 Upcoming Milestones</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#4B5563" }}>
                {!dbStats?.milestones?.length ? (
                  <div style={{ color: "#9CA3AF" }}>No upcoming milestones scheduled.</div>
                ) : (
                  dbStats.milestones.map((m, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      paddingBottom: 8,
                      borderBottom: i !== dbStats.milestones.length - 1 ? "1px solid #F3F4F6" : "none",
                    }}>
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
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>⚙️ Admin Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => nav("interns")}
                  style={{ ...actionButtonStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span>Review HR-Forwarded Applications</span>
                  {pendingApprovalsCount > 0 && (
                    <span style={{
                      background: "#EF4444", color: "#fff",
                      padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                    }}>
                      {pendingApprovalsCount} Pending
                    </span>
                  )}
                </button>
                <button onClick={() => nav("tasks")} style={actionButtonStyle}>Manage Tasks</button>
                <button onClick={() => nav("interns")} style={actionButtonStyle}>View All Interns</button>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>🖥️ Server Health</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#4B5563" }}>
                {!dbStats?.serverHealth?.length ? (
                  <div style={{ color: "#9CA3AF" }}>No server health data available.</div>
                ) : (
                  dbStats.serverHealth.map((s, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      paddingBottom: 8,
                      borderBottom: i !== dbStats.serverHealth.length - 1 ? "1px solid #F3F4F6" : "none",
                    }}>
                      <span>{s.metric}</span>
                      <span style={{
                        fontWeight: 600,
                        color: s.status === "Critical" ? "#EF4444"
                             : s.status === "Warning"  ? "#F59E0B"
                             : "#10B981",
                      }}>
                        {s.value}
                      </span>
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