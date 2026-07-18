import { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { S } from "../utils/theme";
import { emptyForm } from "../utils/tasksConstants";
import TaskHeaderBar from "./tasks/TaskHeaderBar";
import CreateTaskForm from "./tasks/CreateTaskForm";
import TaskCard from "./tasks/TaskCard";
import TrackingModal from "./tasks/TrackingModal";
import SubmitModal from "./tasks/SubmitModal";

export default function TasksPage({ session }) {
  const role      = session?.role?.toLowerCase();
  const isAdmin   = role === "admin";
  const isHR      = role === "hr";
  const isManager = isAdmin || isHR;
  const currentUserId = AuthService.getCurrentUserId();

  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [interns, setInterns]   = useState([]);
  const [posting, setPosting]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [submitting, setSubmitting] = useState(null);
  const [deleting, setDeleting]     = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const [submitModalTask, setSubmitModalTask] = useState(null);

  const [trackingTask, setTrackingTask]       = useState(null);
  const [trackingRows, setTrackingRows]       = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [acting, setActing]                   = useState(null);

  const [comments, setComments]           = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postingComment, setPostingComment]   = useState(false);

  const fetchTasks = () => {
    return AuthService.apiFetch("/tasks")
      .then(data => setTasks(data))
      .catch(() => setTasks([]));
  };

  useEffect(() => {
    fetchTasks().finally(() => setLoading(false));
    if (isManager) {
      AuthService.apiFetch("/admin/users?status=active&role=intern")
        .then(data => setInterns(data))
        .catch(() => setInterns([]));
    }
  }, [isManager]);

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const handleDomainChange = (e) => {
    setForm({ ...form, assignedDomain: e.target.value, assignedBatch: "", assignedTo: "" });
  };

  const handleBatchChange = (e) => {
    setForm({ ...form, assignedBatch: e.target.value, assignedTo: "" });
  };

  const handleCreate = async () => {
    if (!form.title.trim())                                   return alert("Title is required.");
    if (!form.assignedDomain)                                 return alert("Domain selection is required.");
    if (!form.assignedBatch)                                  return alert("Batch selection is required.");
    if (form.assignmentType === "intern" && !form.assignedTo) return alert("Please select a specific intern.");

    setPosting(true);
    try {
      const newTask = await AuthService.apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTasks(prev => [newTask, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert("Failed to create task.");
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (task.createdBy !== currentUserId) {
      alert("Only the admin/HR who created this task can delete it.");
      return;
    }
    if (!window.confirm(`Delete "${task.title}"? This will remove it and all intern submissions for it. This can't be undone.`)) return;
    setDeletingTask(task._id);
    try {
      await AuthService.apiFetch(`/tasks/${task._id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t._id !== task._id));
    } catch (err) {
      alert(err.message || "Failed to delete task.");
    } finally {
      setDeletingTask(null);
    }
  };

  const handleEditDeadline = async (task, newDeadline) => {
    if (task.createdBy !== currentUserId) {
      alert("Only the admin/HR who created this task can edit its deadline.");
      return;
    }
    try {
      const updated = await AuthService.apiFetch(`/tasks/${task._id}`, {
        method: "PATCH",
        body: JSON.stringify({ deadline: newDeadline || null }),
      });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, ...updated } : t));
    } catch (err) {
      alert(err.message || "Failed to update deadline.");
      throw err;
    }
  };

  const handleSubmit = async (taskId, submissionUrl) => {
    setSubmitting(taskId);
    try {
      await AuthService.apiFetch(`/tasks/${taskId}/submit`, {
        method: "PATCH",
        body: JSON.stringify({ submissionUrl }),
      });
      setTasks(prev =>
        prev.map(t => t._id === taskId ? { ...t, status: "submitted", submissionUrl } : t)
      );
      setSubmitModalTask(null);
    } catch (err) {
      alert(err.message || "Failed to submit.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleWithdraw = async (taskId) => {
    if (!window.confirm("Withdraw your submission? This will reset it to Pending.")) return;
    setDeleting(taskId);
    try {
      await AuthService.apiFetch(`/tasks/${taskId}/withdraw`, { method: "PATCH" });
      setTasks(prev =>
        prev.map(t => t._id === taskId ? { ...t, status: "pending", submissionUrl: "" } : t)
      );
    } catch (err) {
      alert(err.message || "Failed to withdraw.");
    } finally {
      setDeleting(null);
    }
  };

  const fetchComments = async (taskId) => {
    setCommentsLoading(true);
    try {
      const data = await AuthService.apiFetch(`/tasks/${taskId}/comments`);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const openTracking = async (task) => {
    setTrackingTask(task);
    setTrackingLoading(true);
    try {
      const rows = await AuthService.apiFetch(`/tasks/${task._id}/submissions`);
      setTrackingRows(rows);
    } catch {
      setTrackingRows([]);
    } finally {
      setTrackingLoading(false);
    }
    fetchComments(task._id);
  };

  const closeTracking = () => {
    setTrackingTask(null);
    setTrackingRows([]);
    setComments([]);
  };

  const postComment = async (text) => {
    if (!trackingTask) return;
    setPostingComment(true);
    try {
      await AuthService.apiFetch(`/tasks/${trackingTask._id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      await fetchComments(trackingTask._id);
    } catch (err) {
      alert(err.message || "Failed to post comment.");
    } finally {
      setPostingComment(false);
    }
  };

  const refreshAfterAction = async () => {
    if (!trackingTask) return;
    const data = await AuthService.apiFetch("/tasks").catch(() => null);
    if (data) {
      setTasks(data);
      const updated = data.find(t => t._id === trackingTask._id);
      if (updated) setTrackingTask(updated);
    }
    try {
      const rows = await AuthService.apiFetch(`/tasks/${trackingTask._id}/submissions`);
      setTrackingRows(rows);
    } catch (err) {
      console.error("Failed to refresh submission rows:", err);
    }
  };

  const forwardSubmission = async (submissionId) => {
    setActing(submissionId);
    try {
      await AuthService.apiFetch(`/tasks/${submissionId}/forward`, { method: "PATCH" });
      await refreshAfterAction();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const reviewSubmission = async (submissionId) => {
    setActing(submissionId);
    try {
      await AuthService.apiFetch(`/tasks/${submissionId}/review`, { method: "PATCH" });
      await refreshAfterAction();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const resetSubmission = async (submissionId, internName) => {
    if (!window.confirm(`Reset ${internName}'s submission back to Pending?`)) return;

    const isPastDue = trackingTask?.deadline && new Date(trackingTask.deadline) < new Date();
    let newDeadline;
    if (isPastDue) {
      newDeadline = window.prompt(
        "This task's deadline has already passed, so the intern won't be able to resubmit until it's extended.\n" +
        "Enter a new deadline (YYYY-MM-DD):"
      );
      if (newDeadline === null) return; // admin cancelled the prompt
    }

    const comment = window.prompt(
      `Add an optional note for ${internName} about this reset (what needs fixing, why it was reset, etc.) — leave blank to skip:`
    ) || "";

    setActing(submissionId);
    try {
      await AuthService.apiFetch(`/tasks/${submissionId}/reset`, {
        method: "PATCH",
        body: JSON.stringify({
          newDeadline: newDeadline?.trim() || undefined,
          comment: comment.trim() || undefined,
        }),
      });
      await refreshAfterAction();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const handleSubmitClick = (task) => {
    if (task.status !== "pending") return;
    if (task.requiresLink === false) {
      handleSubmit(task._id, "");
      return;
    }
    setSubmitModalTask(task);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>

      <TaskHeaderBar
        isManager={isManager}
        taskCount={tasks.length}
        filter={filter}
        setFilter={setFilter}
        showForm={showForm}
        setShowForm={setShowForm}
        success={success}
      />

      {isManager && showForm && (
        <CreateTaskForm
          form={form}
          setForm={setForm}
          interns={interns}
          posting={posting}
          handleCreate={handleCreate}
          handleDomainChange={handleDomainChange}
          handleBatchChange={handleBatchChange}
          onCancel={() => { setForm(emptyForm); setShowForm(false); }}
        />
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF" }}>Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#9CA3AF" }}>
          {isManager ? "No tasks yet. Create one above." : "No tasks assigned yet."}
        </div>
      ) : (
        filtered.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            isManager={isManager}
            currentUserId={currentUserId}
            submitting={submitting}
            deleting={deleting}
            deletingTask={deletingTask}
            onSubmitClick={task.status === "pending" ? () => handleSubmitClick(task) : null}
            onWithdrawClick={handleWithdraw}
            onTrackClick={openTracking}
            onDeleteClick={handleDeleteTask}
            onEditDeadline={handleEditDeadline}
          />
        ))
      )}

      {/* Only render SubmitModal when task is pending */}
      {submitModalTask && submitModalTask.status === "pending" && (
        <SubmitModal
          task={submitModalTask}
          submitting={submitting === submitModalTask._id}
          onConfirm={(url) => handleSubmit(submitModalTask._id, url)}
          onClose={() => setSubmitModalTask(null)}
        />
      )}

      <TrackingModal
        task={trackingTask}
        rows={trackingRows}
        loading={trackingLoading}
        acting={acting}
        isHR={isHR}
        isAdmin={isAdmin}
        onForward={forwardSubmission}
        onReview={reviewSubmission}
        onReset={resetSubmission}
        onClose={closeTracking}
        comments={comments}
        commentsLoading={commentsLoading}
        postingComment={postingComment}
        onPostComment={postComment}
        currentUserId={currentUserId}
      />
    </div>
  );
}