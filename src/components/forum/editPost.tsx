import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  collection,
  serverTimestamp,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

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
  Likes: number;
  LikedBy: string[];
  Message: string;
  TemplateID?: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
};

function EditPost() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [UID, setUID] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplateID, setSelectedTemplateID] = useState<string>("");
  const [templates, setTemplates] = useState<{ id: string; topic: string }[]>(
    []
  );

  // Fetch user and post data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              // Fetch user details
              const userDocRef = doc(db, "Users", user.uid);
              setUID(user.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                setUserDetails(userDocSnap.data() as UserDetails);
              } else {
                setError("User document does not exist.");
              }

              // Fetch post data if postId is present
              if (postId) {
                const postDocRef = doc(db, "Forum", postId);
                const postDocSnap = await getDoc(postDocRef);

                if (postDocSnap.exists()) {
                  const data = postDocSnap.data();
                  // Only allow editing if user is the author
                  if (data.UID !== user.uid) {
                    toast.error("You are not authorized to edit this post.", {
                      position: "bottom-center",
                    });
                    navigate("/forum");
                    return;
                  }
                  setPost({
                    id: postId,
                    UID: data.UID,
                    User: data.User || "",
                    Topic: data.Topic || "",
                    Message: data.Message || "",
                    LikedBy: data.LikedBy || [],
                    Likes: data.Likes || 0,
                    Time: data.Time,
                    TemplateID: data.TemplateID || "",
                  });

                  setTopic(data.Topic || "");
                  setContext(data.Message || "");
                  setSelectedTemplateID(data.TemplateID);

                  // Fetch templates available to the user
                  const snapshot = await getDocs(collection(db, "Templates"));
                  const filtered = snapshot.docs
                    .filter((doc) => doc.data().userUIDs?.includes(user.uid))
                    .map((doc) => ({
                      id: doc.id,
                      topic: doc.data().topic || "Untitled",
                    }));
                  setTemplates(filtered);
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

  // Handle post update submission
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast.error("Topic cannot be empty", {
        position: "bottom-center",
      });
      return;
    }

    if (!context.trim()) {
      toast.error("Content cannot be empty", {
        position: "bottom-center",
      });
      return;
    }

    if (!postId) {
      toast.error("Post ID is missing", {
        position: "bottom-center",
      });
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Editing your post...", {
      position: "bottom-center",
    });
    try {
      const user = auth.currentUser;
      if (user && userDetails && postId) {
        // Update post in Firestore
        await updateDoc(doc(db, "Forum", postId), {
          User: userDetails.firstName,
          UID: user.uid,
          Message: context,
          Topic: topic,
          Time: serverTimestamp(),
          TemplateID: selectedTemplateID || null,
        });

        toast.update(toastId, {
          render: "Post updated successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          position: "bottom-center",
        });

        navigate(`/viewPost/${postId}`);
      } else {
        toast.update(toastId, {
          render: "Something went wrong. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
          position: "bottom-center",
        });
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.update(toastId, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/forum`);
  };

  const handleView = (postId: string) => {
    navigate(`/viewPost/${postId}`);
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
        <button className="btn btn-primary mt-3" onClick={() => handleBack}>
          Back to Post
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
    <div className="container bg-gray-200 p-5 rounded shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <button className="btn btn-outline-primary" onClick={handleBack}>
          Back to Forum
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow-md mb-4">
        <form onSubmit={handlePost}>
          {/* Topic input */}
          <div className="mb-3">
            <label htmlFor="topic" className="block mb-1 font-medium">
              Topic
            </label>
            <input
              type="text"
              className="form-control w-full p-2 border rounded"
              value={topic}
              placeholder="Enter an interesting topic..."
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          {/* Template selection (optional) */}
          <div className="mb-3">
            <label className="block font-semibold mb-1">
              Trip Template (optional)
            </label>
            <select
              className="form-control w-full p-2 border rounded"
              value={selectedTemplateID}
              onChange={(e) => setSelectedTemplateID(e.target.value)}
            >
              <option value="">-- Select a template --</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.topic}
                </option>
              ))}
            </select>
          </div>
          {/* Content textarea */}
          <div className="mb-3">
            <label htmlFor="context" className="block mb-1 font-medium">
              Context
            </label>
            <textarea
              className="form-control w-full p-2 border rounded"
              value={context}
              placeholder="Share your thoughts, questions, or ideas..."
              onChange={(e) => setContext(e.target.value)}
              required
            />
          </div>
          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Updating Post...
              </>
            ) : (
              "Update Post"
            )}
          </button>
        </form>
      </div>
      {/* Cancel button */}
      <button
        className="btn btn-outline-secondary"
        onClick={() => handleView(post.id)}
      >
        Cancel
      </button>
    </div>
  );
}

export default EditPost;
