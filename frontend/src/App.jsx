import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InternsPage from "./pages/InternsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import { AuthService } from "./auth/authService";
import { COLORS } from "./utils/theme";
import TasksPage from "./pages/TasksPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import MeetingsPage from "./pages/MeetingsPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SupportPage from "./pages/SupportPage";

const NOTIF_POLL_MS = 20000;

export default function App() {
  const [session, setSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const currentPageRef = useRef(currentPage);

  const [sidebarHover, setSidebarHover] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifTab, setNotifTab] = useState("all");
  const notifRef = useRef(null);

  const [globalSocket, setGlobalSocket] = useState(null);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);

  let currentUserId = session?.id || session?._id;
  if (!currentUserId && session) {
    try {
      const token = localStorage.getItem("token");
      if (token) currentUserId = JSON.parse(atob(token.split('.')[1])).id;
    } catch(e) {}
  }

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;
    AuthService.getCurrentUser().then((user) => {
      if (!cancelled) {
        setSession(user);
        setSessionChecked(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!session?.role) return;

    const fetchNotifs = () => {
      AuthService.apiFetch("/notifications")
        .then(data => setNotifications(data))
        .catch(() => {});
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, NOTIF_POLL_MS);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!currentUserId) return;

    AuthService.apiFetch("/messages/unread-count")
      .then(data => {
        if (data.count > 0) setHasUnreadMessage(true);
      })
      .catch(() => {});

    const socketInstance = io(AuthService.getApiBase().replace("/api", ""));
    setGlobalSocket(socketInstance);
    socketInstance.emit("join_chat", currentUserId);

    const handleReceive = () => {
      if (currentPageRef.current !== "chat") {
        setHasUnreadMessage(true);
      }
    };

    socketInstance.on("receive_message", handleReceive);

    return () => {
      socketInstance.off("receive_message", handleReceive);
      socketInstance.disconnect();
    };
  }, [currentUserId]);

  const unreadNotifs = notifications.filter(n => !n.read);
  const readNotifs = notifications.filter(n => n.read);
  const totalUnread = unreadNotifs.length;

  const visibleUnread = notifTab === "certificates"
    ? unreadNotifs.filter(n => n.type === "certificate")
    : unreadNotifs;
  const visibleRead = notifTab === "certificates"
    ? readNotifs.filter(n => n.type === "certificate")
    : readNotifs;

  const markAsRead = async (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await AuthService.apiFetch(`/notifications/${id}/read`, { method: "PUT" });
    } catch {}
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    try {
      await AuthService.apiFetch("/notifications/read-all", { method: "PUT" });
    } catch {}
  };

  const navigateTo = (pageId, role) => {
    if (!session) return;
    if (AuthService.hasAccess(session.role, role)) setCurrentPage(pageId);
    else alert("Access Denied: You don't have permission.");
  };

  const navigateToChat = () => {
    setHasUnreadMessage(false);
    setCurrentPage("chat");
  };

  const handleLogout = () => {
    AuthService.logout();
    if (globalSocket) globalSocket.disconnect();
    setSession(null);
  };

  if (!sessionChecked) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#F8F9FC", fontFamily: "'Inter', -apple-system, sans-serif", color: "#9CA3AF",
        fontSize: 13,
      }}>
        Loading…
      </div>
    );
  }

  if (!session) return <LoginPage onLoginSuccess={(u) => setSession(u)} />;

  const navItems = [
    { id: "dashboard", icon: "⊞", label: "Dashboard", role: null, section: "Workspace" },
    { id: "tasks", icon: "📋", label: "Task Management", role: null, section: "Workspace" },
    { id: "announcements", icon: "📢", label: "Announcements", role: null, section: "Workspace" },
    { id: "meetings", icon: "📅", label: "Meetings", role: null, section: "Workspace" },
    { id: "profile", icon: "👤", label: "My Profile", role: null, section: "Settings" },
    { id: "interns", icon: "👥", label: "Intern Registry", role: "hr", section: "Human Resources" },
    { id: "admin-panel", icon: "⚙", label: "Admin Panel", role: "admin", section: "Administration" },
    { id: "support", icon: "🎧", label: "Contact Support", role: null, section: "Help" },
  ];

  const pageTitle = {
    dashboard: "Dashboard",
    tasks: "Tasks",
    announcements: "Announcements",
    meetings: "Meetings",
    interns: "Intern Registry",
    "admin-panel": "Admin Panel",
    chat: "Messages"
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
                    padding: "10px 14px", margin: "2px 10px", borderRadius: 9,
                    cursor: "pointer", fontSize: 13.5,
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
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: "5px 10px", color: "rgba(255,255,255,0.5)",
              fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          height: 64, background: "#fff", borderBottom: "1px solid #E5E7EF",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease 0.1s",
          position: "relative", zIndex: 50,
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
            <button
              onClick={navigateToChat}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%", transition: "all 0.2s", position: "relative",
                color: currentPage === "chat" ? "#7C3AED" : "#6B7280"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#F3F4F6"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
              title="Messages"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              {hasUnreadMessage && (
                <span style={{
                  position: "absolute", top: 4, right: 6, width: 8, height: 8,
                  background: "#EF4444", borderRadius: "50%", border: "2px solid #fff",
                }} />
              )}
            </button>

            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  padding: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%", transition: "all 0.2s", position: "relative",
                  color: showNotifs ? "#7C3AED" : "#6B7280"
                }}
                onMouseOver={e => e.currentTarget.style.background = "#F3F4F6"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {totalUnread > 0 && (
                  <span style={{
                    position: "absolute", top: 4, right: 8, width: 8, height: 8,
                    background: "#EF4444", borderRadius: "50%", border: "2px solid #fff",
                  }} />
                )}
              </button>

              {showNotifs && (
                <div style={{
                  position: "absolute", top: "110%", right: 0, width: 340,
                  background: "#fff", borderRadius: 12, border: "1px solid #E5E7EF",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)", overflow: "hidden", zIndex: 100,
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Notifications</span>
                      {totalUnread > 0 && (
                        <button onClick={markAllAsRead} style={{ fontSize: 11, color: "#7C3AED", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[
                        { id: "all", label: "All" },
                        { id: "certificates", label: "🎓 Certificates" },
                      ].map(t => (
                        <button key={t.id} onClick={() => setNotifTab(t.id)} style={{
                          padding: "5px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                          border: "1px solid " + (notifTab === t.id ? "#7C3AED" : "#E5E7EB"),
                          background: notifTab === t.id ? "#F5F3FF" : "#fff",
                          color: notifTab === t.id ? "#7C3AED" : "#6B7280",
                          cursor: "pointer", fontFamily: "inherit",
                        }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    {visibleUnread.length === 0 && visibleRead.length === 0 ? (
                      <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>
                        {notifTab === "certificates" ? "No certificates yet." : "No notifications yet."}
                      </div>
                    ) : (
                      <>
                        {visibleUnread.length > 0 && (
                          <div style={{ padding: "8px 16px", background: "#F9FAFB", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            New
                          </div>
                        )}

                        {visibleUnread.map(n => {
                          if (n.type === "certificate") {
                            return (
                              <div key={n.id} style={{
                                padding: "14px 16px", borderBottom: "1px solid #F3F4F6",
                                background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
                                borderLeft: "3px solid #7C3AED",
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 16 }}>🎓</span>
                                    <span style={{ fontSize: 11, color: "#7C3AED", fontWeight: 700 }}>Certificate Issued</span>
                                  </div>
                                  <span style={{ fontSize: 10, color: "#9CA3AF", flexShrink: 0 }}>{n.time}</span>
                                </div>
                                <div style={{ fontSize: 13, color: "#1F1235", lineHeight: 1.5, marginBottom: 10 }}>{n.text}</div>
                                <div style={{ fontSize: 11.5, color: "#6D28D9", marginBottom: 10 }}>📧 Sent to your registered email</div>
                                <button
                                  onClick={() => markAsRead(n.id)}
                                  style={{
                                    padding: "6px 14px", background: "#7C3AED", color: "#fff",
                                    border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                    cursor: "pointer", fontFamily: "inherit",
                                  }}
                                >
                                  Got it
                                </button>
                              </div>
                            );
                          }
                          return (
                            <div key={n.id} onClick={() => markAsRead(n.id)} style={{
                              padding: "12px 16px", borderBottom: "1px solid #F3F4F6",
                              cursor: "pointer", background: "#F4F1FF",
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: "#7C3AED", fontWeight: 700 }}>• Unread</span>
                                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{n.time}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.4 }}>{n.text}</div>
                            </div>
                          );
                        })}

                        {visibleRead.length > 0 && (
                          <div style={{ padding: "8px 16px", background: "#F9FAFB", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", borderTop: "1px solid #E5E7EF" }}>
                            History
                          </div>
                        )}
                        {visibleRead.map(n => (
                          <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", opacity: 0.65 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                              {n.type === "certificate" && <span style={{ fontSize: 12 }}>🎓</span>}
                              <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: "auto" }}>{n.time}</span>
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
          flex: 1, overflow: "auto", padding: 28, background: "#F8F9FC",
          opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease 0.15s",
        }}>
          {currentPage === "dashboard" && <DashboardPage session={session} onNavigate={setCurrentPage} />}
          {currentPage === "tasks" && <TasksPage session={session} />}
          {currentPage === "announcements" && <AnnouncementsPage session={session} notifications={notifications} onMarkRead={markAsRead} onMarkAllRead={markAllAsRead} />}
          {currentPage === "meetings" && <MeetingsPage session={session} />}
          {currentPage === "interns" && AuthService.hasAccess(session.role, "hr") && <InternsPage session={session} />}
          {currentPage === "admin-panel" && AuthService.hasAccess(session.role, "admin") && <AdminPanelPage />}
          {currentPage === "profile" && <ProfilePage session={session} />}
          {currentPage === "chat" && <ChatPage currentUserId={currentUserId} socket={globalSocket} />}
          {currentPage === "support" && <SupportPage session={session} />}
        </div>
      </main>
    </div>
  );
}