import React, { useEffect, useState } from "react";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { toast } from "react-toastify";

type Props = {
  postId: string;
  parentId: string;
};

type SubComment = {
  id: string;
  UID: string;
  User: string;
  Message: string;
  PostId: string;
  ParentCommentId: string;
  Time?: { seconds: number; nanoseconds: number };
};

function ForumSubComment({ postId, parentId }: Props) {
  const [reply, setReply] = useState("");
  const [subComments, setSubComments] = useState<SubComment[]>([]);
  const [UID, setUID] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUID(user.uid);
        const userDoc = await getDocs(
          query(collection(db, "Users"), where("email", "==", user.email))
        );
        userDoc.forEach((doc) => {
          const data = doc.data();
          setUserName(data.firstName || "Anonymous");
        });
      }
    });

    fetchSubComments();

    return () => unsubscribe();
  }, []);

  const fetchSubComments = async () => {
    const q = query(
      collection(db, "ForumSubComment"),
      where("PostId", "==", postId),
      where("ParentCommentId", "==", parentId)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SubComment[];

    setSubComments(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, "ForumSubComment"), {
        User: userName,
        UID: UID,
        Message: reply,
        PostId: postId,
        ParentCommentId: parentId,
        Time: serverTimestamp(),
      });
      toast.success("Reply posted.");
      setReply("");
      fetchSubComments();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "ForumSubComment", id));
      toast.success("Reply deleted.");
      fetchSubComments();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="ml-4 mt-2">
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
            {UID === subComment.UID && (
              <button
                className="text-xs text-red-400"
                onClick={() => handleDelete(subComment.id)}
              >
                Delete
              </button>
            )}
          </div>

          <p>{subComment.Message}</p>
        </div>
      ))}

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
    </div>
  );
}

export default ForumSubComment;
