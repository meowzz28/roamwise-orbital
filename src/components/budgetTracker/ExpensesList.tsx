import React, { useState } from "react";
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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setExpenseToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await deleteDoc(doc(db, "Expenses", expenseToDelete));
      toast.success("Expense deleted successfully", {
        position: "bottom-center",
      });
    } catch (error) {
      toast.error("Error deleting expense:" + error, {
        position: "bottom-center",
      });
    }
    setIsDeleteConfirmOpen(false);
    setExpenseToDelete(null);
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
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Expense?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{ borderRadius: "8px" }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
