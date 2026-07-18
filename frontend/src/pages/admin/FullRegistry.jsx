import React from "react";
import { COLORS, S } from "../../utils/theme";
import { pillSelect } from "../../utils/adminConstants";
import { groupUsers } from "../../utils/groupUsers";
import RegistryTable from "./RegistryTable";

function SectionHeader({ dot, title, color = "#111827" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot, display: "inline-block" }} />
      <span style={{ fontWeight: 700, fontSize: 14, color }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: COLORS.border, marginLeft: 8 }} />
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: "center", color: COLORS.muted, padding: "24px 0", fontSize: 13, border: `1px dashed ${COLORS.border}`, borderRadius: 8 }}>
      {text}
    </div>
  );
}

function GroupedSection({ users, groupBy, tableProps, ...tableFlags }) {
  const groups = groupUsers(users, groupBy);
  if (groupBy === "none") {
    return <RegistryTable users={users} {...tableProps} {...tableFlags} />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {groups.map(g => (
        <div key={g.key}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ background: "#F3F4F6", padding: "2px 10px", borderRadius: 12 }}>{g.label}</span>
            <span style={{ color: COLORS.muted, fontWeight: 500 }}>({g.users.length})</span>
          </div>
          <RegistryTable users={g.users} {...tableProps} {...tableFlags} />
        </div>
      ))}
    </div>
  );
}

export default function FullRegistry({
  groupBy, setGroupBy,
  activeInterns, hrStaff, adminStaff, inactivePending, revokedUsers, completedInterns,
  batches, updateUser, revokeUser, reactivateUser, deleteUser, completeUser, acting,
}) {
  const tableProps = { batches, updateUser, revokeUser, reactivateUser, deleteUser, completeUser, acting };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>👥 Full System Registry</div>
          <p style={{ fontSize: 12, color: COLORS.muted, margin: "4px 0 0" }}>Manage active, inactive, and past system users.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>Group By:</span>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={pillSelect}>
            <option value="none">No Grouping</option>
            <option value="domain">Domain</option>
            <option value="batch">Batch</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionHeader dot="#10B981" title={`Active Interns (${activeInterns.length})`} />
        {activeInterns.length === 0
          ? <Empty text="No active interns yet." />
          : <GroupedSection users={activeInterns} groupBy={groupBy} tableProps={tableProps} showBatchEditor showRoleEditor showRevoke showComplete />}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader dot="#7C3AED" title={`HR Staff (${hrStaff.length})`} color="#7C3AED" />
        {hrStaff.length === 0
          ? <Empty text="No HR staff." />
          : <GroupedSection users={hrStaff} groupBy={groupBy} tableProps={tableProps} showRoleEditor showRevoke />}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader dot="#DC2626" title={`Admin Staff (${adminStaff.length})`} color="#DC2626" />
        {adminStaff.length === 0
          ? <Empty text="No other admins." />
          : <GroupedSection users={adminStaff} groupBy={groupBy} tableProps={tableProps} showRoleEditor showRevoke />}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader dot="#F59E0B" title={`Inactive / Pending Interns (${inactivePending.length})`} color="#D97706" />
        {inactivePending.length === 0
          ? <Empty text="No users found in this category." />
          : <GroupedSection users={inactivePending} groupBy={groupBy} tableProps={tableProps} />}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader dot="#4338CA" title={`Completed / Past Interns (${completedInterns.length})`} color="#4338CA" />
        {completedInterns.length === 0
          ? <Empty text="No completed interns yet." />
          : <GroupedSection users={completedInterns} groupBy={groupBy} tableProps={tableProps} showReactivate />}
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader dot="#6B7280" title={`Revoked (${revokedUsers.length})`} color="#6B7280" />
        {revokedUsers.length === 0
          ? <Empty text="No revoked users." />
          : <GroupedSection users={revokedUsers} groupBy={groupBy} tableProps={tableProps} showReactivate />}
      </div>
    </div>
  );
}