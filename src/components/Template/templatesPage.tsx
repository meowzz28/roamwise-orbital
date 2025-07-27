import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import Card from "./card";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CreateNewTemplate from "./createNewTemplate";
import { motion } from "framer-motion";

import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
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

type Template = {
  id: string;
  users: string[];
  userEmails: string[];
  userUIDs: string[];
  topic: string;
  startDate: string;
  endDate: string;
  imageURL: string;
  teamName?: string;
  teamID?: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
};

const templatesPage = () => {
  const navigate = useNavigate();
  const [UID, setUID] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Auth listener to fetch user info on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUID(user.uid);
        try {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDetails(docSnap.data() as UserDetails);
          }
        } catch (err: any) {
          console.error("Error fetching user data:", err.message);
        }
      } else {
        setUserDetails(null);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch templates owned or shared with the user
  useEffect(() => {
    const fetchData = async () => {
      if (!UID) return;
      try {
        const querySnapshot = await getDocs(
          query(
            collection(db, "Templates"),
            where("userUIDs", "array-contains", UID),
            orderBy("time", "desc")
          )
        );
        const templateData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Template[];
        setTemplates(templateData);
      } catch (err) {
        console.error("Error fetching template data:", err);
      }
    };

    fetchData();
  }, [UID]);

  // Listen for real-time updates to teams the user is part of
  useEffect(() => {
    if (!UID) return;

    const teamsQuery = query(
      collection(db, "Team"),
      where("user_uid", "array-contains", UID),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(teamsQuery, (snapshot) => {
      try {
        const teamData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            Name: data.Name,
            admin: data.admin || [],
            admin_name: data.admin_name || [],
            user_email: data.user_email || [],
            user_uid: data.user_uid || [],
            user_name: data.user_name || [],
          } as Team;
        });
        setTeams(teamData);
      } catch (err) {
        console.error("Error processing team data:", err);
      }
    });

    return () => unsubscribe();
  }, [UID]);

  // Handle creation of a new travel template
  const handleCreate = async (
    templateName: string,
    start: string,
    end: string,
    teamID: string
  ) => {
    setIsCreating(true);
    const toastId = toast.loading("Creating trip...", {
      position: "bottom-center",
    });
    try {
      const user = auth.currentUser;
      let uploadedImageURL = "";
      let teamName = "";

      // Upload image if provided
      if (image && user) {
        const imageRef = ref(
          storage,
          `templateImages/${user.uid}/${image.name}`
        );
        const uploadTask = await uploadBytesResumable(imageRef, image);
        uploadedImageURL = await getDownloadURL(uploadTask.ref);
        setImage(null);
      }

      if (user && userDetails) {
        let userEmails = [userDetails.email];
        let userUIDs = [user.uid];
        let users = [userDetails.firstName];

        if (teamID) {
          const teamRef = doc(db, "Team", teamID);
          const teamDoc = await getDoc(teamRef);

          if (teamDoc.exists()) {
            const teamData = teamDoc.data();
            teamName = teamData.Name;
            userEmails = [...new Set([...userEmails, ...teamData.user_email])];
            userUIDs = [...new Set([...userUIDs, ...teamData.user_uid])];
            users = [...new Set([...users, ...teamData.user_name])];
          }
        }

        // Create new template document
        const newDocRef = await addDoc(collection(db, "Templates"), {
          userEmails: userEmails,
          userUIDs: userUIDs,
          users: users,
          topic: templateName,
          startDate: start,
          endDate: end,
          imageURL: uploadedImageURL,
          teamID: teamID,
          teamName: teamName,
          time: serverTimestamp(),
        });

        // Optimistically update local state
        setTemplates((prev) => [
          {
            id: newDocRef.id,
            userEmails: userEmails,
            userUIDs: userUIDs,
            users: users,
            topic: templateName,
            startDate: start,
            endDate: end,
            imageURL: uploadedImageURL,
            teamID: teamID,
            teamName: teamName,
            time: serverTimestamp(),
          },
          ...prev,
        ]);
        toast.update(toastId, {
          render: "Trip created successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: "Failed to create new template. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (err: any) {
      toast.update(toastId, {
        render: `Error creating template: ${err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="container text-center p-5">
        <p className="text-danger">User not logged in or user data missing.</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page header and create button */}
      <div className="relative flex items-center justify-end mb-6">
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-center">
          My Trips 🗓️
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-outline-success"
        >
          Create New Trip +
        </button>
      </div>

      {/* Display list of templates or empty state */}
      {templates.length === 0 ? (
        <p className="text-gray-600">No trips found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <Card
                topic={template.topic}
                templateID={template.id}
                imageURL={template.imageURL}
                teamName={template.teamName}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal for creating a new trip template */}
      {showModal && (
        <CreateNewTemplate
          show={showModal}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          setImage={setImage}
          teams={teams}
          isCreating={isCreating}
        />
      )}
    </div>
  );
};

export default templatesPage;
