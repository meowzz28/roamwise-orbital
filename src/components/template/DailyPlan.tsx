import React, { useEffect, useState, useRef } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

const DailyPlan = ({ templateID, date }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const planRef = doc(db, "Templates", templateID, "DailyPlans", date);
    const unsubscribe = onSnapshot(planRef, (docSnap) => {
      if (docSnap.exists()) {
        setText(docSnap.data().text || "");
      } else {
        setText("");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [templateID, date]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const planRef = doc(db, "Templates", templateID, "DailyPlans", date);
      await runTransaction(db, async (transaction) => {
        transaction.set(planRef, { text }, { merge: true });
      });
    } catch (error: any) {
      toast.error(error.message, {
        position: "bottom-center",
      });
    } finally {
      setSaving(false);
    }
  };

  const getWeekday = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString("en-US", { weekday: "long" });
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  return (
    <div className="border rounded-2xl p-5 shadow-md border-blue-200 bg-blue-50 space-y-3 transition-all duration-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold text-gray-800">{date}</h4>
        <span className="text-sm text-blue-500 font-medium">
          {getWeekday(date)}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full resize-none border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
            rows={3}
            placeholder="Write your travel plan for the day..."
          />
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition disabled:opacity-70"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                  />
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DailyPlan;
