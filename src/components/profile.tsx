import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  photo: string;
};

function Profile() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

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
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, "Users", user.uid));
        await user.delete();
        navigate("/login");
      } else {
        console.error("No user is currently logged in.");
      }
    } catch (error) {
      console.error("Error delete account:", error.message);
    }
  };

  if (!authChecked) {
    return <p>Loading...</p>;
  }

  if (!userDetails) {
    return <p>User not logged in or user data missing.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img
          src={userDetails.photo}
          width={"40%"}
          style={{ borderRadius: "50%" }}
        />
      </div>
      <h3>Welcome to RoamWise</h3>
      <div>
        <p>Email: {userDetails.email}</p>
        <p>First Name: {userDetails.firstName}</p>
        {/* <p>Last Name: {userDetails.lastName}</p> */}
      </div>
      <div className="mb-2">
        <button className="btn btn-primary" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div>
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Profile;
