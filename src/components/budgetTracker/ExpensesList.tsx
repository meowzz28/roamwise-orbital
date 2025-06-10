import React from "react";
import { db } from "../firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";

type Expense = {
  id: string;
  description: string;
  totalSpending: number;
  category: string;
  currency: string;
  date: string;
};

type ExpenseListProps = {
  expenses: Expense[];
};

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses }) => {
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "Expenses", id));
        toast.success("Expense deleted successfully");
      } catch (error) {
        toast.error("Error deleting expense:" + error, {
          position: "bottom-center",
        });
      }
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-4 mt-6">
      {expenses.length === 0 ? (
        <p className="text-center text-gray-400 italic">
          No expenses added yet.
        </p>
      ) : (
        expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition hover:shadow-md"
          >
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-800">
                {expense.description}
              </span>
              <span className="text-sm text-gray-500">
                {expense.category[0].toUpperCase() + expense.category.slice(1)}{" "}
                • {expense.date}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-blue-600">
                {expense.currency} {expense.totalSpending.toFixed(2)}
              </span>
              <button
                onClick={() => handleDelete(expense.id)}
                className="text-red-500 hover:text-red-700 transition"
              >
                🗑️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ExpenseList;
