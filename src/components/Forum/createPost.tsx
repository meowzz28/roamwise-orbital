import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  UserDetails,
  getCurrentUserDetails,
  fetchTemplate,
  addImg,
  addPost,
} from "../../services/forumService";

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
  const [images, setImages] = useState<File[]>([]);

  // Fetch user details and available templates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              // Fetch user details from Firestore
              const userData = await getCurrentUserDetails();
              setUserDetails(userData);
              // Fetch templates available to the user
              await fetchTemplate(user.uid).then((temp) => setTemplates(temp));
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

  // Handle post submission
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!topic.trim()) {
      toast.error("Topic cannot be empty", {
        position: "bottom-center",
      });
      setIsSubmitting(false);
      return;
    }

    if (!context.trim()) {
      toast.error("Content cannot be empty", {
        position: "bottom-center",
      });
      setIsSubmitting(false);
      return;
    }

    const toastId = toast.loading("Creating your post...", {
      position: "bottom-center",
    });
    try {
      const user = auth.currentUser;

      const imageURLs: string[] = [];

      if (images.length > 0) {
        for (const image of images) {
          addImg(image).then((url) => imageURLs.push(url));
        }
      }

      if (user && userDetails) {
        // Add new post to Firestore
        await addPost(
          userDetails,
          context,
          topic,
          selectedTemplateID,
          imageURLs,
          user.uid
        );
        navigate("/forum");
        toast.update(toastId, {
          render: "Post created successfully",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      toast.update(toastId, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
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
          {/* Topic input */}
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

          {/* Template selection (optional) */}
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
          {/* Image Upload */}
          <div className="mb-3">
            <label className="block mb-1 font-medium">
              Upload Image (optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                setImages((prev) => [...prev, ...selectedFiles]);
              }}
              className="form-control w-full p-2 border rounded"
            />
            {images.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-green-600">Uploaded Images:</p>
                <ul>
                  {images.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      {file?.name}
                      <button
                        onClick={() =>
                          setImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="ml-2 px-2 py-1 text-red-500 hover:text-red-700 rounded focus:outline-none"
                        aria-label={`Remove ${file.name}`}
                        title="Remove"
                      >
                        ✖
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Content textarea */}
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

          {/* Action buttons */}
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
