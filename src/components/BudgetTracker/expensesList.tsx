import React, { useState } from "react";
import { deleteExpense, Expense } from "../../services/budgetTrackerService";
import { toast } from "react-toastify";

type ExpenseListProps = {
  expenses: Expense[];
};

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses }) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Open delete confirmation modal
  const handleDelete = (id: string) => {
    setExpenseToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  // Confirm and delete the expense from Firestore
  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading("Deleting expenses...", {
      position: "bottom-center",
    });
    try {
      await deleteExpense(expenseToDelete);
      toast.update(toastId, {
        render: `Expenses deleted successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
    } catch (error) {
      toast.update(toastId, {
        render: "Error deleting expense:" + error,
        type: "error",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setExpenseToDelete(null);
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-4 mt-6">
      {/* Show message if no expenses */}
      {expenses.length === 0 ? (
        <p className="text-center text-gray-400 italic">
          No expenses added yet.
        </p>
      ) : (
        // Render each expense item
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

      {/* Delete confirmation modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg text-red-600 font-semibold mb-2">
              Delete Expense?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : null}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
