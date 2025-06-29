import React, { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const ForumDailyPlan = ({ templateID, date }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
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
            disabled={true}
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="disabled w-full resize-none border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
            rows={3}
            placeholder="Write your travel plan for the day..."
          />
        </>
      )}
    </div>
  );
};

export default ForumDailyPlan;
