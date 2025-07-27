import React, { useState, useEffect } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import app, { db } from "../firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import CurrencySelector from "./currencySelector";
import { toast } from "react-toastify";

type BudgetData = {
  totalBudgetPerPerson: number;
  currency: string;
  budgetLevel: string;
  breakdown: {
    flights?: number;
    accommodation: number;
    food: number;
    activities: number;
    transportation: number;
    miscellaneous: number;
  };
  dailyBreakdown: Array<{
    date: string;
    estimatedCost: number;
    breakdown: {
      accommodation: number;
      food: number;
      activities: number;
      transportation: number;
    };
    activityDetails?: Array<{
      name: string;
      estimatedCost: number;
    }>;
  }>;
  budgetTips: string[];
  disclaimer: string;
};

type Template = {
  id: string;
  topic: string;
  startDate: string;
  endDate: string;
  users: string[];
};

type BudgetPreferences = {
  budgetLevel: "budget" | "mid-range" | "luxury";
  homeCountry: string;
  currency: string;
};

interface BudgetEstimationProps {
  template: Template;
  templateID: string;
}

const BudgetEstimation: React.FC<BudgetEstimationProps> = ({
  template,
  templateID,
}) => {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<BudgetPreferences>({
    budgetLevel: "mid-range",
    currency: "SGD",
    homeCountry: "",
  });

  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Firestore real-time listener to load and update estimated budget
  useEffect(() => {
    if (!templateID) return;

    const budgetRef = doc(db, "BudgetEstimates", templateID);
    const unsubscribe = onSnapshot(budgetRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as BudgetData;
        setBudgetData(data);
      }
    });

    return () => unsubscribe();
  }, [templateID]);

  // Trigger Cloud Function to estimate budget using preferences and template data
  const handleEstimateBudget = async () => {
    if (!preferences.homeCountry?.trim()) {
      toast.error(
        "Please provide your Home Country to estimate flight costs.",
        {
          position: "bottom-center",
        }
      );
      return;
    }
    setIsLoading(true);

    try {
      const functions = getFunctions(app);
      const estimateBudget = httpsCallable(functions, "estimateBudget");

      const result = await estimateBudget({
        templateData: {
          templateId: templateID,
          topic: template.topic,
          startDate: template.startDate,
          endDate: template.endDate,
          users: template.users,
        },
        preferences: preferences,
      });

      setBudgetData(result.data as BudgetData);
      toast.success("Budget estimated successfully!", {
        position: "bottom-center",
      });
    } catch (error: any) {
      console.error("Error estimating budget:", error);
      toast.error("Failed to estimate budget. Please try again.", {
        position: "bottom-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format numbers into local currency strings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: budgetData?.currency || preferences.currency || "SGD",
    }).format(amount);
  };

  // Map budget categories to visual color classes
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      accommodation: "bg-blue-500",
      food: "bg-green-500",
      activities: "bg-purple-500",
      transportation: "bg-yellow-500",
      miscellaneous: "bg-gray-500",
      flights: "bg-red-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="flex flex-col gap-6 bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-200 mt-6">
      {/* Header section with title and button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-semibold text-gray-800">
            AI Budget Estimation
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEstimateBudget}
            style={{ borderRadius: "8px" }}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">Estimating...</div>
            ) : (
              "Estimate Budget"
            )}
          </button>
        </div>
      </div>

      {/* Preference inputs: Budget level, currency, home location */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-3">Budget Preferences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Level (Please choose accordingly to your plan)
            </label>
            <select
              value={preferences.budgetLevel}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  budgetLevel: e.target.value as
                    | "budget"
                    | "mid-range"
                    | "luxury",
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="budget">Budget</option>
              <option value="mid-range">Mid-range (recommended)</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <CurrencySelector
              selected={preferences.currency}
              onSelect={(newCurrency) =>
                setPreferences({ ...preferences, currency: newCurrency })
              }
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">
              Starting Location (Be as specific as possible)
            </label>
            <input
              type="text"
              value={preferences.homeCountry}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  homeCountry: e.target.value,
                })
              }
              className="w-full border rounded-lg p-2"
              placeholder="e.g. KLIA, Kuala Lumpur, Malaysia"
              required
            />
          </div>
        </div>
      </div>

      {/* Render budget result if available */}
      {budgetData && (
        <div className="space-y-6">
          <div className="text-center bg-blue-50 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(budgetData.totalBudgetPerPerson)}
            </div>
            <div className="text-gray-600">
              Per person • {budgetData.budgetLevel}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Total for {template.users.length} people:{" "}
              {formatCurrency(
                budgetData.totalBudgetPerPerson * template.users.length
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                Budget Breakdown
              </h4>
              <div className="space-y-3">
                {Object.entries(budgetData.breakdown).map(
                  ([category, amount]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded ${getCategoryColor(
                            category
                          )}`}
                        ></div>
                        <span className="capitalize text-sm font-medium">
                          {category}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">💡 Budget Tips</h4>
              <ul className="space-y-2">
                {budgetData.budgetTips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-600 flex items-start gap-2"
                  >
                    <span className="text-blue-500 font-bold">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {budgetData?.dailyBreakdown?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">📅 Daily Breakdown</h4>
              <div className="space-y-4">
                {budgetData.dailyBreakdown.map((day, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition cursor-pointer"
                    onClick={() =>
                      setExpandedDay(expandedDay === index ? null : index)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium">
                        Day {index + 1} –{" "}
                        {new Date(day.date).toLocaleDateString()}
                      </div>
                      <div className="font-semibold text-blue-600">
                        {formatCurrency(day.estimatedCost)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-700 mt-2">
                      <div>
                        🏨 Accommodation:{" "}
                        {formatCurrency(day.breakdown.accommodation)}
                      </div>
                      <div>🍽️ Food: {formatCurrency(day.breakdown.food)}</div>
                      <div>
                        🎯 Activities:{" "}
                        {formatCurrency(day.breakdown.activities)}
                      </div>
                      <div>
                        🚗 Transport:{" "}
                        {formatCurrency(day.breakdown.transportation)}
                      </div>
                    </div>

                    {expandedDay === index &&
                      day.activityDetails &&
                      day.activityDetails.length > 0 && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                          <h5 className="font-semibold text-sm mb-2">
                            Activity Breakdown:
                          </h5>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                            {day.activityDetails.map((activity, i) => (
                              <li key={i}>
                                {activity.name} —{" "}
                                <span className="font-medium text-gray-800">
                                  {formatCurrency(activity.estimatedCost)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            Disclaimer: Budget estimates are approximate and may vary based on
            actual prices and personal spending habits.
          </div>
        </div>
      )}

      {/* Empty state fallback */}
      {!budgetData && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No budget estimate available</p>
          <p className="text-sm text-gray-400">
            Click "Estimate Budget" to get AI-powered budget recommendations
            based on your travel plans
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetEstimation;
