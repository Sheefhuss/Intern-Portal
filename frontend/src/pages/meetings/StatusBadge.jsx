import { statusColors } from "./constants";

export default function StatusBadge({ status }) {
  const c = statusColors[status] || statusColors.pending;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 10px",
      borderRadius: 20, background: c.bg, color: c.text,
    }}>
      {c.label}
    </span>
  );
}
