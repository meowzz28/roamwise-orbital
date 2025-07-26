import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { doc, onSnapshot, getDoc, deleteDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { toast } from "react-toastify";
import { FaPlaneDeparture } from "react-icons/fa";
import Chat from "./chat";
import DateSection from "./DateSection";
import DailyPlan from "./DailyPlan";
import BudgetEstimation from "./budgetEstimate";

type Template = {
  id: string;
  userEmails: string[];
  userUIDs: string[];
  users: string[];
  topic: string;
  startDate: string;
  endDate: string;
  imageURL: string;
  teamID?: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
};

const Template = () => {
  const PlaneIcon = FaPlaneDeparture as React.ElementType;
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [userUID, setUserUID] = useState("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { templateID } = useParams();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Determine if the current user can delete the template
  useEffect(() => {
    const checkDeletePermission = async () => {
      if (!template || !userUID) return;

      if (!template.teamID) {
        setCanDelete(true);
        return;
      }

      // For team-based templates, only team admins can delete
      try {
        const teamRef = doc(db, "Team", template.teamID);
        const teamSnap = await getDoc(teamRef);
        if (teamSnap.exists()) {
          const teamData = teamSnap.data();
          setCanDelete(teamData.admin?.includes(userUID) || false);
        }
      } catch (error) {
        console.error("Error checking delete permission:", error);
        setCanDelete(false);
      }
    };

    checkDeletePermission();
  }, [template?.teamID, userUID]);

  // Auth listener: get current user's UID and email
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserUID(user.uid);
        try {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserEmail(docSnap.data().email);
          }
        } catch (err: any) {
          console.error("Error fetching user data:", err.message);
        }
      } else {
        setUserEmail("");
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to template data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      try {
        if (templateID) {
          const templateDocRef = doc(db, "Templates", templateID);
          onSnapshot(templateDocRef, (docSnap) => {
            if (docSnap.exists()) {
              if (!docSnap.data().userUIDs.includes(user?.uid)) {
                toast.error("You are not authorized to edit this post.", {
                  position: "bottom-center",
                });
                navigate("/templates");
                return;
              }
              setTemplate(docSnap.data() as Template);
            } else {
              navigate("/templates");
            }
          });
        }
      } catch (error: any) {
        toast.error("Error Fetching Data", {
          position: "bottom-center",
        });
      }
    };
    fetchData();
  }, [templateID]);

  // Get all date objects between start and end dates (inclusive)
  const getDays = (start: string, end: string) => {
    const days: Date[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    while (startDate <= endDate) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    return days;
  };

  const handleBack = () => {
    navigate("/templates");
  };

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  // Confirm and perform template deletion
  const confirmDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading("Deleting trip...", {
      position: "bottom-center",
    });
    if (!templateID) return;
    try {
      await deleteDoc(doc(db, "BudgetEstimates", templateID));
      await deleteDoc(doc(db, "Templates", templateID));
      toast.update(toastId, {
        render: "Trip deleted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      if (template?.imageURL) {
        await deleteObject(ref(storage, template.imageURL));
      }
      navigate("/templates");
    } catch (error: any) {
      toast.update(toastId, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setIsDeleting(false);
    }
  };

  // Get list of days in range
  const days = template ? getDays(template.startDate, template.endDate) : [];

  if (!authChecked || !template) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  if (!userEmail) {
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
    <div className="flex h-full">
      {/* Sidebar Chat */}
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsChatOpen(false)}
        />
      )}
      {/* Slide-in Team Chat Panel */}
      {template?.teamID && (
        <div>
          <div
            className={`fixed top-0 left-0 h-screen w-[80vw] sm:w-[30vw] z-50 border-r bg-white p-4 rounded-r-2xl shadow-xl transition-transform duration-300 ${
              isChatOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold mb-4">Team Chat</h3>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
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
            <Chat teamID={template.teamID} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="p-4">
          {/* Header Section: Navigation and Metadata */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  style={{ borderRadius: "8px" }}
                  className="text-white hover:text-white border bg-gray-500 border-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
                  onClick={handleBack}
                >
                  Back to Template
                </button>
                {template?.teamID && (
                  <div>
                    <button
                      style={{ borderRadius: "8px" }}
                      onClick={() => setIsChatOpen(true)}
                      className="text-white hover:text-white border bg-blue-500 border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
                    >
                      {isChatOpen ? "Close Chat" : "Open Chat"}
                    </button>
                  </div>
                )}
                {canDelete && (
                  <button
                    type="button"
                    style={{ borderRadius: "8px" }}
                    className="text-white hover:text-white border bg-red-500 border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )}
              </div>
              {/* Show member list (truncated after 3) */}
              <h5>
                Members:{" "}
                {template && template.users.length > 0
                  ? template.users.slice(0, 3).join(", ") +
                    (template.users.length > 3 ? ", ..." : "")
                  : "None"}
              </h5>
            </div>
            {/* Template Title */}
            <div className="flex justify-center">
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-extrabold ">{template.topic}</h1>
                <PlaneIcon className="text-5xl" />
              </div>
            </div>
          </div>

          {/* Editable Dates Section */}
          <DateSection id={templateID} template={template} />
          <div className="mt-10">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Daily Plans ✈️
            </h3>

            {/* Daily Plans List */}
            <div className="space-y-4">
              {days.map((date, idx) => (
                <DailyPlan
                  key={idx}
                  templateID={templateID}
                  date={date.toISOString().split("T")[0]}
                  day={idx + 1}
                />
              ))}
            </div>
          </div>

          {/* Budget Estimation Section */}
          <BudgetEstimation template={template} templateID={templateID!} />

          {/* Confirm Delete Modal */}
          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={() => setIsDeleteConfirmOpen(false)}
              />
              <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <h3 className="text-lg text-danger font-semibold mb-2">
                  Delete Template?
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this template? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    style={{ borderRadius: "5px" }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="btn btn-danger"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : null}
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Template;
