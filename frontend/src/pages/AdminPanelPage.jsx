import { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import InviteIntern from "./admin/InviteIntern";
import FullRegistry from "./admin/FullRegistry";
import BatchesTab from "./admin/BatchesTab";
import { DOMAINS } from "../data/database";
import CertificateIssuePanel from "./admin/CertificateIssuePanel";
import TaskCertificatesPanel from "./admin/TaskCertificatesPanel";
import OfferLetterPanel from "./admin/OfferLetterPanel";

export default function AdminPanelPage() {
  const [tab, setTab] = useState("invite");
  const [registry, setRegistry] = useState([]);
  const [batches, setBatches]   = useState([]);
  const [allInterns, setAllInterns] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [groupBy, setGroupBy]   = useState("none");

  const [inviting, setInviting]   = useState(false);
  const [resending, setResending] = useState(null);

  const [newBatchName, setNewBatchName]       = useState("");
  const [newBatchDomains, setNewBatchDomains] = useState([]);
  const [editingBatch, setEditingBatch]     = useState(null);
  const [editBatchName, setEditBatchName]   = useState("");
  const [creatingBatch, setCreatingBatch]   = useState(false);
  const [expandedBatch, setExpandedBatch]   = useState(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [clearingNotifs, setClearingNotifs] = useState(false);

  const clearAllNotifications = async () => {
    if (!window.confirm("This deletes EVERY notification for EVERYONE (admin, hr, and interns) — including anything not yet read. This can't be undone. Continue?")) return;
    setClearingNotifs(true);
    try {
      const result = await AuthService.apiFetch("/admin/maintenance/notifications", { method: "DELETE" });
      alert(`Deleted ${result.deletedCount || 0} notifications.`);
    } catch (err) {
      alert(err.message || "Failed to clear notifications.");
    } finally {
      setClearingNotifs(false);
    }
  };

  const cleanupOrphanedData = async () => {
    if (!window.confirm("This permanently deletes leftover submissions, certificates, and notifications tied to already-deleted tasks or interns. Continue?")) return;
    setCleaningUp(true);
    try {
      const result = await AuthService.apiFetch("/admin/maintenance/cleanup-orphaned-data", { method: "POST" });
      const d = result.deleted || {};
      const warnings = result.inconsistentCertificates || [];
      const warningText = warnings.length
        ? `\n\n⚠️ ${warnings.length} certificate(s) were emailed to interns not currently marked Completed — nothing was deleted, review these manually:\n` +
          warnings.map(w => `• ${w.internName} (${w.internEmail}) — status: ${w.internStatus} — ${w.certificateId}`).join("\n")
        : "";
      alert(
        `Cleaned up:\n` +
        `${d.notifications || 0} notifications\n` +
        `${d.submissions || 0} submissions\n` +
        `${d.taskCertificates || 0} task certificates\n` +
        `${d.certificates || 0} internship certificates` +
        warningText
      );
    } catch (err) {
      alert(err.message || "Cleanup failed.");
    } finally {
      setCleaningUp(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [reg, bat] = await Promise.all([
        AuthService.apiFetch("/admin/registry"),
        AuthService.apiFetch("/admin/batches"),
      ]);
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

  const invite = async ({ name, email, domain, batch, deliveryMethod }) => {
    setInviting(true);
    try {
      const result = await AuthService.apiFetch("/admin/interns/invite", {
        method: "POST",
        body: JSON.stringify({ name, email, domain, batch, deliveryMethod }),
      });
      await load();
      return result;
    } catch (err) {
      alert(err.message);
      return null;
    } finally {
      setInviting(false);
    }
  };

  const resendPasscode = async (id, deliveryMethod) => {
    setResending(id);
    try {
      const result = await AuthService.apiFetch(`/admin/interns/${id}/resend-passcode`, {
        method: "PATCH",
        body: JSON.stringify({ deliveryMethod }),
      });
      alert(result.emailSent ? "Passcode resent." : `No email was sent. New passcode: ${result.passcode}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setResending(null);
    }
  };

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

  const completeUser = async (id, name) => {
    if (!window.confirm(`Mark ${name}'s internship as completed? They'll move to Past Interns, won't be able to log in as an active intern, and — if all their tasks are already reviewed — their certificate will become emailable from the Certificates tab.`)) return;
    setActing(id);
    try {
      const updated = await AuthService.apiFetch(`/admin/users/${id}/complete`, { method: "PATCH" });
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

  const domains = DOMAINS;

  const activeInterns   = registry.filter(u => u.role === "intern" && u.status === "active");
  const hrStaff         = registry.filter(u => u.role === "hr" && u.status !== "revoked");
  const adminStaff      = registry.filter(u => u.role === "admin" && u.status !== "revoked");
  const invitedInterns  = registry.filter(u => u.role === "intern" && u.status === "invited");
  const revokedUsers    = registry.filter(u => u.status === "revoked");
  const completedInterns = registry.filter(u => u.role === "intern" && u.status === "completed");

  if (loading) return <div style={{ color: "#6B7280", padding: 20 }}>Loading…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["invite", `Invite Intern (${invitedInterns.length} pending)`],
            ["registry", `Full Registry (${registry.length})`],
            ["batches", `Batches (${batches.length})`],
            ["certificates", "Certificates"],
            ["taskCertificates", "Task Certificates"],
            ["offerLetters", "Offer Letters"],
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
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={cleanupOrphanedData}
            disabled={cleaningUp}
            title="Delete leftover submissions, certificates, and notifications tied to already-deleted tasks or interns"
            style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1px solid #FCA5A5", background: "#fff", color: "#DC2626",
              cursor: cleaningUp ? "not-allowed" : "pointer", fontFamily: "inherit",
              opacity: cleaningUp ? 0.6 : 1,
            }}
          >
            {cleaningUp ? "Cleaning…" : "🧹 Clean Up Orphaned Data"}
          </button>
          <button
            onClick={clearAllNotifications}
            disabled={clearingNotifs}
            title="Delete every notification for everyone, no matter what it's about — a full reset"
            style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1px solid #FCA5A5", background: "#fff", color: "#DC2626",
              cursor: clearingNotifs ? "not-allowed" : "pointer", fontFamily: "inherit",
              opacity: clearingNotifs ? 0.6 : 1,
            }}
          >
            {clearingNotifs ? "Clearing…" : "🗑️ Clear ALL Notifications"}
          </button>
        </div>
      </div>

      {tab === "invite" && (
        <InviteIntern
          invited={invitedInterns}
          batches={batches}
          inviting={inviting}
          invite={invite}
          resending={resending}
          resendPasscode={resendPasscode}
        />
      )}

      {tab === "registry" && (
        <FullRegistry
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          activeInterns={activeInterns}
          hrStaff={hrStaff}
          adminStaff={adminStaff}
          inactivePending={invitedInterns}
          revokedUsers={revokedUsers}
          completedInterns={completedInterns}
          batches={batches}
          updateUser={updateUser}
          revokeUser={revokeUser}
          reactivateUser={reactivateUser}
          deleteUser={deleteUser}
          completeUser={completeUser}
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

      {tab === "certificates" && <CertificateIssuePanel />}
      {tab === "taskCertificates" && <TaskCertificatesPanel />}
      {tab === "offerLetters" && <OfferLetterPanel />}
    </div>
  );
}