import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { doc, onSnapshot, getDoc, deleteDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { toast } from "react-toastify";
import { FaPlaneDeparture } from "react-icons/fa";
import DateSection from "./DateSection";
import DailyPlan from "./DailyPlan";
import AddNewMember from "./AddNewMember";

type Template = {
  id: string;
  userEmails: string[];
  userUIDs: string[];
  users: string[];
  topic: string;
  startDate: string;
  endDate: string;
  imageURL: string;
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
  const [showModal, setShowModal] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const { templateID } = useParams();

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
                  position: "top-center",
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

  const handleDelete = async () => {
    if (!templateID) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this template?"
    );
    if (confirmed) {
      try {
        await deleteDoc(doc(db, "Templates", templateID));
        await deleteObject(ref(storage, template?.imageURL));
        toast.success("Template deleted successfully!");
        navigate("/templates");
      } catch (error: any) {
        console.log("Failed to delete template");
      }
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
  if (isAddingMember) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Adding New Member...</p>
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
              className="text-white hover:text-white border bg-blue-500 border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
              onClick={handleBack}
            >
              Back to Template
            </button>
            <button
              type="button"
              className="text-white hover:text-white border bg-blue-500 border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
              onClick={() => setShowModal(true)}
            >
              Add member
            </button>
            <button
              type="button"
              className="text-white hover:text-white border bg-red-500 border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
          <h5>
            Members:{" "}
            {template && template.users.length > 0
              ? template.users.slice(0, 3).join(", ") +
                (template.users.length > 3 ? ", ..." : "")
              : "None"}
          </h5>
        </div>
        {showModal && (
          <AddNewMember
            onClose={() => setShowModal(false)}
            templateID={templateID}
            setIsAddingMember={setIsAddingMember}
          />
        )}
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
    </div>
  );
};

export default template;
