export const statusColors = {
  pending:     { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  submitted:   { bg: "#DBEAFE", text: "#2563EB", label: "Submitted" },
  hr_reviewed: { bg: "#EDE9FE", text: "#7C3AED", label: "HR Reviewed" },
  reviewed:    { bg: "#D1FAE5", text: "#059669", label: "Reviewed" },
};

export const creatorBadge = {
  hr:    { bg: "#EDE9FE", text: "#7C3AED", label: "HR" },
  admin: { bg: "#FEE2E2", text: "#DC2626", label: "Admin" },
};

export const emptyForm = {
  title: "", description: "", deadline: "",
  submissionLink: "", formLink: "", requiresLink: true,
  assignedDomain: "", assignedBatch: "", assignedTo: "",
  assignmentType: "batch",
};

export const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #E5E7EB", fontSize: 13,
  fontFamily: "inherit", boxSizing: "border-box", outline: "none",
};

export const labelStyle = {
  fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block",
};

export const isOverdue = (deadline) => deadline && new Date(deadline) < new Date();