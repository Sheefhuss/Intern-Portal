import React from "react";
import { COLORS } from "../utils/theme";

export default function ProgressBar({ pct, color = "#10B981" }) {
  return (
    <div style={{ width: "100%", height: 6, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.3s ease" }} />
    </div>
  );
}