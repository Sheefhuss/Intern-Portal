import React from "react";
import { COLORS, S } from "../../utils/theme";
import { domainColor, pillSelect } from "../../utils/adminConstants";

function Empty({ text }) {
  return (
    <div style={{ textAlign: "center", color: COLORS.muted, padding: "24px 0", fontSize: 13, border: `1px dashed ${COLORS.border}`, borderRadius: 8 }}>
      {text}
    </div>
  );
}

export default function BatchesTab({
  batches, allInterns, domains,
  newBatchName, setNewBatchName, newBatchDomains, setNewBatchDomains, creatingBatch, createBatch,
  editingBatch, setEditingBatch, editBatchName, setEditBatchName, saveBatchEdit, deleteBatch,
  expandedBatch, setExpandedBatch, assignInternToBatch, removeInternFromBatch,
}) {
  const toggleDomain = (d) => {
    setNewBatchDomains(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#111827" }}>➕ Create New Batch</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>Domain(s)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 360 }}>
              {domains.map(d => {
                const selected = newBatchDomains.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDomain(d)}
                    style={{
                      padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${selected ? "#7C3AED" : "#E5E7EB"}`,
                      background: selected ? "#7C3AED" : "#fff",
                      color: selected ? "#fff" : "#6B7280",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {selected ? "✓ " : ""}{d}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Batch Name</label>
            <input
              value={newBatchName}
              onChange={e => setNewBatchName(e.target.value)}
              placeholder="e.g. B1"
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", outline: "none", width: 160 }}
            />
          </div>
          <button
            onClick={createBatch}
            disabled={creatingBatch}
            style={{
              padding: "10px 22px", background: "#7C3AED", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: creatingBatch ? "not-allowed" : "pointer", opacity: creatingBatch ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {creatingBatch ? "Creating…" : "Create Batch"}
          </button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#111827" }}>📦 All Batches</div>
        {batches.length === 0 ? (
          <Empty text="No batches created yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {batches.map(b => {
              const isExpanded = expandedBatch === b._id;
              const isEditing = editingBatch === b._id;
              const batchInterns = allInterns.filter(i => i.domain === b.domain && i.batch === b.name);
              const unassignedInDomain = allInterns.filter(i => i.domain === b.domain && i.batch !== b.name && i.status === "active");

              return (
                <div key={b._id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        background: (domainColor[b.domain] || "#6B7280") + "22",
                        color: domainColor[b.domain] || "#6B7280",
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {b.domain}
                      </span>
                      {isEditing ? (
                        <input
                          value={editBatchName}
                          onChange={e => setEditBatchName(e.target.value)}
                          autoFocus
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #7C3AED", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                        />
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{b.name}</span>
                      )}
                      <span style={{ fontSize: 12, color: COLORS.muted }}>{b.internCount} intern{b.internCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => saveBatchEdit(b._id)} style={{ background: "#16A34A", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
                          <button onClick={() => setEditingBatch(null)} style={{ background: "#fff", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setExpandedBatch(isExpanded ? null : b._id)} style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {isExpanded ? "Close" : "Manage Interns"}
                          </button>
                          <button onClick={() => { setEditingBatch(b._id); setEditBatchName(b.name); }} style={{ background: "#fff", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Rename</button>
                          <button onClick={() => deleteBatch(b._id, `${b.domain} / ${b.name}`)} style={{ background: "#fff", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ background: "#F9FAFB", borderTop: `1px solid ${COLORS.border}`, padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Interns in this batch</div>
                      {batchInterns.length === 0 ? (
                        <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 14 }}>No interns assigned yet.</div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                          {batchInterns.map(i => (
                            <span key={i._id} style={{
                              background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20,
                              padding: "4px 6px 4px 12px", fontSize: 12, color: "#374151",
                              display: "inline-flex", alignItems: "center", gap: 8,
                            }}>
                              {i.name}
                              <button
                                onClick={() => {
                                  if (window.confirm(`Remove ${i.name} from ${b.name}?`)) removeInternFromBatch(i._id);
                                }}
                                title={`Remove ${i.name} from this batch`}
                                style={{
                                  background: "#FEE2E2", color: "#DC2626", border: "none",
                                  borderRadius: "50%", width: 18, height: 18, fontSize: 11,
                                  fontWeight: 700, cursor: "pointer", lineHeight: 1,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontFamily: "inherit", padding: 0,
                                }}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Assign an intern from {b.domain}</div>
                      {unassignedInDomain.length === 0 ? (
                        <div style={{ fontSize: 12, color: COLORS.muted }}>No other active interns in this domain to assign.</div>
                      ) : (
                        <select
                          defaultValue=""
                          onChange={e => { if (e.target.value) { assignInternToBatch(b._id, e.target.value); e.target.value = ""; } }}
                          style={{ ...pillSelect, padding: "8px 12px", minWidth: 220 }}
                        >
                          <option value="">— Select Intern —</option>
                          {unassignedInDomain.map(i => <option key={i._id} value={i._id}>{i.name} ({i.batch || "No Batch"})</option>)}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}