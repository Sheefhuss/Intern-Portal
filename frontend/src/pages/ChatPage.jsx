import { useState, useEffect, useRef } from "react";
import { AuthService } from "../auth/authService";
import { S } from "../utils/theme";

export default function ChatPage({ currentUserId, socket }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (message) => {
      const senderId = String(message.sender);
      if (selectedUser && senderId === String(selectedUser._id)) {
        setMessages((prev) => [...prev, message]);
      } else {
        setUsers((prevUsers) => 
          prevUsers.map((u) => 
            String(u._id) === senderId ? { ...u, hasUnread: true } : u
          )
        );
      }
    };

    const handleSent = (message) => setMessages((prev) => [...prev, message]);

    const handleEdited = (updatedMsg) => {
      setMessages((prev) => prev.map((m) => m._id === updatedMsg._id ? updatedMsg : m));
    };

    const handleDeleted = (deletedMsg) => {
      setMessages((prev) => prev.map((m) => m._id === deletedMsg._id ? deletedMsg : m));
    };

    socket.on("receive_message", handleReceive);
    socket.on("message_sent", handleSent);
    socket.on("message_edited", handleEdited);
    socket.on("message_deleted", handleDeleted);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("message_sent", handleSent);
      socket.off("message_edited", handleEdited);
      socket.off("message_deleted", handleDeleted);
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    if (!currentUserId) return;
    
    AuthService.apiFetch("/messages/users")
      .then((data) => {
        const weights = { admin: 1, hr: 2, intern: 3 };
        const sorted = data.sort((a, b) => weights[a.role] - weights[b.role]);
        setUsers(sorted);
      })
      .catch((err) => console.error(err));
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedUser) return;

    setUsers((prevUsers) => 
      prevUsers.map((u) => 
        String(u._id) === String(selectedUser._id) ? { ...u, hasUnread: false } : u
      )
    );

    AuthService.apiFetch(`/messages/${selectedUser._id}`)
      .then((history) => setMessages(history))
      .catch(console.error);

    AuthService.apiFetch(`/messages/mark-read/${selectedUser._id}`, { method: "PATCH" })
      .catch(console.error);
      
    setEditingMsgId(null);
    setMessageInput("");
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initiateEdit = (msg) => {
    setEditingMsgId(msg._id);
    setMessageInput(msg.content);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setMessageInput("");
  };

  const deleteMessage = (msgId) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    socket.emit("delete_message", {
      messageId: msgId,
      receiverId: selectedUser._id
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !socket || !selectedUser) return;

    if (editingMsgId) {
      socket.emit("edit_message", {
        messageId: editingMsgId,
        newContent: messageInput.trim(),
        receiverId: selectedUser._id
      });
      setEditingMsgId(null);
    } else {
      socket.emit("send_message", {
        receiver: selectedUser._id,
        content: messageInput.trim(),
      });
    }
    setMessageInput("");
  };

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 120px)" }}>
      <div style={{ ...S.card, width: "300px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <h3 style={{ margin: "0 0 16px 0", color: "#111827" }}>Conversations</h3>
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map((u) => (
            <button
              key={u._id}
              onClick={() => setSelectedUser(u)}
              style={{
                padding: "12px 16px",
                border: "none",
                borderRadius: 8,
                textAlign: "left",
                cursor: "pointer",
                background: selectedUser?._id === u._id ? "#EDE9FE" : "#F9FAFB",
                color: selectedUser?._id === u._id ? "#7C3AED" : "#374151",
                fontWeight: selectedUser?._id === u._id ? 600 : 500,
                transition: "background 0.2s",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{u.name}</span>
                  {u.hasUnread && (
                    <span style={{
                      width: 10, height: 10, minWidth: 10, minHeight: 10,
                      background: "#EF4444", borderRadius: "50%", display: "inline-block"
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 11, color: selectedUser?._id === u._id ? "#7C3AED" : "#9CA3AF" }}>
                  {u.role}
                </span>
              </div>
              {u.role === 'intern' && (u.domain || u.batch) && (
                <div style={{ fontSize: 11, color: selectedUser?._id === u._id ? "#8B5CF6" : "#6B7280" }}>
                  {[u.domain, u.batch].filter(Boolean).join(" · ")}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...S.card, flex: 1, display: "flex", flexDirection: "column" }}>
        {!selectedUser ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
            Select a user to start chatting
          </div>
        ) : (
          <>
            <div style={{ paddingBottom: 16, borderBottom: "1px solid #E5E7EB", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#111827" }}>{selectedUser.name}</h3>
              {selectedUser.role === 'intern' && (selectedUser.domain || selectedUser.batch) && (
                 <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                   {[selectedUser.domain, selectedUser.batch].filter(Boolean).join(" · ")}
                 </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 8 }}>
              {messages.map((msg) => {
                const isMine = msg.sender === currentUserId;
                const isHovered = hoveredMsgId === msg._id;
                const hoursOld = (new Date() - new Date(msg.createdAt)) / (1000 * 60 * 60);
                const canEdit = isMine && hoursOld <= 3 && !msg.isDeleted;

                return (
                  <div 
                    key={msg._id} 
                    onMouseEnter={() => setHoveredMsgId(msg._id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                    style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "70%", display: "flex", gap: 8, alignItems: "center" }}
                  >
                    {isMine && isHovered && !msg.isDeleted && (
                      <div style={{ display: "flex", gap: 8 }}>
                        {canEdit && (
                          <button onClick={() => initiateEdit(msg)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: "2px" }} title="Edit">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                          </button>
                        )}
                        <button onClick={() => deleteMessage(msg._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "2px" }} title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    <div style={{
                      background: msg.isDeleted ? "#F3F4F6" : (isMine ? "#7C3AED" : "#F3F4F6"),
                      color: msg.isDeleted ? "#9CA3AF" : (isMine ? "#FFF" : "#111827"),
                      fontStyle: msg.isDeleted ? "italic" : "normal",
                      padding: "10px 14px",
                      borderRadius: 16,
                      borderBottomRightRadius: isMine ? 4 : 16,
                      borderBottomLeftRadius: !isMine ? 4 : 16,
                      fontSize: 14
                    }}>
                      {msg.content}
                      {msg.isEdited && !msg.isDeleted && (
                        <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 8 }}>(edited)</span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
              {editingMsgId && (
                <button type="button" onClick={cancelEdit} style={{
                  background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, padding: "12px 16px", fontWeight: 600, cursor: "pointer"
                }}>
                  Cancel
                </button>
              )}
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={editingMsgId ? "Edit your message..." : "Type a message..."}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 8, border: "1px solid #D1D5DB", outline: "none", fontSize: 14,
                  background: editingMsgId ? "#F5F3FF" : "#FFF"
                }}
              />
              <button type="submit" style={{
                background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "0 24px", height: "43px", fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {editingMsgId ? "Save" : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}