import React, { useState } from "react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const allCurrencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "AED", name: "United Arab Emirates Dirham", symbol: "د.إ" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA" },
];

const ExpenseModal = ({ setIsCreating, onClose, tripId }) => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [totalSpending, setTotalSpending] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

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

    try {
      await addDoc(collection(db, "Expenses"), {
        userId: user.uid,
        tripId: tripId,
        category: category,
        description: description,
        date: date,
        currency: currency,
        totalSpending: totalSpending,
      });
    } catch (error: any) {
      toast.error(error, {
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
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Expense
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg w-8 h-8 flex justify-center items-center"
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

          <form className="p-4" onSubmit={handleSubmit}>
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
                  {["transport", "food", "accomodation", "others"].map(
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

            <div className="mb-4">
              <label
                htmlFor="spending"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Total Spending
              </label>

              <div className="relative flex gap-2 items-center">
                <div className="relative inline-block">
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

                <input
                  type="number"
                  id="spending"
                  min="0"
                  step="0.01"
                  onChange={(e) => setTotalSpending(Number(e.target.value))}
                  className="w-full p-2.5 text-sm rounded-lg border border-gray-300"
                  placeholder="e.g. 1200.00"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-lg w-full px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Submit
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ExpenseModal;
