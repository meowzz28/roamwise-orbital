import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import UploadForm from "./Gallery/uploadForm";
import ImageGrid from "./Gallery/imageGrid";
import PopUp from "./Gallery/popUp";
import { toast } from "react-toastify";
import { User, Image, Bookmark } from "lucide-react";
import {
  getCurrentUserDetails,
  deleteCurrentUserAndData,
  getSavedPostIds,
  getForumPostData,
  UserDetails,
  ForumPost,
} from "../services/authService";

function Profile() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [savedPostData, setSavedPostData] = useState<ForumPost[]>([]);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const data = await getCurrentUserDetails();
          if (data) setUserDetails(data);
          else console.log("User document does not exist.");
        } catch (err: any) {
          console.error("Error fetching user data:", err.message);
        }
      } else {
        setUserDetails(null);
      }

      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoadingSavedPosts(true);
      const user = auth.currentUser;
      if (!user) {
        setLoadingSavedPosts(false);
        return;
      }
      const savedIds = await getSavedPostIds();
      setSavedPosts(savedIds);

      const posts = await Promise.all(
        savedIds.map((id) => getForumPostData(id))
      );
      setSavedPostData(posts);
      setLoadingSavedPosts(false);
    };

    if (activeTab === "saved") {
      fetchSaved();
    }
  }, [activeTab]);

  const confirmDelete = async () => {
    const toastId = toast.loading("Deleting user's data...", {
      position: "bottom-center",
    });
    try {
      await deleteCurrentUserAndData();
      toast.update(toastId, {
        render: `User deleted successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error delete account:", error.message);
      toast.update(toastId, {
        render: "Error delete account:" + error.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
    }
  };

  if (!authChecked) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="container text-center p-5">
        <p className="text-danger">User not logged in or user data missing.</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container bg-white p-5 rounded-2xl shadow">
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h1 className="text-2xl font-bold"> My Profile 👤</h1>
      </div>

      <div className="row">
        {/* Sidebar Tabs */}
        <div className="col-2 pe-3 border-end d-flex flex-column gap-4">
          {["profile", "memories", "saved"].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`fw-bold text-center p-2 rounded cursor-pointer transition-all ${
                activeTab === tab
                  ? "bg-primary text-white shadow"
                  : "text-secondary hover:bg-gray-200"
              }`}
            >
              {tab === "profile" && (
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <span>Profile</span>
                </div>
              )}

              {tab === "memories" && (
                <div className="flex items-center gap-2">
                  <Image size={18} />
                  <span>Memories</span>
                </div>
              )}

              {tab === "saved" && (
                <div className="flex items-center gap-2">
                  <Bookmark size={18} />
                  <span>Saved Posts</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content Section */}
        <div className="col">
          {activeTab === "profile" && (
            <div className="fade-in">
              <h2 className="text-xl font-semibold text-center flex justify-center items-center gap-2 pb-2 mb-4 border-b">
                My Profile
                <User className="w-5 h-5 text-primary" />
              </h2>

              <div className="d-flex flex-column align-items-center">
                {userDetails.pic && (
                  <img
                    src={userDetails.pic}
                    alt="Profile"
                    className="rounded-circle mb-3"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                    }}
                  />
                )}
                <p>
                  <strong>Email:</strong> {userDetails.email}
                </p>
                <p>
                  <strong>First Name:</strong> {userDetails.firstName}
                </p>
                {userDetails.lastName && (
                  <p>
                    <strong>Last Name:</strong> {userDetails.lastName}
                  </p>
                )}
                <button
                  className="btn btn-danger mt-4"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={() => !isDeleting && setIsDeleteConfirmOpen(false)}
              />
              <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <h3 className="text-lg text-red-600 font-semibold mb-2">
                  Delete Account?
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete your account? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="btn btn-secondary"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="btn btn-danger"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === "memories" && (
            <div className="fade-in">
              <h2 className="text-xl font-semibold text-center flex justify-center items-center gap-2 pb-2 mb-4 border-b">
                Your Memories
                <Image className="w-5 h-6 text-primary" />
              </h2>
              <UploadForm />
              <ImageGrid setSelectedImg={setSelectedImg} />
              {selectedImg && (
                <PopUp
                  selectedImg={selectedImg}
                  setSelectedImg={setSelectedImg}
                />
              )}
            </div>
          )}
          {activeTab === "saved" && (
            <div className="fade-in">
              <h2 className="text-xl font-semibold text-center flex justify-center items-center gap-2 pb-2 mb-4 border-b">
                Saved Posts
                <Bookmark className="w-5 h-5 text-primary" />
              </h2>
              {loadingSavedPosts ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="mt-2 text-muted">Loading saved posts...</p>
                </div>
              ) : savedPosts.length === 0 ? (
                <p className="text-gray-500 text-center">
                  You haven't saved any posts yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedPostData.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/viewPost/${post.id}`)}
                      className="p-4 bg-white rounded-lg shadow hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all"
                    >
                      {/* Owner info */}
                      <div className="flex items-center mb-2">
                        <div className="bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center text-lg font-bold me-3">
                          {post.User?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {post.User || "Unknown"}
                        </div>
                      </div>

                      {/* Topic */}
                      <h3 className="text-lg font-semibold mb-1 truncate">
                        {post.Topic || "Untitled"}
                      </h3>

                      {/* Message snippet */}
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {post.Message || "No message available."}
                      </p>

                      {/* Stats */}
                      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                        <span>{post.Likes ?? 0} likes</span>
                        <span>
                          {post.Time?.seconds
                            ? new Date(
                                post.Time.seconds * 1000
                              ).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
