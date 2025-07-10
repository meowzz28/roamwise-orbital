import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const CreateNewTemplate = ({
  show,
  onClose,
  onCreate,
  setImage,
  teams,
  isCreating,
}) => {
  const [templateName, setTemplateName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    if (!start || !end || new Date(start) > new Date(end)) {
      toast.error("Start date must be before or equal to end date.", {
        position: "bottom-center",
      });
      return;
    }
    try {
      const result = await onCreate(
        templateName.trim(),
        start,
        end,
        selectedTeam
      );
      if (result !== false) {
        setTemplateName("");
        onClose();
      }
    } catch (error) {
      console.error("Error creating template:", error);
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
                Create New Template
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
              <div className="mb-2">
                <label
                  htmlFor="template-name"
                  className="block mb-2 text-sm font-medium text-gray-900 "
                >
                  Template Name
                </label>
                <input
                  type="text"
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-lg border border-gray-300  "
                  placeholder="e.g. Japan Trip"
                  required
                />
              </div>
              <div className="col-span-2 sm:col-span-1 mb-2">
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Template Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 blourck w-full p-2.5"
                  onChange={(e) =>
                    setImage(e.target.files ? e.target.files[0] : null)
                  }
                />
              </div>

              <div className="col-span-2 sm:col-span-1 mb-2">
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Select Team (optional)
                </label>
                <select
                  id="teams"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">Choose a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1 mb-2">
                <label
                  htmlFor="start-date"
                  className="block mb-2 text-sm font-medium text-gray-900 "
                >
                  Start Date
                </label>
                <input
                  type="date"
                  name="start-date"
                  id="start-date"
                  value={start}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder=""
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1 mb-2">
                <label
                  htmlFor="end-date"
                  className="block mb-2 text-sm font-medium text-gray-900"
                >
                  End Date
                </label>
                <input
                  type="date"
                  name="end-date"
                  id="end-date"
                  value={end}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder=""
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </div>

              <button
                data-testid="create-template-btn"
                type="submit"
                disabled={isCreating}
                style={{ borderRadius: "8px" }}
                className={`w-full inline-flex justify-center items-center px-5 py-2.5 text-sm font-medium text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                  isCreating
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800"
                }`}
              >
                {isCreating ? (
                  <>
                    <svg
                      className="animate-spin mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Create New Template
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateNewTemplate;
