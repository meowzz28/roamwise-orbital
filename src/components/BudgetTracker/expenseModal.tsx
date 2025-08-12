import React, { useState } from "react";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import app from "../firebase";
import { httpsCallable, getFunctions } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { allCurrencies, addExpense } from "../../services/budgetTrackerService";

type Props = {
  setIsCreating: React.Dispatch<React.SetStateAction<boolean>>;
  isCreating: boolean;
  onClose: () => void;
  tripId: string;
};

const ExpenseModal: React.FC<Props> = ({
  setIsCreating,
  isCreating,
  onClose,
  tripId,
}) => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [totalSpending, setTotalSpending] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const functions = getFunctions(app);
  const parseReceipt = httpsCallable(functions, "parseReceiptWithAI");

  //  Helper to format the GPT date output
  const formatDate = (input: string): string => {
    const d = new Date(input);
    return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      toast.error("Please sign in to use this feature", {
        position: "bottom-center",
      });
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];

      const toastId = toast.loading("Parsing receipt...", {
        position: "bottom-center",
      });

      try {
        const res = await parseReceipt({ base64Image: base64 });
        const data = res.data as any;

        if (data.vendor) setDescription(data.vendor);
        if (data.amount) setTotalSpending(parseFloat(data.amount));
        if (data.date) setDate(formatDate(data.date));
        if (data.currency) {
          const match = allCurrencies.find((c) => c.code === data.currency);
          if (match) setCurrency(match.code);
        }
        if (
          data.category &&
          ["transport", "food", "accomodation", "others"].includes(
            data.category
          )
        ) {
          setCategory(data.category);
        }
        toast.update(toastId, {
          render: "Receipt parsed successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          position: "bottom-center",
        });
      } catch (err) {
        console.error(err);
        toast.update(toastId, {
          render: "Failed to parse receipt.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
          position: "bottom-center",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission to add expense
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    if (!category) {
      toast.error("Please select a category.", {
        position: "bottom-center",
      });
      return;
    }
    if (!tripId) {
      toast.error("Please select a trip before adding expenses.", {
        position: "bottom-center",
      });
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Adding expenses", {
      position: "bottom-center",
    });
    try {
      await addExpense({
        userId: user.uid,
        tripId,
        category,
        description,
        date,
        currency,
        totalSpending,
      });

      toast.update(toastId, {
        render: `Successfully added expenses!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
    } catch (error: any) {
      toast.update(toastId, {
        render: error.message,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
    } finally {
      setIsCreating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative p-4 w-full max-w-md max-h-full"
      >
        <div className="bg-white rounded-lg shadow">
          {/* Modal header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Expense
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg w-8 h-8 flex justify-center items-center"
            >
              {/* Close icon */}
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

          {/* Expense form */}
          <form className="p-4" onSubmit={handleSubmit}>
            {/* OCR */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Autofill with Receipt (optional)
              </label>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="receipt-upload"
                />
                <label
                  htmlFor="receipt-upload"
                  className="w-full p-2.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-center text-gray-600"
                >
                  Upload Image of Receipt Here
                </label>
              </div>
            </div>

            {/*Category*/}
            <div className="mb-4 relative">
              <label
                htmlFor="category"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Category
              </label>
              <button
                type="button"
                style={{ borderRadius: "8px" }}
                onClick={() => setShowDropdown((prev) => !prev)}
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300 text-left bg-white flex justify-between items-center"
              >
                {category
                  ? category.charAt(0).toUpperCase() + category.slice(1)
                  : "Select Category"}
                <svg
                  className="w-4 h-4 ml-2 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showDropdown && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md">
                  {["transport", "food", "accommodation", "others"].map(
                    (item) => (
                      <li
                        key={item}
                        onClick={() => {
                          setCategory(item);
                          setShowDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>

            {/* Description input */}
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Description
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300"
                placeholder="e.g. Airplane Ticket"
                required
              />
            </div>

            {/* Total spending and currency selector */}
            <div className="mb-4">
              <label
                htmlFor="spending"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Total Spending
              </label>

              <div className="relative flex gap-2 items-center">
                <div className="relative inline-block">
                  {/* Currency dropdown */}
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDropdown((prev) => !prev)}
                    style={{ borderRadius: "8px" }}
                    className="p-2.5 pr-8 text-sm  w-40 rounded-lg border border-gray-300 bg-white min-w-fit text-left"
                  >
                    {allCurrencies.find((c) => c.code === currency)?.symbol}{" "}
                    {currency}
                  </button>
                  <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ▼
                  </div>

                  {showCurrencyDropdown && (
                    <div className="absolute z-30 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-md">
                      {/* Currency search input */}
                      <input
                        type="text"
                        value={currencySearch}
                        onChange={(e) => setCurrencySearch(e.target.value)}
                        placeholder="Search currency..."
                        className="w-full p-2 text-sm border-b border-gray-200 focus:outline-none"
                      />
                      <ul className="max-h-60 overflow-y-auto">
                        {allCurrencies
                          .filter((curr) =>
                            `${curr.code} ${curr.name}`
                              .toLowerCase()
                              .includes(currencySearch.toLowerCase())
                          )
                          .map((curr) => (
                            <li
                              key={curr.code}
                              onClick={() => {
                                setCurrency(curr.code);
                                setShowCurrencyDropdown(false);
                                setCurrencySearch("");
                              }}
                              className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                            >
                              {curr.symbol} {curr.code} — {curr.name}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Amount input */}
                <input
                  type="number"
                  id="spending"
                  min="0"
                  step="0.01"
                  value={totalSpending || ""}
                  onChange={(e) => setTotalSpending(Number(e.target.value))}
                  className="w-full p-2.5 text-sm rounded-lg border border-gray-300"
                  placeholder="e.g. 1200.00"
                  required
                />
              </div>
            </div>

            {/* Date input */}
            <div className="mb-4">
              <label
                htmlFor="date"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300"
                placeholder="e.g. Airplane Ticket"
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn-primary w-100 d-flex justify-content-center align-items-center"
              disabled={isCreating}
            >
              {isCreating && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              )}
              {isCreating ? "Adding..." : "Add Expenses"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ExpenseModal;
