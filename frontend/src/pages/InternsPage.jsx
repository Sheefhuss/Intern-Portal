import React, { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import AnnouncementBox from "./interns/AnnouncementBox";
import ActiveInternsTable from "./interns/ActiveInternsTable";

export default function InternsPage({ session }) {
  const role = session?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isHR    = role === "hr";

  const [active, setActive]         = useState([]);
  const [progress, setProgress]     = useState({});
  const [loading, setLoading]       = useState(true);

  const [annText, setAnnText]       = useState("");
  const [annRole, setAnnRole]       = useState("all");
  const [annPosting, setAnnPosting] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [act, prog] = await Promise.all([
        AuthService.apiFetch("/auth/interns"),
        AuthService.apiFetch("/tasks/progress/interns"),
      ]);
      setActive(act);
      setProgress(prog);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

      <ActiveInternsTable active={active} progress={progress} />
    </div>
  );
}