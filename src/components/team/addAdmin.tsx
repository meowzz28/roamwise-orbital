import React, { useRef, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  limit,
  arrayUnion,
  runTransaction,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

type Users = {
  email: string;
  firstName: string;
  lastName: string;
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

const AddTeamAdmin = ({
  onClose,
  teamID,
  team,
  setIsAddingAdmin,
}: {
  onClose: () => void;
  teamID: string;
  team: Team;
  setIsAddingAdmin: (value: boolean) => void;
}) => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingAdmin(true);
    try {
      //   Check if the email belongs to an existing team member
      if (!team.user_email?.includes(email)) {
        toast.error("User must be a team member first");
        setIsAddingAdmin(false);
        return;
      }

      if (team.user_email?.includes(email)) {
        const userIndex = team.user_email.indexOf(email);
        const userUID = team.user_uid?.[userIndex];

        if (team.admin?.includes(userUID)) {
          toast.error("User is already an admin");
          setIsAddingAdmin(false);
          return;
        }
      }

      const querySnapshot = await getDocs(
        query(collection(db, "Users"), where("email", "==", email))
      );

      if (querySnapshot.empty) {
        toast.error("User not found");
        setIsAddingAdmin(false);
        return;
      }
      if (team.user_email && team.user_email.includes(email)) {
        const userIndex = team.user_email.indexOf(email);
        const userUID = team.user_email?.[userIndex];

        if (userUID && team.admin?.includes(userUID)) {
          toast.error("User is already an admin");
          setIsAddingAdmin(false);
          return;
        }
      }

      const userDoc = querySnapshot.docs[0];
      const uid = userDoc.id;
      const userDocData = userDoc.data() as Users;
      const teamRef = doc(db, "Team", teamID);

      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(teamRef);
        if (docSnap.exists()) {
          transaction.update(teamRef, {
            admin: arrayUnion(uid),
            admin_name: arrayUnion(`${userDocData.firstName}`.trim()),
          });
        } else {
          toast.error("Team not found");
        }
      });

      toast.success("Admin added successfully!");
      setIsAddingAdmin(false);
      onClose();
    } catch (error: any) {
      console.error("Error adding admin:", error);
      toast.error("Failed to add admin");
      setIsAddingAdmin(false);
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
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Admin
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

          <form className="p-4" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="admin-email"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Email Address (must be existing team member)
              </label>
              <input
                type="email"
                id="admin-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. user@gmail.com"
                required
              />
            </div>
            <button
              type="submit"
              className="rounded-lg w-full inline-flex justify-center items-center px-5 py-2.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300"
            >
              Add Admin
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddTeamAdmin;
