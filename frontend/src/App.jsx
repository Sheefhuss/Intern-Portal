import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InternsPage from "./pages/InternsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import { AuthService } from "./auth/authService";
import { COLORS } from "./utils/theme";
import TasksPage from "./pages/TasksPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";

export default function App() {
  const [session, setSession] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarHover, setSidebarHover] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (session?.role) {
      AuthService.apiFetch("/notifications")
        .then(data => setNotifications(data))
        .catch(err => console.error("Failed to load notifications:", err));
    }
  }, [session]);

  const userNotifs = notifications;
  const unreadNotifs = userNotifs.filter(n => !n.read);
  const readNotifs = userNotifs.filter(n => n.read);

  const markAsRead = async (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await AuthService.apiFetch(`/notifications/${id}/read`, { method: "PUT" });
    } catch (err) {
      console.error("Failed to update read status", err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    try {
      await AuthService.apiFetch("/notifications/read-all", { method: "PUT" });
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const navigateTo = (pageId, role) => {
    if (!session) return;
    if (AuthService.hasAccess(session.role, role)) setCurrentPage(pageId);
    else alert("Access Denied: You don't have permission.");
  };

  if (!session) return <LoginPage onLoginSuccess={(u) => setSession(u)} />;

  const navItems = [
    { id: "dashboard",     icon: "⊞", label: "Dashboard",       role: null,    section: "Workspace" },
    { id: "tasks",         icon: "📋", label: "My Tasks",        role: null,    section: "Workspace" },
    { id: "announcements", icon: "📢", label: "Announcements",   role: null,    section: "Workspace" },
    { id: "interns",       icon: "👥", label: "Intern Registry", role: "hr",    section: "Human Resources" },
    { id: "admin-panel",   icon: "⚙",  label: "Admin Panel",    role: "admin", section: "Administration" },
  ];

  const pageTitle = {
    dashboard:     "Dashboard",
    tasks:         "My Tasks",
    announcements: "Announcements",
    interns:       "Intern Registry",
    "admin-panel": "Admin Panel",
  };

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: "#F8F9FC",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#111827", overflow: "hidden",
    }}>

      <aside style={{
        width: 252,
        background: "linear-gradient(180deg, #0D1B2A 0%, #111827 100%)",
        display: "flex", flexDirection: "column",
        boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
        flexShrink: 0,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-20px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}>

        <div style={{
          padding: "22px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40,
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            borderRadius: 11, display: "flex", alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(124,58,237,0.45)", flexShrink: 0,
            overflow: "hidden",
          }}>
            <img src="/enginow.png" alt="Enginow" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>Enginow</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Intern Portal</div>
          </div>
        </div>

        <div style={{ flex: 1, paddingTop: 12, overflowY: "auto" }}>
          {navItems.map((item, idx) => {
            if (item.role && !AuthService.hasAccess(session.role, item.role)) return null;
            const isActive = currentPage === item.id;
            const isHovered = sidebarHover === item.id;

            return (
              <div key={item.id}>
                {(idx === 0 || navItems[idx - 1]?.section !== item.section) && (
                  <div style={{
                    padding: "18px 20px 6px",
                    fontSize: 10, color: "rgba(255,255,255,0.25)",
                    letterSpacing: "1.2px", textTransform: "uppercase", fontWeight: 600,
                  }}>
                    {item.section}
                  </div>
                )}
                <div
                  onClick={() => item.role ? navigateTo(item.id, item.role) : setCurrentPage(item.id)}
                  onMouseEnter={() => setSidebarHover(item.id)}
                  onMouseLeave={() => setSidebarHover(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px",
                    margin: "2px 10px",
                    borderRadius: 9,
                    cursor: "pointer",
                    fontSize: 13.5,
                    color: isActive ? "#fff" : isHovered ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)",
                    background: isActive ? "rgba(124,58,237,0.3)" : isHovered ? "rgba(255,255,255,0.06)" : "transparent",
                    borderLeft: isActive ? "3px solid #A78BFA" : "3px solid transparent",
                    transition: "all 0.18s ease",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          padding: "14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #7C3AED44, #A78BFA44)",
              border: "1px solid rgba(167,139,250,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#A78BFA",
            }}>
              {session.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{session.name}</div>
              <div style={{ fontSize: 10, color: "#A78BFA", textTransform: "capitalize" }}>{session.role}</div>
            </div>
          </div>
          <button
            onClick={() => setSession(null)}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: "5px 10px",
              color: "rgba(255,255,255,0.5)", fontSize: 11,
              cursor: "pointer", transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{
          height: 64,
          background: "#fff",
          borderBottom: "1px solid #E5E7EF",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.4s ease 0.1s",
          position: "relative",
          zIndex: 50,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px" }}>
              {pageTitle[currentPage] || currentPage}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                style={{
                  background: "transparent", border: "none", fontSize: 20, cursor: "pointer",
                  padding: "6px", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%", transition: "background 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#F3F4F6"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                🔔
                {unreadNotifs.length > 0 && (
                  <span style={{
                    position: "absolute", top: 4, right: 6, width: 8, height: 8,
                    background: "#EF4444", borderRadius: "50%", border: "2px solid #fff",
                  }} />
                )}
              </button>

              {showNotifs && (
                <div style={{
                  position: "absolute", top: "110%", right: 0, width: 320,
                  background: "#fff", borderRadius: 12, border: "1px solid #E5E7EF",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)", overflow: "hidden", zIndex: 100,
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Notifications</span>
                    {unreadNotifs.length > 0 && (
                      <button onClick={markAllAsRead} style={{ fontSize: 11, color: "#7C3AED", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: 350, overflowY: "auto" }}>
                    {userNotifs.length === 0 ? (
                      <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>No notifications yet.</div>
                    ) : (
                      <>
                        {unreadNotifs.length > 0 && (
                          <div style={{ padding: "8px 16px", background: "#F9FAFB", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            New
                          </div>
                        )}
                        {unreadNotifs.map(n => (
                          <div key={n.id} onClick={() => markAsRead(n.id)} style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", cursor: "pointer", background: "#F4F1FF", transition: "background 0.2s" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: "#7C3AED", fontWeight: 700 }}>• Unread</span>
                              <span style={{ fontSize: 10, color: "#9CA3AF" }}>{n.time}</span>
                            </div>
                            <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.4 }}>{n.text}</div>
                          </div>
                        ))}

                        {readNotifs.length > 0 && (
                          <div style={{ padding: "8px 16px", background: "#F9FAFB", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", borderTop: unreadNotifs.length > 0 ? "1px solid #E5E7EF" : "none" }}>
                            History
                          </div>
                        )}
                        {readNotifs.map(n => (
                          <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", opacity: 0.7 }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                              <span style={{ fontSize: 10, color: "#9CA3AF" }}>{n.time}</span>
                            </div>
                            <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.4 }}>{n.text}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: "6px 14px", background: "#F5F3FF",
              border: "1px solid #DDD6FE", borderRadius: 20,
              fontSize: 12, fontWeight: 600, color: "#7C3AED",
            }}>
              🟢 Session Active
            </div>
          </div>
        </div>

        <div style={{
          flex: 1, overflow: "auto", padding: 28,
          background: "#F8F9FC",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.4s ease 0.15s",
        }}>
          {currentPage === "dashboard"     && <DashboardPage session={session} notifications={userNotifs} onNavigate={setCurrentPage} />}
          {currentPage === "tasks"         && <TasksPage session={session} />}
          {currentPage === "announcements" && <AnnouncementsPage session={session} notifications={userNotifs} onMarkRead={markAsRead} onMarkAllRead={markAllAsRead} />}
          {currentPage === "interns"       && AuthService.hasAccess(session.role, "hr")    && <InternsPage />}
          {currentPage === "admin-panel"   && AuthService.hasAccess(session.role, "admin") && <AdminPanelPage />}
        </div>
      </main>
    </div>
  );
}