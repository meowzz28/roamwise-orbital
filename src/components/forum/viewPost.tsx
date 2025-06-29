import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ViewTrip from "./ForumViewTrip";
import ForumSubComment from "./forumSubComment";

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  photo: string;
};

type ForumPost = {
  id: string;
  UID: string;
  User: string;
  Topic: string;
  Message: string;
  Likes: number;
  LikedBy: string[];
  Time?: {
    seconds: number;
    nanoseconds: number;
  };

  TemplateID: string;
};

type Comment = {
  id: string;
  UID: string;
  User: string;
  Message: string;
  PostId: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
};

function ViewPost() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [UID, setUID] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletCommentConfirm, setShowDeletCommentConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              const userDocRef = doc(db, "Users", user.uid);
              setUID(user.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                setUserDetails(userDocSnap.data() as UserDetails);
              } else {
                setError("User document does not exist.");
              }
              if (postId) {
                const postDocRef = doc(db, "Forum", postId);
                const postDocSnap = await getDoc(postDocRef);

                if (postDocSnap.exists()) {
                  const data = postDocSnap.data();
                  setPost({
                    id: postId,
                    UID: data.UID,
                    User: data.User || "",
                    Topic: data.Topic || "",
                    Message: data.Message || "",
                    Likes: data.Likes || 0,
                    LikedBy: data.LikedBy || [],
                    Time: data.Time,
                    TemplateID: data.TemplateID,
                  });
                  setIsLiked(data.LikedBy?.includes(user.uid) || false);
                  await fetchComments();
                } else {
                  setError("Post not found.");
                }
              } else {
                setError("Post ID is missing.");
              }
            } catch (err: any) {
              setError(`Error fetching data: ${err.message}`);
              console.error("Error:", err);
            }
          } else {
            setError("User not logged in.");
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          }
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (err: any) {
        setError(`Error: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, navigate]);

  const fetchComments = async () => {
    if (!postId) return;

    try {
      setCommentsLoading(true);
      const commentsQuery = query(
        collection(db, "ForumComment"),
        where("PostId", "==", postId)
      );

      const querySnapshot = await getDocs(commentsQuery);
      const commentsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          UID: data.UID,
          User: data.User || "",
          Message: data.Message || "",
          PostId: data.PostId || "",
          Time: data.Time,
        } as Comment;
      });

      commentsData.sort((a, b) => {
        const timeA = a.Time?.seconds || 0;
        const timeB = b.Time?.seconds || 0;
        return timeB - timeA;
      });

      setComments(commentsData);
    } catch (err: any) {
      console.error("Error fetching comments:", err);
      toast.error(`Error loading comments: ${err.message}`, {
        position: "bottom-center",
      });
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!postId) {
      toast.error("Post ID is missing.", {
        position: "bottom-center",
      });
      return;
    }
    setIsDeleting(true);
    const toastId = toast.loading("Deleting post and comments...", {
      position: "bottom-center",
    });
    try {
      const commentsQuery = query(
        collection(db, "ForumComment"),
        where("PostId", "==", postId)
      );

      const commentsSnapshot = await getDocs(commentsQuery);

      const commentDeletionPromises = commentsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(commentDeletionPromises);

      await deleteDoc(doc(db, "Forum", postId));

      toast.update(toastId, {
        render: `Post deleted successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });

      navigate("/forum");
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.update(toastId, {
        render: `Error: ${error.message}`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Comment cannot be empty", {
        position: "bottom-center",
      });
      return;
    }
    const toastId = toast.loading("Posting comment...", {
      position: "bottom-center",
    });
    try {
      const user = auth.currentUser;
      if (user && userDetails && postId) {
        await addDoc(collection(db, "ForumComment"), {
          User: userDetails.firstName,
          UID: user.uid,
          Message: comment,
          PostId: postId,
          Time: serverTimestamp(),
        });

        toast.update(toastId, {
          render: "Comment posted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        setComment("");
        fetchComments();
      } else {
        toast.update(toastId, {
          render: "Something went wrong. Please try again.",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          position: "bottom-center",
        });
      }
    } catch (error: any) {
      console.error("Error posting comment:", error);
      toast.update(toastId, {
        render: error.message,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const toastId = toast.loading("Deleting comment...", {
      position: "bottom-center",
    });
    try {
      setIsDeletingComment(true);
      await deleteDoc(doc(db, "ForumComment", commentId));
      const subCommentsQuery = query(
        collection(db, "ForumSubComment"),
        where("ParentCommentId", "==", commentId)
      );
      const subCommentsSnapshot = await getDocs(subCommentsQuery);
      const subDeletePromises = subCommentsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(subDeletePromises);

      toast.update(toastId, {
        render: "Comment deleted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setShowDeletCommentConfirm(false);
      setCommentToDelete(null);

      fetchComments();
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast.update(toastId, {
        render: error.message,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleBack = () => {
    navigate("/forum");
  };

  const handleEdit = (postId: string) => {
    navigate(`/editPost/${postId}`);
  };

  const handleLike = async () => {
    if (!postId || !UID) {
      return;
    }
    const postRef = doc(db, "Forum", postId);
    try {
      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw new Error("Post does not exist.");
        }

        const likedBy = postDoc.data().LikedBy || [];
        const isCurrentlyLiked = likedBy.includes(UID);
        const newLikes = isCurrentlyLiked
          ? postDoc.data().Likes - 1
          : postDoc.data().Likes + 1;

        const updatedLikedBy = isCurrentlyLiked
          ? likedBy.filter((id: string) => id !== UID)
          : [...likedBy, UID];

        transaction.update(postRef, {
          Likes: newLikes,
          LikedBy: updatedLikedBy,
        });
        setPost({
          ...(post as ForumPost),
          Likes: newLikes,
          LikedBy: updatedLikedBy,
        });
        setIsLiked(!isCurrentlyLiked);
      });
    } catch (error: any) {
      toast.error(`Error liking post: ${error.message}`, {
        position: "bottom-center",
      });
    }
  };

  if (loading) {
    return (
      <div className="container text-center p-5">
        <p>Loading post...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container text-center p-5">
        <p className="text-red-500">{error}</p>
        <button className="btn btn-primary mt-3" onClick={handleBack}>
          Back to Forum
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container text-center p-5">
        <p>Post not found.</p>
        <button className="btn btn-primary mt-3" onClick={handleBack}>
          Back to Forum
        </button>
      </div>
    );
  }

  return (
    <div className="container bg-gray-200 p-5 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Forum Post Details</h1>
        <button className="btn btn-outline-primary" onClick={handleBack}>
          Back to Forum
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow-md mb-4">
        <div>
          <div className="flex justify-between mb-2">
            <h2 className="text-xl font-semibold mb-2">{post.Topic}</h2>
            <span>
              Last update:{" "}
              {post.Time?.seconds
                ? new Date(post.Time.seconds * 1000).toLocaleString()
                : "N/A"}
            </span>
          </div>
          <div className="flex justify-between text-gray-600 text-sm mb-3">
            <span>Posted by: {post.User}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`btn ${
                  isLiked ? "btn-primary" : "btn-outline-primary"
                }`}
              >
                {isLiked ? "Likes: " + post.Likes : "Likes: " + post.Likes}
              </button>
            </div>
          </div>

          {post.TemplateID ? (
            <div className="mb-4">
              <ViewTrip templateID={post.TemplateID} />
            </div>
          ) : null}

          <div className="post-content whitespace-pre-wrap">{post.Message}</div>
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2 text-red-600">
              Delete Post?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this post? This action is
              irreversible and will also remove all related comments.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : null}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {UID === post.UID && (
        <div className="mb-4 flex gap-3 justify-content-end">
          <button
            className="btn btn-info text-white "
            onClick={() => handleEdit(post.id)}
          >
            Edit Post
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Post
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded shadow-md mb-4">
        <h3 className="text-lg font-semibold mb-3">Comments</h3>

        <div className="space-y-3 mb-4">
          <form onSubmit={handleCommentSubmit}>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Add a comment</label>
              <textarea
                className="form-control w-full p-2 border rounded"
                placeholder="Write your comment here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!comment.trim()}
            >
              Post Comment
            </button>
          </form>
          {commentsLoading ? (
            <p>Loading comments...</p>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-100 p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{comment.User}</p>
                    <p className="text-gray-500 text-xs">
                      {comment.Time?.seconds
                        ? new Date(comment.Time.seconds * 1000).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  {UID === comment.UID && (
                    <button
                      className="text-red-500 text-sm"
                      onClick={() => {
                        setCommentToDelete(comment.id);
                        setShowDeletCommentConfirm(true);
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : null}
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
                <p className="mt-2">{comment.Message}</p>
                <ForumSubComment postId={postId!} parentId={comment.id} />
              </div>
            ))
          ) : (
            <p className="text-gray-500">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
      {showDeletCommentConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              setShowDeletCommentConfirm(false);
              setCommentToDelete(null);
            }}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2 text-red-600">
              Delete Comment?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this comment? This action is
              irreversible and will also remove all related sub-comments.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeletCommentConfirm(false);
                  setCommentToDelete(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (commentToDelete) handleDeleteComment(commentToDelete);
                }}
                className="btn btn-danger"
                disabled={isDeletingComment}
              >
                {isDeletingComment ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : null}
                {isDeletingComment ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewPost;
