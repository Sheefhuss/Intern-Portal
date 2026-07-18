import { S, COLORS } from "../utils/theme";

export default function StatCard({ label, value, accent }) {
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${accent}`, flex: 1 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}