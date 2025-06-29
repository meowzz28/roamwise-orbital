import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import AddTeamMember from "./addTeamMember";
import AddTeamAdmin from "./addAdmin";

type Team = {
  id: string;
  Name: string;
  admin: string[];
  admin_name: string[];
  user_email: string[];
  user_uid: string[];
  user_name: string[];
};
function TeamProfile({
  teamID,
  team,
  uid,
  onQuit,
}: {
  teamID: string;
  team: Team;
  uid: string;
  onQuit?: () => void;
}) {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isQuiting, setIsQuiting] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Team>(team);
  const [quitConfirm, setQuitConfirm] = useState(false);

  const navigate = useNavigate();

  const handleAddNewMember = () => {
    setShowAddMemberModal(true);
  };

  const handleAddNewAdmin = () => {
    setShowAddAdminModal(true);
  };

  const closeModals = () => {
    setShowAddMemberModal(false);
    setShowAddAdminModal(false);
  };

  const handleQuit = () => setQuitConfirm(true);

  const confirmQuit = async () => {
    if (!teamID || !uid) return;

    setIsQuiting(true);
    const toastId = toast.loading("Quitting team...", {
      position: "bottom-center",
    });

    try {
      const templatesQuery = query(
        collection(db, "Templates"),
        where("teamID", "==", teamID)
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      const templateRefs = templatesSnapshot.docs.map((doc) => doc.ref);
      const teamRef = doc(db, "Team", teamID);
      await runTransaction(db, async (transaction) => {
        const teamDoc = await transaction.get(teamRef);
        if (!teamDoc.exists()) {
          throw new Error("Team does not exist");
        }
        const templateDocs = await Promise.all(
          templateRefs.map((ref) => transaction.get(ref))
        );
        const teamData = teamDoc.data() as Team;

        // Get index of user in user_uid array
        const userIndex = teamData.user_uid.indexOf(uid);
        if (userIndex === -1) {
          throw new Error("You are not a member of this team");
        }

        const userEmail = teamData.user_email[userIndex];
        const userName = teamData.user_name[userIndex];

        // Remove from all arrays
        const updated_user_uid = teamData.user_uid.filter((id) => id !== uid);
        const updated_user_email = teamData.user_email.filter(
          (email) => email !== userEmail
        );
        const updated_user_name = teamData.user_name.filter(
          (name) => name !== userName
        );
        const updated_admin = teamData.admin.filter((id) => id !== uid);
        const updated_admin_name = teamData.admin_name.filter(
          (name) => name !== userName
        );

        // Apply update
        if (updated_user_uid.length === 0 && updated_admin.length === 0) {
          transaction.delete(teamRef);
        } else {
          transaction.update(teamRef, {
            user_uid: updated_user_uid,
            user_email: updated_user_email,
            user_name: updated_user_name,
            admin: updated_admin,
            admin_name: updated_admin_name,
          });
        }

        templateDocs.forEach((templateDoc, index) => {
          if (templateDoc.exists()) {
            const templateData = templateDoc.data();
            transaction.update(templateRefs[index], {
              userUIDs: templateData.userUIDs.filter(
                (id: string) => id !== uid
              ),
              userEmails: templateData.userEmails.filter(
                (email: string) => email !== userEmail
              ),
              users: templateData.users.filter(
                (name: string) => name !== userName
              ),
            });
          }
        });
      });
      toast.update(toastId, {
        render: "You have quit the team successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      onQuit?.();
      setQuitConfirm(false);

      navigate("/team");
    } catch (err: any) {
      console.error("Error quitting team:", err.message);
      toast.update(toastId, {
        render: "Failed to quit the team. Try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsQuiting(false);
    }
  };

  const fetchUpdatedTeam = async () => {
    const teamRef = doc(db, "Team", teamID);
    const docSnap = await getDoc(teamRef);
    if (docSnap.exists()) {
      const updatedTeam = docSnap.data() as Team;
      setCurrentTeam(updatedTeam); // Use currentTeam as your local team state
      console.log("Fetched updated team:", updatedTeam);
    }
  };

  useEffect(() => {
    if (!showAddMemberModal) {
      fetchUpdatedTeam();
    }
  }, [showAddMemberModal]);

  useEffect(() => {
    if (!showAddAdminModal) {
      fetchUpdatedTeam();
    }
  }, [showAddAdminModal]);

  if (!currentTeam.admin_name || !currentTeam.user_name) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status"></div>
        <p>Loading team profile...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col p-4 rounded-lg bg-white shadow-md space-y-3">
        <div>
          <p className="text-lg">
            <strong>Team Name:</strong> {currentTeam?.Name}
          </p>
        </div>
        <div>
          <p>
            <strong>Members:</strong>{" "}
            {currentTeam?.user_name?.join(", ") || "No members"}
          </p>
        </div>
        <div>
          <p>
            <strong>Admin:</strong>{" "}
            {currentTeam?.admin_name?.join(", ") || "No admins"}
          </p>
        </div>

        <div className="flex space-x-2 pt-2">
          {currentTeam?.admin?.includes(uid) && (
            <>
              <button
                className="btn btn-primary me-2"
                onClick={handleAddNewMember}
                disabled={isAddingMember}
              >
                {isAddingMember ? "Adding..." : "Add Member"}
              </button>
              <button
                className="btn btn-warning me-2"
                onClick={handleAddNewAdmin}
                disabled={isAddingAdmin}
              >
                {isAddingAdmin ? "Adding..." : "Add Admin"}
              </button>
            </>
          )}
          <button
            className="btn btn-danger me-2"
            onClick={handleQuit}
            disabled={isQuiting}
          >
            {isQuiting ? "Quiting" : "Quit Team"}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddMemberModal && (
        <AddTeamMember
          onClose={closeModals}
          teamID={teamID}
          team={currentTeam}
          setIsAddingMember={setIsAddingMember}
        />
      )}

      {showAddAdminModal && (
        <AddTeamAdmin
          onClose={closeModals}
          teamID={teamID}
          team={currentTeam}
          setIsAddingAdmin={setIsAddingAdmin}
        />
      )}
      {quitConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setQuitConfirm(false)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Quit Team?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to quit this team? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setQuitConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmQuit}
                disabled={isQuiting}
                className="btn btn-danger"
              >
                {isQuiting ? (
                  <span
                    className="disabled spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : null}
                {isQuiting ? "Quitting..." : "Confirm Quit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TeamProfile;
