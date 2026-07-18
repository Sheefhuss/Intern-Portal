import { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { S, COLORS } from "../utils/theme";

import { emptySlotForm, emptyRequestForm, btnPrimary, toISOFromLocal } from "./meetings/constants";
import MeetingCard from "./meetings/MeetingCard";
import RequestCard from "./meetings/RequestCard";
import { InternSlotCard, BookedCard, MyRequestCard } from "./meetings/InternCards";
import SlotForm from "./meetings/SlotForm";
import RequestForm from "./meetings/RequestForm";
import ApproveModal from "./meetings/ApproveModal";

export default function MeetingsPage({ session }) {
  const role    = session?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isHR    = role === "hr";

  const [meetings, setMeetings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState(isAdmin ? "slots" : "available");
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotForm, setSlotForm]         = useState(emptySlotForm);
  const [posting, setPosting]           = useState(false);
  const [showReqForm, setShowReqForm]   = useState(false);
  const [reqForm, setReqForm]           = useState(emptyRequestForm);
  const [requesting, setRequesting]     = useState(false);
  const [acting, setActing]             = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveForm, setApproveForm]   = useState({ approvalLink: "", scheduledAt: "" });
  const [interns, setInterns]           = useState([]);

  const load = () => {
    setLoading(true);
    AuthService.apiFetch("/meetings")
      .then(setMeetings).catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      AuthService.apiFetch("/admin/users?role=intern&status=active")
        .then(setInterns).catch(() => setInterns([]));
    }
  }, [isAdmin]);

  const slots          = meetings.filter(m => m.type === "slot");
  const requests       = meetings.filter(m => m.type === "request");
  const myBooking      = role === "intern"
    ? slots.find(m => m.bookedBy?._id === session?.id || m.bookedBy === session?.id)
    : null;
  const availableSlots = slots.filter(m => m.status === "open");
  const myRequests     = requests.filter(m =>
    m.createdBy?._id === session?.id || m.createdBy === session?.id
  );


  const handleCreateSlot = async () => {
    if (!slotForm.title.trim())    return alert("Title is required.");
    if (!slotForm.meetLink.trim()) return alert("Meeting link is required.");
    if (!slotForm.scheduledAt)     return alert("Scheduled time is required.");
    if (slotForm.scope === "batch"  && (!slotForm.domain || !slotForm.batch))
      return alert("Domain and batch are required for batch-scoped slots.");
    if (slotForm.scope === "intern" && !slotForm.assignedTo)
      return alert("Please select a specific intern.");

    setPosting(true);
    try {
      const newMeeting = await AuthService.apiFetch("/meetings/slots", {
        method: "POST",
        body: JSON.stringify({ ...slotForm, scheduledAt: toISOFromLocal(slotForm.scheduledAt) }),
      });
      setMeetings([newMeeting, ...meetings]);
      setSlotForm(emptySlotForm);
      setShowSlotForm(false);
    } catch (err) { alert(err.message); }
    finally { setPosting(false); }
  };

  const handleBook = async (meetingId) => {
    setActing(meetingId);
    try {
      const updated = await AuthService.apiFetch(`/meetings/${meetingId}/book`, { method: "PATCH" });
      setMeetings(meetings.map(m => m._id === meetingId ? { ...m, ...updated } : m));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  };

  const handleCancel = async (meetingId) => {
    if (!window.confirm("Cancel your booking for this slot?")) return;
    setActing(meetingId);
    try {
      const updated = await AuthService.apiFetch(`/meetings/${meetingId}/cancel`, { method: "PATCH" });
      setMeetings(meetings.map(m => m._id === meetingId ? { ...m, ...updated } : m));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  };

  const handleRequest = async () => {
    if (!reqForm.title.trim())       return alert("Title is required.");
    if (!reqForm.requestNote.trim()) return alert("Please describe your meeting purpose.");
    setRequesting(true);
    try {
      const newReq = await AuthService.apiFetch("/meetings/requests", {
        method: "POST",
        body: JSON.stringify({ ...reqForm, preferredAt: toISOFromLocal(reqForm.preferredAt) }),
      });
      setMeetings([...meetings, newReq]);
      setReqForm(emptyRequestForm);
      setShowReqForm(false);
    } catch (err) { alert(err.message); }
    finally { setRequesting(false); }
  };

  const handleApprove = async () => {
    setActing(approveTarget._id);
    try {
      const updated = await AuthService.apiFetch(`/meetings/${approveTarget._id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ ...approveForm, scheduledAt: toISOFromLocal(approveForm.scheduledAt) }),
      });
      setMeetings(meetings.map(m => m._id === approveTarget._id ? { ...m, ...updated } : m));
      setApproveTarget(null);
      setApproveForm({ approvalLink: "", scheduledAt: "" });
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  };

  const handleReject = async (meetingId) => {
    if (!window.confirm("Reject this meeting request?")) return;
    setActing(meetingId);
    try {
      const updated = await AuthService.apiFetch(`/meetings/${meetingId}/reject`, { method: "PATCH" });
      setMeetings(meetings.map(m => m._id === meetingId ? { ...m, ...updated } : m));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  };

  const handleDelete = async (meetingId) => {
    if (!window.confirm("Delete this meeting?")) return;
    setActing(meetingId);
    try {
      await AuthService.apiFetch(`/meetings/${meetingId}`, { method: "DELETE" });
      setMeetings(meetings.filter(m => m._id !== meetingId));
    } catch (err) { alert(err.message); }
    finally { setActing(null); }
  };


  const tabs = isAdmin || isHR
    ? ["slots", "requests"]
    : ["available", "my-booking", "my-requests"];

  const tabLabels = {
    slots:         `Slots (${slots.length})`,
    requests:      `Requests (${requests.length})`,
    available:     `Available (${availableSlots.length})`,
    "my-booking":  "My Booking",
    "my-requests": `My Requests (${myRequests.length})`,
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>

      {/* Header */}
      <div style={{ ...S.card, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>📅 Meetings</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
            {isAdmin ? "Create slots and manage meeting requests"
              : isHR  ? "View all slots and intern requests"
              : "Book a slot or send a meeting request"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin && (
            <button onClick={() => setShowSlotForm(!showSlotForm)} style={btnPrimary}>
              {showSlotForm ? "✕ Cancel" : "+ New Slot"}
            </button>
          )}
          {role === "intern" && (
            <button onClick={() => setShowReqForm(!showReqForm)} style={btnPrimary}>
              {showReqForm ? "✕ Cancel" : "📨 Request Meeting"}
            </button>
          )}
        </div>
      </div>

      {/* Forms */}
      {isAdmin && showSlotForm && (
        <SlotForm
          slotForm={slotForm} setSlotForm={setSlotForm}
          posting={posting} interns={interns}
          onSubmit={handleCreateSlot}
          onCancel={() => { setSlotForm(emptySlotForm); setShowSlotForm(false); }}
        />
      )}
      {role === "intern" && showReqForm && (
        <RequestForm
          reqForm={reqForm} setReqForm={setReqForm}
          requesting={requesting}
          onSubmit={handleRequest}
          onCancel={() => { setReqForm(emptyRequestForm); setShowReqForm(false); }}
        />
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: "1px solid",
            borderColor: tab === t ? COLORS.purple : "#E5E7EB",
            background:  tab === t ? COLORS.purple : "#fff",
            color:       tab === t ? "#fff" : "#6B7280",
            cursor: "pointer",
          }}>{tabLabels[t]}</button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF" }}>Loading meetings…</div>
      ) : (
        <>
          {(isAdmin || isHR) && tab === "slots" && (
            slots.length === 0
              ? <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#9CA3AF" }}>
                  {isAdmin ? "No slots yet. Create one above." : "No slots created yet."}
                </div>
              : slots.map(m => (
                  <MeetingCard key={m._id} m={m} isAdmin={isAdmin} acting={acting} onDelete={handleDelete} />
                ))
          )}

          {(isAdmin || isHR) && tab === "requests" && (
            requests.length === 0
              ? <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#9CA3AF" }}>No meeting requests yet.</div>
              : requests.map(m => (
                  <RequestCard key={m._id} m={m} isAdmin={isAdmin} acting={acting}
                    onApprove={() => { setApproveTarget(m); setApproveForm({ approvalLink: "", scheduledAt: "" }); }}
                    onReject={handleReject} onDelete={handleDelete} />
                ))
          )}

          {role === "intern" && tab === "available" && (
            availableSlots.length === 0
              ? <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#9CA3AF" }}>
                  No open slots right now. Check back later or send a request.
                </div>
              : availableSlots.map(m => (
                  <InternSlotCard key={m._id} m={m} acting={acting}
                    alreadyBooked={!!myBooking} onBook={handleBook} />
                ))
          )}

          {role === "intern" && tab === "my-booking" && (
            !myBooking
              ? <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#9CA3AF" }}>You haven't booked a slot yet.</div>
              : <BookedCard m={myBooking} acting={acting} onCancel={handleCancel} />
          )}

          {role === "intern" && tab === "my-requests" && (
            myRequests.length === 0
              ? <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#9CA3AF" }}>You haven't sent any requests yet.</div>
              : myRequests.map(m => <MyRequestCard key={m._id} m={m} />)
          )}
        </>
      )}

      {/* Approve Modal */}
      <ApproveModal
        target={approveTarget} form={approveForm} setForm={setApproveForm}
        acting={acting} onApprove={handleApprove}
        onClose={() => setApproveTarget(null)}
      />
    </div>
  );
}