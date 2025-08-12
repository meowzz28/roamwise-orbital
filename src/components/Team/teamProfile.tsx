import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AddTeamMember from "./addTeamMember";
import AddTeamAdmin from "./addAdmin";
import { quitTeam, Team, fetchUpdatedTeam } from "../../services/teamService";

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

  //Handles transactional cleanup and user removal from team and templates.
  const confirmQuit = async () => {
    if (!teamID || !uid) return;

    setIsQuiting(true);
    const toastId = toast.loading("Quitting team...", {
      position: "bottom-center",
    });

    try {
      quitTeam(teamID, uid);
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

  //Fetch updated team data when modals close

  // Refresh team data after closing "Add Member" modal
  useEffect(() => {
    if (!showAddMemberModal) {
      fetchUpdatedTeam(teamID, setCurrentTeam);
    }
  }, [showAddMemberModal]);

  // Refresh team data after closing "Add Admin" modal
  useEffect(() => {
    if (!showAddAdminModal) {
      fetchUpdatedTeam(teamID, setCurrentTeam);
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
      {/* Team Info Panel */}
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

        {/* Admin actions */}
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

      {/* Member Modal */}
      {showAddAdminModal && (
        <AddTeamAdmin
          onClose={closeModals}
          teamID={teamID}
          team={currentTeam}
          setIsAddingAdmin={setIsAddingAdmin}
        />
      )}
      {/* Quit Confirmation Modal */}
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
