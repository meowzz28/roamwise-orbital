import React, { useState } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

const DateSection = ({ id, template }) => {
  const [startDate, setStartDate] = useState(template.startDate);
  const [endDate, setEndDate] = useState(template.endDate);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleUpdate = async () => {
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date.", {
        position: "bottom-center",
      });
      return;
    }
    setIsConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    setLoading(true);
    const toastId = toast.loading("Updating...", {
      position: "bottom-center",
    });
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
          toast.update(toastId, {
            render: "Failed to update",
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
        }
      });
      toast.update(toastId, {
        render: "Dates updated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err: any) {
      toast.update(toastId, {
        render: err.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsConfirmOpen(false);
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
          style={{ borderRadius: "8px" }}
          className="btn btn-primary"
        >
          {loading ? "Updating..." : "Update Dates"}
        </button>
      </div>
      {isConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsConfirmOpen(false)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Update Travel Dates?</h3>
            <p className="text-gray-600 mb-4">
              Changing the dates might affect your existing plans. Are you sure
              you want to proceed?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              New dates: {new Date(startDate).toLocaleDateString()} -{" "}
              {new Date(endDate).toLocaleDateString()}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                style={{ borderRadius: "5px" }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdate}
                style={{ borderRadius: "5px" }}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : null}
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateSection;
