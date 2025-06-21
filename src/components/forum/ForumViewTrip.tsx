import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { FaPlaneDeparture } from "react-icons/fa";
import { toast } from "react-toastify";
import ForumDateSection from "./ForumDateSection";
import ForumDailyPlan from "./forumDailyPlan";

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

function ViewTrip({ templateID }: { templateID: string }) {
  const PlaneIcon = FaPlaneDeparture as React.ElementType;
  const [template, setTemplate] = useState<Template | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      try {
        if (templateID) {
          const templateDocRef = doc(db, "Templates", templateID);
          onSnapshot(templateDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setTemplate(docSnap.data() as Template);
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
  const days = template ? getDays(template.startDate, template.endDate) : [];

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Shared Trip</h3>
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => setShowDetails((prev) => !prev)}
          className="text-blue-600 font-medium hover:underline focus:outline-none"
        >
          {showDetails ? "Hide Trip Details ▲" : "Show Trip Details ▼"}
        </button>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showDetails ? "max-h-[5000px]" : "max-h-0"
        }`}
      >
        {!template ? (
          <div className="text-center text-gray-500 text-lg">
            No template found.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center"></div>
              <div className="flex justify-center">
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-extrabold">{template.topic}</h1>
                  <PlaneIcon className="text-5xl" />
                </div>
              </div>
            </div>

            <ForumDateSection id={templateID} template={template} />
            <div className="mt-10">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Daily Plans ✈️
              </h3>

              <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                {days.map((date, idx) => (
                  <ForumDailyPlan
                    key={idx}
                    templateID={templateID}
                    date={date.toISOString().split("T")[0]}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ViewTrip;
