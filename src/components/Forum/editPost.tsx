import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCurrentUserDetails,
  UserDetails,
  ForumPostType as ForumPost,
  fetchEditPost,
  fetchTemplate,
  updatePost,
} from "../../services/forumService";

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);

  // Fetch user and post data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              // Fetch user details
              setUID(user.uid);
              const userData = await getCurrentUserDetails();
              setUserDetails(userData);

              // Fetch post data if postId is present
              if (postId) {
                const postDocSnap = await fetchEditPost(postId);
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
                    SavedBy: data.SavedBy || [],
                    Saves: data.saves || 0,
                    Time: data.Time,
                    TemplateID: data.TemplateID || "",
                    imageUrls: data.ImageURLs,
                  });

                  setTopic(data.Topic || "");
                  setContext(data.Message || "");
                  setSelectedTemplateID(data.TemplateID);
                  setImageUrls(data.ImageURLs || []);
                  // Fetch templates available to the user
                  fetchTemplate(UID).then((data) => setTemplates(data));
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
        updatePost(
          images,
          imageUrls,
          postId,
          userDetails,
          UID,
          context,
          topic,
          selectedTemplateID
        );

        setImages([]);
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePost(e);
          }}
        >
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
          {/* Existing image preview */}
          {imageUrls.length > 0 && (
            <div className="mb-3">
              <label className="block font-medium mb-1">Existing Images</label>
              <div className="flex flex-wrap gap-3">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24">
                    <img
                      src={url}
                      alt={`Uploaded ${idx}`}
                      className="object-cover rounded w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrls((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New image upload */}
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
