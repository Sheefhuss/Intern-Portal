import React, { useState, useEffect, useMemo } from "react";
import { AuthService } from "../auth/authService";
import ApprovalQueue from "./admin/ApprovalQueue";
import FullRegistry from "./admin/FullRegistry";
import BatchesTab from "./admin/BatchesTab";

export default function AdminPanelPage() {
  const [tab, setTab] = useState("queue");
  const [reviewed, setReviewed] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [batches, setBatches]   = useState([]);
  const [allInterns, setAllInterns] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [batchInputs, setBatchInputs] = useState({});
  const [groupBy, setGroupBy]   = useState("none");

  // batch tab state
  const [newBatchName, setNewBatchName]       = useState("");
  const [newBatchDomains, setNewBatchDomains] = useState([]);
  const [editingBatch, setEditingBatch]     = useState(null);
  const [editBatchName, setEditBatchName]   = useState("");
  const [creatingBatch, setCreatingBatch]   = useState(false);
  const [expandedBatch, setExpandedBatch]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rev, reg, bat] = await Promise.all([
        AuthService.apiFetch("/auth/applications/reviewed"),
        AuthService.apiFetch("/admin/registry"),
        AuthService.apiFetch("/admin/batches"),
      ]);
      setReviewed(rev);
      setRegistry(reg);
      setBatches(bat);
      setAllInterns(reg.filter(u => u.role === "intern"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Approval queue actions ──────────────────────────────────────
  const decide = async (id, decision) => {
    setActing(id + decision);
    try {
      await AuthService.apiFetch(`/auth/applications/${id}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ decision, batch: batchInputs[id] || "" }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  // ── Registry actions ────────────────────────────────────────────
  const updateUser = async (id, patch) => {
    setActing(id);
    try {
      const updated = await AuthService.apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setRegistry(prev => prev.map(u => u._id === id ? updated : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const revokeUser = async (id, name) => {
    if (!window.confirm(`Revoke access for ${name}? They will be unable to log in.`)) return;
    setActing(id);
    try {
      const updated = await AuthService.apiFetch(`/admin/users/${id}/revoke`, { method: "PATCH" });
      setRegistry(prev => prev.map(u => u._id === id ? updated : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const reactivateUser = async (id) => {
    setActing(id);
    try {
      const updated = await AuthService.apiFetch(`/admin/users/${id}/reactivate`, { method: "PATCH" });
      setRegistry(prev => prev.map(u => u._id === id ? updated : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone. Their tasks will be kept but unlinked.`)) return;
    setActing(id);
    try {
      await AuthService.apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      setRegistry(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  // ── Batch actions ───────────────────────────────────────────────
  const createBatch = async () => {
    if (!newBatchName.trim() || newBatchDomains.length === 0) return alert("Batch name and at least one domain are required.");
    setCreatingBatch(true);
    try {
      const created = [];
      const failed = [];
      for (const domain of newBatchDomains) {
        try {
          const batch = await AuthService.apiFetch("/admin/batches", {
            method: "POST",
            body: JSON.stringify({ name: newBatchName.trim(), domain }),
          });
          created.push(batch);
        } catch (err) {
          failed.push(`${domain}: ${err.message}`);
        }
      }
      if (created.length) setBatches(prev => [...prev, ...created]);
      if (failed.length) alert(`Some batches were not created:\n${failed.join("\n")}`);
      if (created.length) {
        setNewBatchName("");
        setNewBatchDomains([]);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingBatch(false);
    }
  };

  const saveBatchEdit = async (id) => {
    if (!editBatchName.trim()) return alert("Batch name is required.");
    try {
      const updated = await AuthService.apiFetch(`/admin/batches/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editBatchName.trim() }),
      });
      setBatches(prev => prev.map(b => b._id === id ? { ...updated, internCount: b.internCount } : b));
      setEditingBatch(null);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteBatch = async (id, label) => {
    if (!window.confirm(`Delete batch "${label}"? This only works if no interns are assigned to it.`)) return;
    try {
      await AuthService.apiFetch(`/admin/batches/${id}`, { method: "DELETE" });
      setBatches(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const assignInternToBatch = async (batchId, userId) => {
    try {
      await AuthService.apiFetch(`/admin/batches/${batchId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ userId }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const removeInternFromBatch = async (userId) => {
    try {
      await AuthService.apiFetch(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ batch: "" }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────
  const domains = useMemo(
    () => [...new Set(registry.map(u => u.domain).filter(Boolean))],
    [registry]
  );

  const activeInterns   = registry.filter(u => u.role === "intern" && u.status === "active");
  const hrStaff         = registry.filter(u => u.role === "hr" && u.status !== "revoked");
  const adminStaff      = registry.filter(u => u.role === "admin" && u.status !== "revoked");
  const inactivePending = registry.filter(u =>
    u.role === "intern" && ["pending", "hr_reviewed", "rejected"].includes(u.status)
  );
  const revokedUsers    = registry.filter(u => u.status === "revoked");

  if (loading) return <div style={{ color: "#6B7280", padding: 20 }}>Loading…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          ["queue", `Approval Queue (${reviewed.length})`],
          ["registry", `Full Registry (${registry.length})`],
          ["batches", `Batches (${batches.length})`],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "9px 20px", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === id ? "#7C3AED" : "#fff",
            color: tab === id ? "#fff" : "#6B7280",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}>{label}</button>
        ))}
      </div>

      {tab === "queue" && (
        <ApprovalQueue
          reviewed={reviewed}
          batchInputs={batchInputs}
          setBatchInputs={setBatchInputs}
          decide={decide}
          acting={acting}
        />
      )}

      {tab === "registry" && (
        <FullRegistry
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          activeInterns={activeInterns}
          hrStaff={hrStaff}
          adminStaff={adminStaff}
          inactivePending={inactivePending}
          revokedUsers={revokedUsers}
          batches={batches}
          updateUser={updateUser}
          revokeUser={revokeUser}
          reactivateUser={reactivateUser}
          deleteUser={deleteUser}
          acting={acting}
        />
      )}

      {tab === "batches" && (
        <BatchesTab
          batches={batches}
          allInterns={allInterns}
          domains={domains}
          newBatchName={newBatchName}
          setNewBatchName={setNewBatchName}
          newBatchDomains={newBatchDomains}
          setNewBatchDomains={setNewBatchDomains}
          creatingBatch={creatingBatch}
          createBatch={createBatch}
          editingBatch={editingBatch}
          setEditingBatch={setEditingBatch}
          editBatchName={editBatchName}
          setEditBatchName={setEditBatchName}
          saveBatchEdit={saveBatchEdit}
          deleteBatch={deleteBatch}
          expandedBatch={expandedBatch}
          setExpandedBatch={setExpandedBatch}
          assignInternToBatch={assignInternToBatch}
          removeInternFromBatch={removeInternFromBatch}
        />
      )}
    </div>
  );
}