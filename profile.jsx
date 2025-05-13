import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDetails(docSnap.data());
          } else {
            console.log("User document does not exist.");
          }
        } catch (err) {
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
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const user = auth.currentUser;
      await deleteDoc(doc(db, "Users", user.uid));
      await user.delete();
      navigate("/login");
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

// import React, { useEffect, useState } from "react";
// import { auth, db } from "./firebase";
// import { doc, getDoc } from "firebase/firestore";
// import { useNavigate } from "react-router-dom";

// function Profile() {
// const navigate = useNavigate();
//   const [userDetails, setUserDetails] = useState(null);
// //   const [authLoading, setAuthLoading] = useState(true);
// //   const fetchUserData = async () => {
// //     auth.onAuthStateChanged(async (user) => {
// //       console.log(user);
// //       const docRef = doc(db, "Users", user.uid);
// //       const docSnap = await getDoc(docRef);
// //       if (docSnap.exists()) {
// //         setUserDetails(docSnap.data());
// //         console.log(docSnap.data());
// //       } else {
// //         console.log("User is not logged in");
// //       }
// //     });
// //   };

// const fetchUserData = () => {
//     auth.onAuthStateChanged(async (user) => {
//       if (!user) {
//         console.log("No user is logged in.");
//         setUserDetails(null);
//         return;
//       }

//       try {
//         const docRef = doc(db, "Users", user.uid);
//         const docSnap = await getDoc(docRef);
//         if (docSnap.exists()) {
//           setUserDetails(docSnap.data());
//           console.log(docSnap.data());
//         } else {
//           console.log("User document does not exist.");
//         }
//       } catch (err) {
//         console.error("Error fetching user data:", err.message);
//       }
//     });
//   };

//  useEffect(() => {
//     fetchUserData();
//   }, []);

//   async function handleLogout() {
//     try {
//       await auth.signOut();
//     //   window.location.href = "/login";
//       navigate("/login");
//       console.log("User logged out successfully!");
//     } catch (error) {
//       console.error("Error logging out:", error.message);
//     }
//   }

//   return (
//     <div>
//       {userDetails ? (
//         <>
//           <div style={{ display: "flex", justifyContent: "center" }}>
//             <img
//               src={userDetails.photo}
//               width={"40%"}
//               style={{ borderRadius: "50%" }}
//             />
//           </div>
//           <h3>Welcome to RoamWise {userDetails.firstName} </h3>
//           <div>
//             <p>Email: {userDetails.email}</p>
//             <p>First Name: {userDetails.firstName}</p>
//             <p>Last Name: {userDetails.lastName}</p>
//           </div>
//           <button className="btn btn-primary" onClick={handleLogout}>
//             Logout
//           </button>
//         </>
//       ) : (
//         <p>Loading...</p>
//       )}
//     </div>
//   );

// }
// export default Profile;
