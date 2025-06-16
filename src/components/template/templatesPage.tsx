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

type Template = {
  id: string;
  users: string[];
  userEmails: string[];
  userUIDs: string[];
  topic: string;
  startDate: string;
  endDate: string;
  imageURL: string;
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
  // const [startDate, setStartDate] = useState("");
  // const [endDate, setEndDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreate = async (
    templateName: string,
    start: string,
    end: string
  ) => {
    setIsCreating(true);
    try {
      const user = auth.currentUser;
      let uploadedImageURL = "";

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
        const newDocRef = await addDoc(collection(db, "Templates"), {
          userEmails: [userDetails.email],
          userUIDs: [user.uid],
          users: [userDetails.firstName],
          topic: templateName,
          startDate: start,
          endDate: end,
          imageURL: uploadedImageURL,
          time: serverTimestamp(),
        });
        setTemplates((prev) => [
          {
            id: newDocRef.id,
            userEmails: [userDetails.email],
            userUIDs: [user.uid],
            users: [userDetails.firstName],
            topic: templateName,
            startDate: start,
            endDate: end,
            imageURL: uploadedImageURL,
            time: serverTimestamp(),
          },
          ...prev,
        ]);
      } else {
        toast.error("Failed to create new template. Please try again.");
      }
    } catch (err: any) {
      toast.error(`Error creating template: ${err.message}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
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

  if (isCreating) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Creating New Trip...</p>
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
      <div className="relative flex items-center justify-end mb-6">
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-center">
          Trips 🗓️
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Create New Trip +
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-gray-600">No trips found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
              />
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateNewTemplate
          show={showModal}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          setImage={setImage}
        />
      )}
    </div>
  );
};

export default templatesPage;
