import React, { useState } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

const ForumDateSection = ({ id, template }) => {
  const [startDate, setStartDate] = useState(template.startDate);
  const [endDate, setEndDate] = useState(template.endDate);

  return (
    <div className="flex flex-col gap-6 bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-200 mt-6">
      <h2 className="text-2xl font-semibold text-black">
        Plan Your Journey 🗓️
      </h2>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-black mb-1">
            Start Date
          </label>
          <input
            disabled={true}
            type="date"
            value={startDate}
            className="disable w-full rounded-lg border border-blue-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-black mb-1">
            End Date
          </label>
          <input
            disabled={true}
            type="date"
            value={endDate}
            className=" w-full rounded-lg border border-blue-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default ForumDateSection;
