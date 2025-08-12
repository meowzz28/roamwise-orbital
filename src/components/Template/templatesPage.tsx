import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import Card from "./card";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CreateNewTemplate from "./createNewTemplate";
import { motion } from "framer-motion";

import {
  getCurrentUserDetails,
  fetchUserTemplates,
  listenToTeams,
  createTemplate,
  UserDetails,
  Team,
  Template,
} from "../../services/templateService";

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
        const details = await getCurrentUserDetails();
        setUserDetails(details);
      } else {
        setUserDetails(null);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch templates owned or shared with the user
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!UID) return;
      const templates = await fetchUserTemplates(UID);
      setTemplates(templates);
    };
    fetchTemplates();
  }, [UID]);

  // Listen for real-time updates to teams the user is part of
  useEffect(() => {
    if (!UID) return;
    const unsubscribe = listenToTeams(UID, (teamList) => {
      setTeams(teamList);
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

    if (!userDetails) {
      toast.update(toastId, {
        render: "User details missing.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      return;
    }

    const result = await createTemplate(
      templateName,
      start,
      end,
      image,
      teamID,
      userDetails
    );

    if (result.success && result.newTemplate) {
      setTemplates((prev) => [result.newTemplate!, ...prev]);
      toast.update(toastId, {
        render: "Trip created successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } else {
      toast.update(toastId, {
        render: `Error creating template: ${result.error}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }

    setImage(null);
    setIsCreating(false);
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
