import React, { useState } from "react";
import { motion } from "framer-motion";

const ChatNameModal = ({ onClose, setName, name, handleCreateChat }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    handleCreateChat();
  };
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
            {/* Modal header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 ">
              <h3 className="text-lg font-semibold text-gray-900 ">
                Add A Chat Name
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg w-8 h-8 flex justify-center items-center "
              >
                {/* Close icon */}
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

            {/* Form for entering chat name */}
            <form className="p-4" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="template-name"
                  className="block mb-2 text-sm font-medium text-gray-900 "
                >
                  Chat Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-lg border border-gray-300  "
                  placeholder="e.g. Chat-Japan Trip"
                  required
                />
              </div>
              {/* Submit button */}
              <button
                type="submit"
                style={{ borderRadius: "8px" }}
                className="rounded-lg  w-full inline-flex justify-center items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-700  hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 "
              >
                Create Chat
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatNameModal;
