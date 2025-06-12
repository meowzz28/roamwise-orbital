import React, { useState } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

const DateSection = ({ id, template }) => {
  const [startDate, setStartDate] = useState(template.startDate);
  const [endDate, setEndDate] = useState(template.endDate);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date.", {
        position: "bottom-center",
      });
      return;
    }
    setLoading(true);
    try {
      const templateRef = doc(db, "Templates", id);
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(templateRef);
        if (docSnap.exists()) {
          transaction.update(templateRef, {
            startDate: startDate,
            endDate: endDate,
          });
        } else {
          toast.error("Failed to update", {
            position: "bottom-center",
          });
        }
      });
    } catch (err: any) {
      toast.error(err.message, {
        position: "bottom-center",
      });
    } finally {
      setLoading(false);
    }
  };

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
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-blue-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-black mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-blue-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="text-sm px-3 py-1 rounded-md border border-blue-500 text-blue-500 hover:bg-blue-100 transition duration-150 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Dates"}
        </button>
      </div>
    </div>
  );
};

export default DateSection;
