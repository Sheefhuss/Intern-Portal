export const COLORS = {
  // Core brand
  navy: "#0D1B2A",
  navyCard: "#162436",
  navyLight: "#1E3048",
  purple: "#7C3AED",
  purpleDark: "#5B21B6",
  purpleLight: "#A78BFA",
  purpleBg: "#F5F3FF",

  // Light UI
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surfaceHover: "#F3F4F8",
  border: "#E5E7EF",
  borderLight: "#F0F1F5",

  // Text
  text: "#111827",
  textSub: "#4B5563",
  muted: "#9CA3AF",

  // Status
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
};

export const S = {
  app: {
    display: "flex",
    height: "100vh",
    background: COLORS.bg,
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: COLORS.text,
    overflow: "hidden",
  },

  sidebar: {
    width: 248,
    background: COLORS.navy,
    borderRight: "none",
    display: "flex",
    flexDirection: "column",
    boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
    flexShrink: 0,
  },

  sidebarLogo: {
    padding: "22px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  logoIcon: {
    width: 38,
    height: 38,
    background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 800,
    color: "#fff",
    boxShadow: "0 4px 12px rgba(124,58,237,0.4)",
  },

  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.3px",
  },

  navSection: {
    padding: "20px 20px 6px",
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    fontWeight: 600,
  },

  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    margin: "2px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13.5,
    color: active ? "#fff" : "rgba(255,255,255,0.5)",
    background: active ? "rgba(124,58,237,0.35)" : "transparent",
    borderLeft: active ? "3px solid #A78BFA" : "3px solid transparent",
    transition: "all 0.18s ease",
    fontWeight: active ? 600 : 400,
  }),

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: COLORS.bg,
  },

  topbar: {
    height: 64,
    background: COLORS.surface,
    borderBottom: `1px solid ${COLORS.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },

  content: {
    flex: 1,
    overflow: "auto",
    padding: 28,
    background: COLORS.bg,
  },

  card: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: 22,
    marginBottom: 18,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    transition: "box-shadow 0.2s ease",
  },

  input: {
    width: "100%",
    background: COLORS.bg,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: "11px 14px",
    color: COLORS.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  },

  btn: (variant = "primary") => ({
    padding: "11px 22px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    background:
      variant === "primary"
        ? "linear-gradient(135deg, #7C3AED, #6D28D9)"
        : COLORS.surface,
    color: variant === "primary" ? "#fff" : COLORS.textSub,
    border: variant === "secondary" ? `1px solid ${COLORS.border}` : "none",
    boxShadow:
      variant === "primary"
        ? "0 4px 12px rgba(124,58,237,0.3)"
        : "0 1px 3px rgba(0,0,0,0.06)",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  }),

  loginPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0D1B2A 0%, #162436 50%, #1a1040 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  loginCard: {
    background: "rgba(255,255,255,0.97)",
    borderRadius: 20,
    padding: "44px 40px",
    width: 400,
    boxShadow: "0 25px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    position: "relative",
    zIndex: 2,
  },

  tag: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: color + "18",
    color: color,
    border: `1px solid ${color}30`,
  }),
};