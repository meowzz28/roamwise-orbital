import React, { useState } from "react";
import { auth, db, storage } from "../firebase";
import {
  query,
  collection,
  where,
  doc,
  getDocs,
  arrayUnion,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { User } from "firebase/auth";

type Users = {
  email: string;
  firstName: string;
};
const AddNewMember = ({ onClose, templateID, setIsAddingMember }) => {
  const [email, setEmail] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMember(true);
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "Users"), where("email", "==", email))
      );
      if (querySnapshot.empty) {
        toast.error("User not found");
        setIsAddingMember(false);
        return;
      }
      const userDoc = querySnapshot.docs[0];
      const uid = userDoc.id;
      const userDocData = userDoc.data() as Users;
      const templateRef = doc(db, "Templates", templateID);
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(templateRef);
        if (docSnap.exists()) {
          transaction.update(templateRef, {
            userEmails: arrayUnion(userDocData.email),
            userUIDs: arrayUnion(uid),
            users: arrayUnion(userDocData.firstName),
          });
        } else {
          toast.error("Failed to update", {
            position: "bottom-center",
          });
        }
      });
      toast.success("Member added!");
      setIsAddingMember(false);
      onClose();
    } catch (error: any) {
      toast.error("Failed to add member", {
        position: "bottom-center",
      });
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
        <div className="relative p-4 w-full max-w-md max-h-full">
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 ">
              <h3 className="text-lg font-semibold text-gray-900 ">
                Add New Member
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
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-lg border border-gray-300  "
                  placeholder="e.g. user@gmail.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="rounded-lg  w-full inline-flex justify-center items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-700  hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 "
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AddNewMember;
