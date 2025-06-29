import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { doc, onSnapshot, getDoc, deleteDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { toast } from "react-toastify";
import { FaPlaneDeparture } from "react-icons/fa";
import DateSection from "./DateSection";
import DailyPlan from "./DailyPlan";
import BudgetEstimation from "./BudgetEstimate";

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

const template = () => {
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

  useEffect(() => {
    const checkDeletePermission = async () => {
      if (!template || !userUID) return;

      if (!template.teamID) {
        setCanDelete(true);
        return;
      }

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
    <div className="p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              type="button"
              style={{ borderRadius: "8px" }}
              className="text-white hover:text-white border bg-blue-500 border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
              onClick={handleBack}
            >
              Back to Template
            </button>
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
          <h5>
            Members:{" "}
            {template && template.users.length > 0
              ? template.users.slice(0, 3).join(", ") +
                (template.users.length > 3 ? ", ..." : "")
              : "None"}
          </h5>
        </div>
        <div className="flex justify-center">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-extrabold ">{template.topic}</h1>
            <PlaneIcon className="text-5xl" />
          </div>
        </div>
      </div>
      <DateSection id={templateID} template={template} />
      <div className="mt-10">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
          Daily Plans ✈️
        </h3>
        <div className="space-y-4">
          {days.map((date, idx) => (
            <DailyPlan
              key={idx}
              templateID={templateID}
              date={date.toISOString().split("T")[0]}
            />
          ))}
        </div>
      </div>
      <BudgetEstimation template={template} templateID={templateID!} />
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
              Are you sure you want to delete this template? This action cannot
              be undone.
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
  );
};

export default template;
