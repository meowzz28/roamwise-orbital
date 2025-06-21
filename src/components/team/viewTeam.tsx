import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Chat from "./chat";
import TeamProfile from "./teamProfile";

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

function ViewTeam() {
  const navigate = useNavigate();
  const [uid, setUID] = useState("");
  const [team, setTeam] = useState<Team | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [authChecked, setAuthChecked] = useState(false);
  const { teamID } = useParams();

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
      setActiveTab("details");
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      try {
        if (teamID) {
          const templateDocRef = doc(db, "Team", teamID);
          onSnapshot(templateDocRef, (docSnap) => {
            if (docSnap.exists()) {
              if (!docSnap.data().user_uid.includes(user?.uid)) {
                toast.error("You are not authorized to edit this post.", {
                  position: "bottom-center",
                });
                navigate("/team");
                return;
              }
              setTeam(docSnap.data() as Team);
            } else {
              navigate("/team");
            }
          });
        }
      } catch (err) {
        console.error("Error fetching team data:", err);
      }
    };
    fetchData();
  }, [teamID]);

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
        <h1 className="text-2xl font-bold">{team?.Name}</h1>
      </div>
      <div className="row">
        <div className=" col-2 d-flex flex-column align-items-center me-4 border-end pe-3">
          <div
            className={`fs-4 fw-bold mb-4 ${
              activeTab === "details" ? "text-primary" : "text-secondary"
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("details")}
            title="details"
          >
            Team Details
          </div>
          <div
            className={`fs-4 fw-bold ${
              activeTab === "chat" ? "text-primary" : "text-secondary"
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("chat")}
            title="Chat"
          >
            Team Chat
          </div>
        </div>
        <div className="col  bg-white p-6 rounded shadow-md mb-6">
          {activeTab === "details" && (
            <div>
              <h2 className="text-center border-bottom stext-xl font-semibold mb-4">
                Team Profile
              </h2>
              <TeamProfile teamID={teamID!} team={team!} uid={uid!} />
            </div>
          )}
          {/* Chat Section */}
          {activeTab === "chat" && <Chat teamID={teamID!} />}
        </div>
      </div>
    </div>
  );
}

export default ViewTeam;
