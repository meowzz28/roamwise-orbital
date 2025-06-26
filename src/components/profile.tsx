import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import UploadForm from "./gallery/uploadForm";
import ImageGrid from "./gallery/imageGrid";
import PopUp from "./gallery/popUp";
import { ref, deleteObject, listAll } from "firebase/storage";
import { storage } from "./firebase";
import { toast } from "react-toastify";

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

function Profile() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDetails(docSnap.data() as UserDetails);
          } else {
            console.log("User document does not exist.");
          }
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

  const confirmDelete = async () => {
    try {
      const loadingToastId = toast.loading("Deleting user's data...", {
        position: "bottom-center",
      });
      const user = auth.currentUser;
      if (user) {
        const folderRef = ref(storage, `images/${user.uid}`);
        const listResult = await listAll(folderRef);
        const deletePromises = listResult.items.map((fileRef) =>
          deleteObject(fileRef)
        );
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, "Users", user.uid));
        await user.delete();
        toast.update(loadingToastId, {
          render: `User deleted successfully!`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
          position: "bottom-center",
        });
        navigate("/login");
      } else {
        console.error("No user is currently logged in.");
      }
    } catch (error) {
      console.error("Error delete account:", error.message);
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
          {["profile", "memories"].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`fw-bold text-center p-2 rounded cursor-pointer transition-all ${
                activeTab === tab
                  ? "bg-primary text-white shadow"
                  : "text-secondary hover:bg-gray-200"
              }`}
              style={{ cursor: "pointer" }}
            >
              {tab === "profile" ? "Profile 👤" : "Memories 📸 "}
            </div>
          ))}
        </div>

        {/* Content Section */}
        <div className="col">
          {activeTab === "profile" && (
            <div className="fade-in">
              <h2 className="text-xl font-semibold text-center border-bottom pb-2 mb-4">
                My Profile👤
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
              <h2 className="text-xl font-semibold text-center border-bottom pb-2 mb-4">
                Your Memories📸
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
        </div>
      </div>
    </div>
  );
}

export default Profile;
