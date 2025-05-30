import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import UploadForm from "./gallery/uploadForm";
import NavigationBar from "./navigationbar";
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error: any) {
      console.error("Error logging out:", error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const loadingToastId = toast.loading("Deleting user's data...");
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
          position: "top-center",
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
    <div className="container bg-gray-200 p-5 rounded shadow-lg ">
      <div className="flex justify-between items-center mb-4 border-dark border-bottom">
        <h1 className="text-2xl font-bold">Profile Page</h1>
      </div>
      <div className="row">
        <div className=" col-1 d-flex flex-column align-items-center me-4 border-end pe-3">
          <div
            className={`fs-4 fw-bold mb-4 ${
              activeTab === "profile" ? "text-primary" : "text-secondary"
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("profile")}
            title="Profile"
          >
            Profile
          </div>
          <div
            className={`fs-4 fw-bold ${
              activeTab === "memories" ? "text-primary" : "text-secondary"
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("memories")}
            title="Memories"
          >
            Memory
          </div>
        </div>
        {/* User Profile Section */}

        <div className="col  bg-white p-6 rounded shadow-md mb-6">
          {activeTab === "profile" && (
            <div>
              <h2 className="text-center border-bottom stext-xl font-semibold mb-4">
                User Profile
              </h2>
              {userDetails.pic && (
                <img
                  src={userDetails.pic}
                  alt="Profile"
                  className="rounded-circle mb-3"
                  style={{ width: "60px", height: "60px", objectFit: "cover" }}
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

              <div className="mt-4">
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Memories Section */}
          {activeTab === "memories" && (
            <div>
              <h2 className="text-xl font-semibold text-center mb-4 border-bottom">
                Your Memories
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
