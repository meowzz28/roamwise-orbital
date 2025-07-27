import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import CreateNewTeam from "./createNewTeam";
import Chat from "./chat";
import TeamProfile from "./teamProfile";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamID, setSelectedTeamID] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const filteredList = list.filter((team) =>
    team.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedTeam = list.find((team) => team.id === selectedTeamID);

  // Handle Firebase auth state and fetch user details
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

  // Fetch user's teams after UID is set
  useEffect(() => {
    if (uid) fetchTeamList();
  }, [uid]);

  // Retrieve list of teams user belongs to
  const fetchTeamList = async () => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, "Team"),
          where("user_uid", "array-contains", uid),
          orderBy("created_at", "desc")
        )
      );
      const teamData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          Name: data.Name,
          admin: data.admin || [],
          admin_name: data.admin_name || [],
          user_email: data.user_email || [],
          user_uid: data.user_uid || [],
          user_name: data.user_name || [],
        } as Team;
      });

      setList(teamData);
    } catch (err) {
      console.error("Error fetching team data:", err);
    }
  };

  // Create a new team document in Firestore
  const handleCreate = async (teamName: string) => {
    setIsCreating(true);
    const toastId = toast.loading("Creating team...", {
      position: "bottom-center",
    });
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

        const newTeam: Team = {
          id: newDocRef.id,
          Name: teamName,
          admin: [user.uid],
          admin_name: [userDetails.firstName],
          user_email: [userDetails.email],
          user_uid: [user.uid],
          user_name: [userDetails.firstName],
        };

        setList((prev) => [newTeam, ...prev]);

        toast.update(toastId, {
          render: "Team created successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        setShowModal(false);
      } else {
        toast.update(toastId, {
          render: "Failed to create new template. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (err: any) {
      toast.update(toastId, {
        render: `Error creating template: ${err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsCreating(false);
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
    <div className="container flex flex-col bg-white rounded-2xl shadow-sm border  p-4  h-[calc(100vh-80px)]">
      <div className="flex h-full border">
        {/* LEFT PANEL */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-4 border-b ">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-gray-800 text-center">
              Groups 👥
            </h1>
            <div className="row">
              <input
                type="text"
                placeholder="Search team..."
                className="col-6 m-2 px-3 py-2 border border-dark rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => setShowModal(true)}
                className="col-5 m-2 px-3 py-2 btn btn-outline-success "
              >
                Form New Group
              </button>
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredList.length === 0 ? (
              <p className="text-gray-500">No groups found.</p>
            ) : (
              filteredList.map((team) => (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeamID(team.id)}
                  className={`cursor-pointer px-4 py-3 rounded border transition 
              ${
                selectedTeamID === team.id
                  ? "bg-blue-100 border-blue-500 font-semibold"
                  : "bg-white hover:bg-gray-100 border-gray-300"
              }`}
                >
                  {team.Name}
                </div>
              ))
            )}
          </div>
        </div>
        {/* RIGHT PANEL: Team Chat and Details */}
        <div className="w-2/3 p-4 flex flex-col h-full">
          {selectedTeamID && selectedTeam && (
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedTeam.Name}
              </h2>
              <button
                onClick={() => setShowProfile((prev) => !prev)}
                className="btn btn-primary text-xl font-semibold  hover:underline"
              >
                {showProfile ? "Manage Team ▲" : "Manage Team ▼"}
              </button>
            </div>
          )}

          {showProfile && selectedTeamID && selectedTeam && (
            <div
              className={`transition-all duration-500 ease-in-out transform ${
                showProfile
                  ? "max-h-[1000px] opacity-100 scale-100 translate-y-0"
                  : "max-h-0 opacity-0 scale-95 -translate-y-2"
              } overflow-hidden`}
            >
              {selectedTeamID && selectedTeam && (
                <div className="mb-4 border rounded bg-white shadow-md p-4">
                  <TeamProfile
                    teamID={selectedTeamID}
                    team={selectedTeam}
                    uid={uid}
                    onQuit={() => {
                      setSelectedTeamID(null);
                      fetchTeamList();
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Chat content (unchanged) */}
          <div className="flex-1 overflow-auto">
            {selectedTeamID && selectedTeam ? (
              <Chat teamID={selectedTeamID} />
            ) : (
              <div className="text-center text-gray-400 mt-10">
                Select a group to start chatting
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <CreateNewTeam
            show={showModal}
            onClose={() => setShowModal(false)}
            onCreate={handleCreate}
            isCreating={isCreating}
          />
        )}
      </div>
    </div>
  );
}

export default Team;
