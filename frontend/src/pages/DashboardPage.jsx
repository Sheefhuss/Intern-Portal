import React from "react";
import StatCard from "../components/StatCard";
import { TASKS } from "../data/database";
import { S, COLORS } from "../utils/theme";

export default function DashboardPage() {
  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <StatCard label="Active Tasks Assigned" value={TASKS.length} accent={COLORS.purple} />
        <StatCard label="Internal Project Milestone" value="45%" accent={COLORS.info} />
        <StatCard label="Security Clearances" value="Verified" accent={COLORS.success} />
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>📋 Recent Priority Tasks</div>
        {TASKS.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 13 }}>{t.title}</span>
            <span style={S.tag(COLORS.warning)}>{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}