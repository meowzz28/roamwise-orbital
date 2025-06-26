import React, { useState } from "react";
import { motion } from "framer-motion";

const CreateNewTeam = ({
  show,
  onClose,
  onCreate,
  isCreating,
}: {
  show: boolean;
  onClose: () => void;
  onCreate: (teamName: string) => void;
  isCreating: boolean;
}) => {
  const [teamName, setTeamName] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onCreate(teamName.trim());
      setTeamName("");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative p-4 w-full max-w-md max-h-full"
      >
        <div className="relative p-4 w-full max-w-md max-h-full">
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 ">
              <h3 className="text-lg font-semibold text-gray-900 ">
                Create New Team
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg w-8 h-8 flex justify-center items-center "
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

            <form className="p-4" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="team-name"
                  className="block mb-2 text-sm font-medium text-gray-900 "
                >
                  Team Name
                </label>
                <input
                  type="text"
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-lg border border-gray-300  "
                  placeholder="eg. Power Rangers"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 d-flex justify-content-center align-items-center"
                disabled={isCreating}
              >
                {isCreating && (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                )}
                {isCreating ? "Creating..." : "Create New Team"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateNewTeam;
