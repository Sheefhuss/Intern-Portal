import { S } from "../../utils/theme";

const inputStyle = {
  padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
  fontSize: 13, fontFamily: "inherit", outline: "none",
};

export default function AnnouncementBox({ annText, setAnnText, annRole, setAnnRole, annPosting, annSuccess, sendAnnouncement }) {
  return (
    <div style={{ ...S.card, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#111827" }}>
        📢 Send Announcement
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <textarea
          value={annText}
          onChange={e => setAnnText(e.target.value)}
          placeholder="Write your announcement here…"
          rows={3}
          style={{ ...inputStyle, width: "100%", resize: "vertical", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={annRole}
            onChange={e => setAnnRole(e.target.value)}
            style={{ ...inputStyle, minWidth: 160 }}
          >
            <option value="all">Everyone</option>
            <option value="intern">Interns only</option>
            <option value="hr">HR only</option>
            <option value="admin">Admin only</option>
          </select>
          <button
            onClick={sendAnnouncement}
            disabled={annPosting}
            style={{
              padding: "9px 20px", background: "#7C3AED", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: annPosting ? "not-allowed" : "pointer",
              opacity: annPosting ? 0.7 : 1, fontFamily: "inherit",
            }}
          >
            {annPosting ? "Sending…" : "Send Announcement"}
          </button>
          {annSuccess && (
            <span style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}>
              ✓ Announcement sent!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}