import React, { useRef, useState, useEffect } from "react";
import { db } from "../firebase";
import {
  doc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
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
}: {
  teamID: string;
  team: Team;
  uid: string;
}) {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isQuiting, setIsQuiting] = useState(false);

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

  const handleQuit = async () => {
    if (!teamID || !uid) return;

    const confirmQuit = window.confirm(
      "Are you sure you want to quit the team?"
    );
    if (!confirmQuit) return;

    setIsQuiting(true);

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
          (name) =>
            teamData.admin.indexOf(uid) === -1 ||
            teamData.admin.indexOf(uid) !== teamData.admin_name.indexOf(name)
        );

        // Apply update
        transaction.update(teamRef, {
          user_uid: updated_user_uid,
          user_email: updated_user_email,
          user_name: updated_user_name,
          admin: updated_admin,
          admin_name: updated_admin_name,
        });
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

      toast.success("You have quit the team successfully.", {
        position: "bottom-center",
      });
      window.location.href = "/team"; // Or use navigate("/team") if you have access to navigate
    } catch (err: any) {
      console.error("Error quitting team:", err.message);
      toast.error("Failed to quit the team. Try again.", {
        position: "bottom-center",
      });
    } finally {
      setIsQuiting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col p-4 rounded-lg bg-white shadow-md space-y-3">
        <div>
          <p className="text-lg">
            <strong>Team Name:</strong> {team?.Name}
          </p>
        </div>
        <div>
          <p>
            <strong>Members:</strong>{" "}
            {team?.user_name?.join(", ") || "No members"}
          </p>
        </div>
        <div>
          <p>
            <strong>Admin:</strong>{" "}
            {team?.admin_name?.join(", ") || "No admins"}
          </p>
        </div>

        <div className="flex space-x-2 pt-2">
          {team?.admin?.includes(uid) && (
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
          team={team}
          setIsAddingMember={setIsAddingMember}
        />
      )}

      {showAddAdminModal && (
        <AddTeamAdmin
          onClose={closeModals}
          teamID={teamID}
          team={team}
          setIsAddingAdmin={setIsAddingAdmin}
        />
      )}
    </>
  );
}

export default TeamProfile;
