import React, { useRef, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  collection,
  getDocs,
  query,
  where,
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

      const [userDoc] = querySnapshot.docs;

      if (!userDoc) {
        toast.error("Unexpected error: user document not found");
        setIsAddingMember(false);
        return;
      }

      const uid = userDoc.id;
      const userDocData = userDoc.data() as Users;

      // Prevent adding if already a member or admin
      if (team.user_uid?.includes(uid)) {
        if (team.admin?.includes(uid)) {
          toast.error("User is already an admin");
        } else {
          toast.error("User is already a member");
        }
        setIsAddingMember(false);
        return;
      }

      if (!teamID) {
        console.error("teamID is undefined!");
        toast.error("Internal error: teamID is missing");
        setIsAddingMember(false);
        return;
      }

      const templatesQuery = query(
        collection(db, "Templates"),
        where("teamID", "==", teamID)
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      const templateRefs = templatesSnapshot.docs.map((doc) => doc.ref);
      const teamRef = doc(db, "Team", teamID);
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(teamRef);
        if (!docSnap.exists()) {
          toast.error("Team not found");
          return;
        }
        transaction.update(teamRef, {
          user_email: arrayUnion(userDocData.email),
          user_uid: arrayUnion(uid),
          user_name: arrayUnion(`${userDocData.firstName}`.trim()),
        });
        for (const templateRef of templateRefs) {
          transaction.update(templateRef, {
            userEmails: arrayUnion(userDocData.email),
            userUIDs: arrayUnion(uid),
            users: arrayUnion(`${userDocData.firstName}`.trim()),
          });
        }
      });

      toast.success("Member added successfully!");
      setIsAddingMember(false);
      onClose();
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
      setIsAddingMember(false);
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
              className="rounded-lg w-full inline-flex justify-center items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Add Member
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddTeamMember;
