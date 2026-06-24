import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import AnnouncementBox from "./interns/AnnouncementBox";
import PendingTable from "./interns/PendingTable";
import ActiveInternsTable from "./interns/ActiveInternsTable";

export default function InternsPage({ session }) {
  const role = session?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isHR    = role === "hr";

  const [pending, setPending]       = useState([]);
  const [active, setActive]         = useState([]);
  const [progress, setProgress]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [forwarding, setForwarding] = useState(null);
  const [tab, setTab]               = useState("active");

  const [annText, setAnnText]       = useState("");
  const [annRole, setAnnRole]       = useState("all");
  const [annPosting, setAnnPosting] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pend, act, prog] = await Promise.all([
        AuthService.apiFetch("/auth/applications/pending"),
        AuthService.apiFetch("/auth/interns"),
        AuthService.apiFetch("/tasks/progress/interns"),
      ]);
      setPending(pend);
      setActive(act);
      setProgress(prog);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const forward = async (id) => {
    setForwarding(id);
    try {
      await AuthService.apiFetch(`/auth/applications/${id}/forward`, { method: "PATCH" });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setForwarding(null);
    }
  };

  const sendAnnouncement = async () => {
    if (!annText.trim()) return alert("Announcement text is required.");
    setAnnPosting(true);
    try {
      await AuthService.apiFetch("/announcements", {
        method: "POST",
        body: JSON.stringify({ text: annText, role: annRole }),
      });
      setAnnText("");
      setAnnSuccess(true);
      setTimeout(() => setAnnSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setAnnPosting(false);
    }
  };

  if (loading) return <div style={{ color: "#6B7280", padding: 20 }}>Loading…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {(isAdmin || isHR) && (
        <AnnouncementBox
          annText={annText}
          setAnnText={setAnnText}
          annRole={annRole}
          setAnnRole={setAnnRole}
          annPosting={annPosting}
          annSuccess={annSuccess}
          sendAnnouncement={sendAnnouncement}
        />
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {[
          ["active",  `Active Interns (${active.length})`],
          ["pending", `Pending Review (${pending.length})`],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "9px 20px", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === id ? "#7C3AED" : "#fff",
            color:      tab === id ? "#fff"    : "#6B7280",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}>{label}</button>
        ))}
      </div>

      {tab === "pending" && (
        <PendingTable pending={pending} forwarding={forwarding} forward={forward} />
      )}

      {tab === "active" && (
        <ActiveInternsTable active={active} progress={progress} />
      )}
    </div>
  );
}