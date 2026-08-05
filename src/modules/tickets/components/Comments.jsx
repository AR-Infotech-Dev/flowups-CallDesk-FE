import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, AtSign, Paperclip, Pencil, Smile, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { makeRequest } from "../../../api/httpClient";
import ProfileAvatar from "../../../components/ui/ProfileAvatar";
import { formatRelativeTime } from "../../../utils/common";

const DEFAULT_ENDPOINTS = {
  list: "comments",
  create: "comments/create",
  update: "comments",
  delete: "comments/delete",
};

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function getPlainComment(value = "") {
  return stripHtml(value).replace(/\s+/g, " ");
}

function getCommentId(comment = {}) {
  return comment.comment_id || comment.commentID || comment.id || comment._id || comment.key;
}

function getCommentText(comment = {}) {
  return comment.comment || comment.description || comment.text || comment.message || "";
}

function sanitizeCommentHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\son\w+=\S+/gi, "");
}

function normalizeComments(rows = []) {
  return rows.map((item, index) => ({
    ...item,
    key: getCommentId(item) || `comment-${index}`,
    id: getCommentId(item),
    text: sanitizeCommentHtml(getCommentText(item)),
    author:
      item.author ||
      item.created_by_name ||
      item.user_name ||
      item.user?.name ||
      item.created_by?.name ||
      item.name ||
      "User",
    image:
      item.profile_image ||
      item.user?.profile_image ||
      item.created_by?.profile_image ||
      item.profile ||
      item.avatar ||
      item.image ||
      item.photo ||
      "",
    meta: item.meta || item.created_date || item.created_at || item.modified_date || item.updated_at || "",
  }));
}

