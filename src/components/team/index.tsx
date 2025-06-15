import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import TeamCard from "./card";
import CreateNewTeam from "./createNewTeam";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NavigationBar from "../navigationbar";
import { motion } from "framer-motion";

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

type Team = {
  id: string;
  Name: string;
  admin: string[];
  admin_name: string[];
  user_email: string[];
  user_uid: string[];
  user_name: string[];
};

function Team() {
  const navigate = useNavigate();
  const [uid, setUID] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [list, setList] = useState<Team[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUID(user.uid);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          query(
            collection(db, "Team"),
            where("user_uid", "array-contains", uid)
          )
        );
        const teamData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            Name: data.Name,
            admin: data.admin || "",
            user_email: data.user_email || "",
            user_uid: data.user_uid || "",
            user_name: data.user_name || "",
          } as Team;
        });

        setList(teamData);
      } catch (err) {
        console.error("Error fetching team data:", err);
      }
    };
    fetchData();
  }, [uid]);

  const handleCreate = async (teamName: string) => {
    setIsCreating(true);
    try {
      const user = auth.currentUser;
      if (user && userDetails) {
        const newDocRef = await addDoc(collection(db, "Team"), {
          Name: teamName,
          admin: [user.uid],
          admin_name: [userDetails.firstName],
          user_email: [userDetails.email],
          user_uid: [user.uid],
          user_name: [userDetails.firstName],
          created_at: new Date(),
          created_by: user.uid,
        });

        // Update local state immediately
        const newTeam: Team = {
          id: newDocRef.id,
          Name: teamName,
          admin: [user.uid],
          admin_name: [userDetails.firstName],
          user_email: [userDetails.email],
          user_uid: [user.uid],
          user_name: [userDetails.firstName],
        };

        setList((prev) => [...prev, newTeam]);
        toast.success("Team created successfully!");
      } else {
        toast.error("Failed to create new template. Please try again.");
      }
    } catch (err: any) {
      toast.error(`Error creating template: ${err.message}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
      });
    } finally {
      setIsCreating(false);
      setShowModal(false);
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
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="mb-4 px-4 py-2 bg-green-600 font-bold  text-white rounded hover:bg-green-700"
      >
        Form New Team +
      </button>

      {list.length === 0 ? (
        <p className="text-gray-600">No team found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {list.map((teams) => (
            <motion.div
              key={teams.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <TeamCard teamName={teams.Name} teamID={teams.id} />
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateNewTeam
          show={showModal}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

export default Team;
