import React, { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import ExpenseModal from "./expenseModal";
import { useNavigate } from "react-router-dom";
import DonutChart from "./donutChart";
import ExpensesList from "./expensesList";
import CurrencyConverter from "./currencyConverter";
import {
  allCurrencies,
  getCurrentUserDetails,
  fetchConversionRates,
  subscribeToExpenses,
  subscribeToTemplates,
  UserDetails,
  Expenses,
  Template,
} from "../../services/budgetTrackerService";

const BudgetMainPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userUID, setUserUID] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [currency, setCurrency] = useState("");
  const [originalExpenses, setOriginalExpenses] = useState<Expenses[]>([]);
  const [convertedExpenses, setConvertedExpenses] = useState<Expenses[]>([]);
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [tripSearch, setTripSearch] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const tripDropdownRef = useRef<HTMLDivElement | null>(null);
  const currencyDropdownRef = useRef<HTMLDivElement | null>(null);

  // Listen for auth state and fetch user/templates from Firestore
  useEffect(() => {
    let unsubscribeTemplates: (() => void) | null = null;
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserUID(user.uid);
        try {
          const userData = await getCurrentUserDetails();
          setUserDetails(userData);
        } catch (err) {
          console.error("Failed to get user details:", err);
        }
        unsubscribeTemplates = subscribeToTemplates(user.uid, setTemplates);
      } else {
        setUserDetails(null);
      }
      setAuthChecked(true);
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeTemplates) unsubscribeTemplates();
    };
  }, []);

  // Fetch expenses for selected trip and user, filtered by currency
  useEffect(() => {
    if (!selectedTripId || !userUID || !currency) return;
    setIsFetching(true);

    const unsubscribe = subscribeToExpenses(
      userUID,
      selectedTripId,
      (data) => {
        setOriginalExpenses(data);
        setConvertedExpenses(data);
        setIsFetching(false);
      },
      (error) => {
        console.error("Error fetching expenses:", error.message);
        setIsFetching(false);
      }
    );
    return () => unsubscribe();
  }, [selectedTripId, userUID, currency]);

  useEffect(() => {
    const convertExpenses = async () => {
      if (!currency || currency === "") {
        setConvertedExpenses(originalExpenses);
        return;
      }

      const distinctCurrencies = Array.from(
        new Set(originalExpenses.map((exp) => exp.currency))
      ).filter((curr) => curr !== currency);

      const rateMap = await fetchConversionRates(distinctCurrencies, currency);

      // Convert expenses
      const newExpenses = originalExpenses.map((exp) => {
        if (exp.currency === currency) return exp;
        const rate = rateMap[exp.currency] ?? 1;
        return {
          ...exp,
          totalSpending: exp.totalSpending * rate,
          currency,
        };
      });

      setConvertedExpenses(newExpenses);
    };

    convertExpenses();
  }, [currency, originalExpenses]);

  //To close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tripDropdownRef.current &&
        !tripDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTripDropdown(false);
      }

      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCurrencyDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  if (!userDetails) {
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

  if (isFetching) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Fetching expenses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      {/* Show trip/currency selection if not selected */}
      {!selectedTripId || !currency ? (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-800 text-center">
                Budget & Expense Tracker 💵
              </h1>
              <div className="mb-4 relative">
                <label className="block mb-2 font-medium text-gray-700">
                  Select a Trip:
                </label>
                <div
                  className="relative inline-block w-full"
                  ref={tripDropdownRef}
                >
                  {/* Dropdown trigger */}
                  <button
                    data-testid="select-template"
                    type="button"
                    onClick={() => setShowTripDropdown((prev) => !prev)}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg bg-white relative"
                  >
                    {templates.find((t) => t.id === selectedTripId)?.topic ||
                      "-- Choose a trip --"}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </span>
                  </button>

                  {/* Dropdown list */}
                  {showTripDropdown && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md">
                      {/* Search input */}
                      <input
                        type="text"
                        value={tripSearch}
                        onChange={(e) => setTripSearch(e.target.value)}
                        placeholder="Search trip..."
                        className="w-full p-2 text-sm border-b border-gray-200 focus:outline-none"
                      />
                      <ul className="max-h-60 overflow-y-auto text-sm">
                        {templates
                          .filter((template) =>
                            template.topic
                              .toLowerCase()
                              .includes(tripSearch.toLowerCase())
                          )
                          .map((template) => (
                            <li
                              key={template.id}
                              onClick={() => {
                                setSelectedTripId(template.id);
                                setShowTripDropdown(false);
                                setTripSearch("");
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {template.topic}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <label className="block mb-2 font-medium text-gray-700">
                  Select a Display Currency:
                </label>

                <div className="relative" ref={currencyDropdownRef}>
                  <button
                    data-testid="select-currency"
                    type="button"
                    onClick={() => setShowCurrencyDropdown((prev) => !prev)}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg bg-white relative"
                  >
                    {allCurrencies.find((c) => c.code === currency)?.symbol}{" "}
                    {currency || "-- Choose a currency --"}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </span>
                  </button>

                  {showCurrencyDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-sm">
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
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6  h-[400px]">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-800 text-center">
                Budget & Expense Tracker 💵
              </h1>
              <div className="mb-2 relative">
                <label className="block mb-2 font-medium text-gray-700">
                  Select a Trip:
                </label>
                <div
                  className="relative inline-block w-full"
                  ref={tripDropdownRef}
                >
                  {/* Dropdown trigger */}
                  <button
                    type="button"
                    onClick={() => setShowTripDropdown((prev) => !prev)}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg bg-white relative"
                  >
                    {templates.find((t) => t.id === selectedTripId)?.topic ||
                      "-- Choose a trip --"}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </span>
                  </button>

                  {/* Dropdown list */}
                  {showTripDropdown && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      {/* Search input */}
                      <input
                        type="text"
                        value={tripSearch}
                        onChange={(e) => setTripSearch(e.target.value)}
                        placeholder="Search trip..."
                        className="w-full p-2 text-sm border-b border-gray-200 focus:outline-none"
                      />
                      <ul className="max-h-60 overflow-y-auto text-sm">
                        {templates
                          .filter((template) =>
                            template.topic
                              .toLowerCase()
                              .includes(tripSearch.toLowerCase())
                          )
                          .map((template) => (
                            <li
                              key={template.id}
                              onClick={() => {
                                setSelectedTripId(template.id);
                                setShowTripDropdown(false);
                                setTripSearch("");
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {template.topic}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <label className="block mb-2 font-medium text-gray-700">
                  Select a Display Currency:
                </label>

                <div className="relative" ref={currencyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDropdown((prev) => !prev)}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg bg-white relative"
                  >
                    {allCurrencies.find((c) => c.code === currency)?.symbol}{" "}
                    {currency || "-- Choose a currency --"}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </span>
                  </button>

                  {showCurrencyDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-sm">
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
              </div>
              <button
                style={{ borderRadius: "8px" }}
                className="w-full mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-medium px-6 py-3 shadow-sm"
                onClick={() => setShowModal(true)}
              >
                + Add Expense
              </button>
            </div>

            <div className="flex-1 bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
              <DonutChart expenses={convertedExpenses} />
            </div>
          </div>

          {/* Right Column: Expenses List */}

          <div className="flex-1 space-y-6">
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6  h-[400px]">
              <CurrencyConverter />
            </div>
            <ExpensesList expenses={convertedExpenses} />
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedTripId && (
        <ExpenseModal
          setIsCreating={setIsCreating}
          isCreating={isCreating}
          onClose={() => setShowModal(false)}
          tripId={selectedTripId}
        />
      )}
    </div>
  );
};

export default BudgetMainPage;