function Comments({ COMMENTS = [], module = "tickets", ticket_id, module_id, endpoints = DEFAULT_ENDPOINTS,}) {
  const user_id = localStorage.getItem("_auth_id")
  const resolvedId = ticket_id || module_id;
  const api = { ...DEFAULT_ENDPOINTS, ...endpoints };

  const [comments, setComments] = useState(() => normalizeComments(COMMENTS));
  const [commentValue, setCommentValue] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});

  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortOrder === "asc") return list;
    return list.reverse();
  }, [comments, sortOrder]);

  const fetchComments = async () => {
    if (!resolvedId) {
      setComments(normalizeComments(COMMENTS));
      return;
    }
    try {
      setLoading(true);
      const res = await makeRequest(api.list, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          order_by: 'created_date',
          order: 'DESC',
          user_id: user_id,
          module_id: resolvedId,
          ticket_id: resolvedId,
          getAll: "Y",
        }),
      });

      if (res?.success) {
        setComments(normalizeComments(res.data || []));
        return;
      }

      setComments([]);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [resolvedId, module]);

  const resetEditor = () => {
    setEditingComment(null);
    setCommentValue("");
  };

  const handleEditorChange = (event) => {
    setCommentValue(event.target.value);
  };

  const handleEdit = (comment) => {
    setEditingComment(comment);
    setCommentValue(comment.comment_text || "");
  };

  const toggleExpanded = (commentId) => {
    setExpandedComments((current) => ({
      ...current,
      [commentId]: !current[commentId],
    }));
  };

  const handleSave = async () => {
    if (!resolvedId) {
      toast.error("Ticket id not found");
      return;
    }

    if (!stripHtml(commentValue)) {
      toast.error("Please enter comment");
      return;
    }

    const commentId = editingComment?.id;
    const isEdit = Boolean(commentId);

    try {
      setSaving(true);
      const res = await makeRequest(isEdit ? `${api.update}/${commentId}` : api.create, {
        method: isEdit ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          module_id: resolvedId,
          ticket_id: resolvedId,
          record_type: "ticket",
          comment: commentValue,
          status: "active",
        }),
      });

      if (res?.success) {
        resetEditor();
        await fetchComments();
        return;
      }
      toast.error(res?.message || res?.msg || "Unable to save comment");
    } catch (error) {
      toast.error(error.message || "Unable to save comment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (comment) => {
    const commentId = comment.id;
    if (!commentId) {
      toast.error("Comment id not found");
      return;
    }

    try {
      setDeletingId(commentId);
      const res = await makeRequest(api.delete, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          ids: [commentId],
          id: commentId,
          comment_id: commentId,
          module,
          module_id: resolvedId,
          ticket_id: resolvedId,
        }),
      });

      if (res?.success) {
        setComments((current) => current.filter((item) => item.id !== commentId));
        if (editingComment?.id === commentId) resetEditor();
        return;
      }

      toast.error(res?.message || res?.msg || "Unable to delete comment");
    } catch (error) {
      toast.error(error.message || "Unable to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <h3>All Comments ({comments.length})</h3>
          <button
            type="button"
            onClick={() => setSortOrder((current) => (current === "asc" ? "desc" : "asc"))}
            className="flex items-center gap-1 hover:text-slate-800"
          >
            <span>{sortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
            {sortOrder === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-2 pb-40">
        {loading ? (
          <div className="rounded-sm border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-500">
            Loading comments...
          </div>
        ) : null}

        {!loading && sortedComments.length === 0 ? (
          <div className="rounded-sm border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
            No comments yet
          </div>
        ) : null}

        {sortedComments.map((item) => {
          const isEditing = editingComment?.id === item.id;
          const commentHtml = item.comment_text || item.text || "";
          const plainText = getPlainComment(commentHtml);
          const isLongComment = plainText.length > 60;
          const isExpanded = Boolean(expandedComments[item.id]);
          const previewText = isLongComment && !isExpanded ? plainText.slice(0, 60).trimEnd() : plainText;

          return (
            <article key={item.key} className="bg-transparent">
              {console.log(item)}
              <div className="flex items-start gap-3">
                <div className={`group min-w-0 flex-1 border border-slate-300 rounded-sm bg-white px-1 py-1 ${user_id == item.user_id ? "border-l-4 border-l-blue-400" : "rounded-l-md border-l-4 border-l-orange-400"}`}>
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex gap-2 items-center justify-center px-1 py-0">
                      <ProfileAvatar size={21} name={item.author} image={item.image} className="ring-0" />
                      <h4 className="truncate text-sm font-bold leading-none text-slate-600">{item.author}</h4>
                    </div>
                    {item.meta ? (
                      <span className="shrink-0 text-xs font-medium leading-none text-slate-400">
                        {formatRelativeTime(item.meta) || item.meta}
                      </span>
                    ) : null}
                    {isEditing ? (
                      <span className="rounded-sm bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
                        Editing
                      </span>
                    ) : null}
                    {!isEditing ? (
                      <div className="ml-auto hidden items-center gap-2 group-hover:flex">
                        {console.log(user_id, item.user_id)}
                        {user_id == item.user_id &&
                          <><button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="text-slate-400 hover:text-blue-600"
                            aria-label="Edit comment"
                          >
                            <Pencil size={13} />
                          </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label="Delete comment"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        }
                      </div>
                    ) : null}
                  </div>
                  {isEditing ? (
                    <div className="mt-1 ml-7">
                      <textarea
                        value={commentValue}
                        onChange={(event) => setCommentValue(event.target.value)}
                        placeholder="Write a comment, use @ to mention someone..."
                        className="min-h-[84px] w-full resize-none rounded-md shadow-inner bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300"
                      />
                      <div className="mt-0 flex items-center justify-end">
                        {/* <div className="flex items-center gap-4 text-slate-500">
                          <button type="button" className="hover:text-blue-600" aria-label="Mention">
                            <AtSign size={15} />
                          </button>
                          <button type="button" className="hover:text-blue-600" aria-label="Attach file">
                            <Paperclip size={15} />
                          </button>
                          <button type="button" className="hover:text-blue-600" aria-label="Emoji">
                            <Smile size={15} />
                          </button>
                        </div> */}
                        <div className="flex items-center ">
                          <button type="button" onClick={handleSave} disabled={saving || !stripHtml(commentValue)} className="rounded-md bg-blue-700 px-2 py-0.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300" >{saving ? "Saving..." : "Save"}</button>
                          <button type="button" onClick={resetEditor} disabled={saving} className="px-2 py-0 text-xs font-extralight text-slate-600 disabled:cursor-not-allowed disabled:opacity-60" >Cancel</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`mt-1 ml-7 rounded-md inset-1 px-1 py-3 shadow-inner `}>
                      <div className="comment-content text-xs leading-6 text-slate-600">
                        {isExpanded ? (
                          <span dangerouslySetInnerHTML={{ __html: commentHtml }} />
                        ) : (
                          <span>{previewText}</span>
                        )}
                        {isLongComment ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.id)}
                            className="ml-1 font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {isExpanded ? "less" : "... more"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-10 -mx-2 bg-slate-50/95 px-2 pb-2 pt-3 backdrop-blur">
        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <textarea
            value={editingComment ? "" : commentValue}
            onChange={(event) => {
              setEditingComment(null);
              setCommentValue(event.target.value);
            }}
            placeholder="Write a comment, use @ to mention someone..."
            className="min-h-[84px] w-full resize-none rounded-t-md border-0 px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
          <div className="flex items-center justify-between rounded-b-md bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-4 text-slate-500">
              <button type="button" className="hover:text-blue-600" aria-label="Mention">
                <AtSign size={15} />
              </button>
              <button type="button" className="hover:text-blue-600" aria-label="Attach file">
                <Paperclip size={15} />
              </button>
              <button type="button" className="hover:text-blue-600" aria-label="Emoji">
                <Smile size={15} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !stripHtml(commentValue)}
              className="rounded-md bg-blue-700 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {saving ? "Posting..." : "Post >"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Comments;
