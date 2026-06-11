import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InternsPage from "./pages/InternsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import { AuthService } from "./auth/authService";
import { S, COLORS } from "./utils/theme";

export default function App() {
  const [session, setSession] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const navigateTo = (pageId, authorizationRoleRequirement) => {
    if (!session) return;
    if (AuthService.hasAccess(session.role, authorizationRoleRequirement)) {
      setCurrentPage(pageId);
    } else {
      alert("Access Denied: Resource isolated.");
    }
  };

  if (!session) {
    return <LoginPage onLoginSuccess={(userData) => setSession(userData)} />;
  }

  return (
    <div style={S.app}>
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={S.logoIcon}>E</div>
          <div>
            <div style={S.logoText}>Enginow</div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>Enterprise Terminal</div>
          </div>
        </div>

        <div style={{ flex: 1, paddingTop: 12 }}>
          <div style={S.navSection}>Default Scope</div>
          <div style={S.navItem(currentPage === "dashboard")} onClick={() => setCurrentPage("dashboard")}>
            🏠 Dashboard
          </div>

          {AuthService.hasAccess(session.role, "hr") && (
            <>
              <div style={S.navSection}>Human Resources</div>
              <div style={S.navItem(currentPage === "interns")} onClick={() => navigateTo("interns", "hr")}>
                👥 Intern Registry
              </div>
            </>
          )}

          {AuthService.hasAccess(session.role, "admin") && (
            <>
              <div style={S.navSection}>Superuser Gate</div>
              <div style={S.navItem(currentPage === "admin-panel")} onClick={() => navigateTo("admin-panel", "admin")}>
                ⚙️ Root Configuration
              </div>
            </>
          )}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{session.name}</div>
            <div style={{ fontSize: 11, color: COLORS.purpleLight, textTransform: "capitalize" }}>Role: {session.role}</div>
          </div>
          <button style={{ ...S.btn("secondary"), padding: "4px 8px", fontSize: 11 }} onClick={() => setSession(null)}>
            Exit
          </button>
        </div>
      </aside>

      <main style={S.main}>
        <div style={S.topbar}>
          <div style={{ fontSize: 16, fontWeight: 600, textTransform: "capitalize" }}>
            Workspace Cluster / {currentPage.replace("-", " ")}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>Session Verified Secure</div>
        </div>

        <div style={S.content}>
          {currentPage === "dashboard" && <DashboardPage />}
          {currentPage === "interns" && AuthService.hasAccess(session.role, "hr") && <InternsPage />}
          {currentPage === "admin-panel" && AuthService.hasAccess(session.role, "admin") && <AdminPanelPage />}
        </div>
      </main>
    </div>
  );
}