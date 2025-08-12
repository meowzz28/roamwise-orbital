import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import {
  Props,
  SubComment,
  addSubComment,
  deleteSubComment,
  fetchSubComments,
  getCurrentUserDetails,
} from "../../services/forumService";

function ForumSubComment({ postId, parentId }: Props) {
  const [reply, setReply] = useState("");
  const [subComments, setSubComments] = useState<SubComment[]>([]);
  const [UID, setUID] = useState("");
  const [userName, setUserName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subCommentToDelete, setSubCommentToDelete] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Get current user info and fetch subcomments on mount
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUID(user.uid);
        const userData = await getCurrentUserDetails();
        if (userData) {
          setUserName(userData.firstName);
        } else {
          setUserName("Anonymous");
        }
      }
    });
    fetchSubComments(postId, parentId, setSubComments);
    return () => unsubscribe();
  }, []);

  // Handle reply submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const toastId = toast.loading("Replying...", {
        position: "bottom-center",
      });
      await addSubComment(userName, UID, reply, postId, parentId);

      toast.update(toastId, {
        render: "Reply posted",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setReply("");
      fetchSubComments(postId, parentId, setSubComments);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle subcomment deletion
  const handleDelete = async (id: string) => {
    try {
      const toastId = toast.loading("Deleting...", {
        position: "bottom-center",
      });
      await deleteSubComment(id);
      toast.update(toastId, {
        render: "Reply deleted",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchSubComments(postId, parentId, setSubComments);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="ml-4 mt-2">
      {/* Render all subcomments */}
      {subComments.map((subComment) => (
        <div
          key={subComment.id}
          className="border border-gray-300 p-2 mt-2 rounded"
        >
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium">
              {subComment.User}
              <span className="text-gray-500 text-xs ml-6">
                {" Replied at : ("}
                {subComment.Time?.seconds
                  ? new Date(subComment.Time.seconds * 1000).toLocaleString()
                  : "N/A"}{" "}
                {")"}
              </span>
            </p>
            {/* Show delete button if user is the author */}
            {UID === subComment.UID && (
              <button
                className="p-1 text-red-500 text-sm"
                onClick={() => {
                  setSubCommentToDelete(subComment.id);
                  setShowDeleteConfirm(true);
                }}
              >
                Delete
              </button>
            )}
          </div>

          <p>{subComment.Message}</p>
        </div>
      ))}

      {/* Reply input form */}
      <form onSubmit={handleSubmit} className="mt-2">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="w-full border p-1 rounded"
          placeholder="Write a reply..."
        />
        <button type="submit" className="btn btn-sm btn-secondary mt-1">
          Reply
        </button>
      </form>
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              setShowDeleteConfirm(false);
              setSubCommentToDelete(null);
            }}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2 text-red-600">
              Delete Reply?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this reply? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSubCommentToDelete(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (subCommentToDelete) handleDelete(subCommentToDelete);
                  setShowDeleteConfirm(false);
                  setSubCommentToDelete(null);
                }}
                className=" btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForumSubComment;
