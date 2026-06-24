import { COLORS } from "../../utils/theme";

export const statusColors = {
  open:     { bg: "#D1FAE5", text: "#059669", label: "Open" },
  booked:   { bg: "#DBEAFE", text: "#2563EB", label: "Booked" },
  pending:  { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  approved: { bg: "#D1FAE5", text: "#059669", label: "Approved" },
  rejected: { bg: "#FEE2E2", text: "#DC2626", label: "Rejected" },
};

export const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 4,
  display: "block",
};

export const btnPrimary = {
  padding: "9px 20px",
  background: COLORS.purple,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const btnGhost = {
  padding: "9px 16px",
  background: "#F3F4F6",
  color: "#374151",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const emptySlotForm = {
  title: "", meetLink: "", scheduledAt: "", duration: 30,
  scope: "global", domain: "", batch: "", assignedTo: "",
};

export const emptyRequestForm = {
  title: "", requestNote: "", preferredAt: "",
};

export const fmt = (dt) => dt
  ? new Date(dt).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  : "—";
