import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  photo: string;
};

function CreatePost() {
  const navigate = useNavigate();
  const [context, setContext] = useState("");
  const [topic, setTopic] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; topic: string }[]>(
    []
  );
  const [selectedTemplateID, setSelectedTemplateID] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              const userDocRef = doc(db, "Users", user.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                setUserDetails(userDocSnap.data() as UserDetails);
              } else {
                setError("User document does not exist.");
              }

              const snapshot = await getDocs(collection(db, "Templates"));
              const filtered = snapshot.docs
                .filter((doc) => doc.data().userUIDs?.includes(user.uid))
                .map((doc) => ({
                  id: doc.id,
                  topic: doc.data().topic || "Untitled",
                }));
              setTemplates(filtered);
            } catch (err: any) {
              setError(`Error fetching user data: ${err.message}`);
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
  }, [navigate]);

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

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (user && userDetails) {
        const loadingToastId = toast.loading("Creating your post...", {
          position: "bottom-center",
        });

        await addDoc(collection(db, "Forum"), {
          User: userDetails.firstName,
          UID: user.uid,
          Message: context,
          Topic: topic,
          TemplateID: selectedTemplateID || null,
          Likes: 0,
          LikedBy: [],
          Time: serverTimestamp(),
        });

        toast.update(loadingToastId, {
          render: "Post created successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          position: "bottom-center",
        });

        navigate("/forum");
      } else {
        toast.error("Something went wrong. Please try again.", {
          position: "bottom-center",
        });
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message, {
        position: "bottom-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/forum");
  };

  if (loading) {
    return (
      <div className="container text-center p-5">
        <p>Loading...</p>
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

  return (
    <div className="container bg-gray-200 p-5 rounded shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Create New Post</h1>
        <button className="btn btn-outline-primary" onClick={handleBack}>
          Back to Forum
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow-md mb-4">
        <form onSubmit={handlePost}>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Topic</label>
            <input
              type="text"
              className="form-control w-full p-2 border rounded"
              placeholder="Enter an interesting topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
            <p className="text-gray-500 text-sm mt-1">
              Choose a clear, specific topic for your post
            </p>
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">
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

          <div className="mb-3">
            <label className="block mb-1 font-medium">Content</label>
            <textarea
              className="form-control w-full p-2 border rounded"
              placeholder="Share your thoughts, questions, or ideas..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={6}
              required
            />
          </div>

          <div className="flex justify-between mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleBack}
            >
              Cancel
            </button>
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
                  Creating Post...
                </>
              ) : (
                "Create Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;
