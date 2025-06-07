import React, { useState } from "react";
import { motion } from "framer-motion";

const CreateNewTemplate = ({
  show,
  onClose,
  onCreate,
  setStartDate,
  setEndDate,
  setImage,
}) => {
  const [templateName, setTemplateName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateName.trim()) {
      onCreate(templateName.trim());
      setTemplateName("");
      onClose();
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
              <div className="mb-4">
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
              <div className="col-span-2 sm:col-span-1 mb-4">
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
              <div className="col-span-2 sm:col-span-1 mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900 ">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start-date"
                  id="start-date"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder=""
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1 mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  End Date
                </label>
                <input
                  type="date"
                  name="end-date"
                  id="end-date"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder=""
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 "
              >
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
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateNewTemplate;
