import React from "react";
import { COLORS } from "../utils/theme";

export default function ProgressBar({ pct, color = COLORS.purple }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: COLORS.navyLight, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color }} />
    </div>
  );
}