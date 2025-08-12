import React, { useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  Team,
  addUserAsMember,
  findUserByEmail,
} from "../../services/teamService";

const AddTeamMember = ({
  onClose,
  teamID,
  team,
  setIsAddingMember,
}: {
  onClose: () => void;
  teamID: string;
  team: Team;
  setIsAddingMember: (value: boolean) => void;
}) => {
  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Handle form submission to add a member to the team
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMember(true);
    setIsAdding(true);
    const toastId = toast.loading("Adding member...", {
      position: "bottom-center",
    });
    try {
      // Look for user in Firestore by email
      const userDoc = await findUserByEmail(email);
      if (!userDoc) {
        toast.update(toastId, {
          render: "User not found",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        setIsAddingMember(false);
        setIsAdding(false);
        return;
      }

      const uid = userDoc.id;

      // Prevent adding if already a member or admin
      if (team.user_uid?.includes(uid)) {
        if (team.admin?.includes(uid)) {
          toast.update(toastId, {
            render: "User is already an admin",
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
        } else {
          toast.update(toastId, {
            render: "User is already a member",
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
        }
        setIsAddingMember(false);
        setIsAdding(false);
        return;
      }

      if (!teamID) {
        // console.error("teamID is undefined!");
        toast.update(toastId, {
          render: "Internal error: teamID is missing",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        setIsAddingMember(false);
        setIsAdding(false);
        return;
      }

      try {
        await addUserAsMember(teamID, uid, userDoc);
      } catch {
        toast.update(toastId, {
          render: "Team not found",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }

      toast.update(toastId, {
        render: "Member added successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      setIsAddingMember(false);
      onClose();
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.update(toastId, {
        render: "Failed to add member",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      setIsAddingMember(false);
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative p-4 w-full max-w-md max-h-full"
      >
        <div className="bg-white rounded-lg shadow">
          {/* Modal header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Member
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg w-8 h-8 flex justify-center items-center"
            >
              <svg
                className="w-3 h-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7L1 13"
                />
              </svg>
            </button>
          </div>

          {/* Email input and submit button */}
          <form className="p-4" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. user@gmail.com"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 d-flex justify-content-center align-items-center"
              disabled={isAdding}
            >
              {isAdding && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              )}
              {isAdding ? "Adding..." : "Add Member"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddTeamMember;
