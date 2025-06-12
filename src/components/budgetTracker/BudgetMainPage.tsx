import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  onSnapshot,
  getDoc,
  query,
  collection,
  where,
  orderBy,
} from "firebase/firestore";
import ExpenseModal from "./ExpenseModal";
import { useNavigate } from "react-router-dom";
import DonutChart from "./DonutChart";
import ExpensesList from "./ExpensesList";

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

type Expenses = {
  id: string;
  category: string;
  currency: string;
  date: string;
  description: string;
  totalSpending: number;
  userId: string;
  tripId: string;
};

type Template = {
  id: string;
  topic: string;
};

const BudgetMainPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userUID, setUserUID] = useState("");
  const [expenses, setExpenses] = useState<Expenses[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let unsubscribeTemplates: (() => void) | null = null;
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserUID(user.uid);
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists()) {
            setUserDetails(userDoc.data() as UserDetails);
          }

          const q = query(
            collection(db, "Templates"),
            where("userUIDs", "array-contains", user.uid)
          );

          unsubscribeTemplates = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
              id: doc.id,
              topic: doc.data().topic,
            }));
            setTemplates(data);
          });
        } catch (err: any) {
          console.error("Error fetching user or templates:", err.message);
        }
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

  useEffect(() => {
    if (!selectedTripId || !userUID) return;
    setIsFetching(true);

    const q = query(
      collection(db, "Expenses"),
      where("userId", "==", userUID),
      where("tripId", "==", selectedTripId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Expenses)
        );
        console.log("Fetched expenses:", data);
        setExpenses(data);
        setIsFetching(false);
      },
      (error) => {
        console.error("Error fetching expenses:", error.message);
        setIsFetching(false);
      }
    );
    return () => unsubscribe();
  }, [selectedTripId, userUID]);

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

  if (isCreating) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Creating New Entry...</p>
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
    <div className="min-h-screen flex flex-col items-center px-4 py-8 ">
      <div className="w-full max-w-4xl mx-auto mb-6">
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-800">
            Budget & Expense Tracker 💵
          </h1>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">
              Select a Trip:
            </label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full"
            >
              <option value="">-- Choose a trip --</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.topic}
                </option>
              ))}
            </select>
          </div>
          {selectedTripId && (
            <button
              style={{ borderRadius: "8px" }}
              disabled={!selectedTripId}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-medium px-6 py-3 shadow-md"
              onClick={() => setShowModal(true)}
            >
              + Add Expense
            </button>
          )}
        </div>
      </div>

      {showModal && selectedTripId && (
        <ExpenseModal
          setIsCreating={setIsCreating}
          onClose={() => setShowModal(false)}
          tripId={selectedTripId}
        />
      )}

      {selectedTripId && (
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <DonutChart expenses={expenses} />
          <ExpensesList expenses={expenses} />
        </div>
      )}
    </div>
  );
};

export default BudgetMainPage;
