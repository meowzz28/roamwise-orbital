import React, { useState, useEffect } from "react";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "./index.css";
import { ToastContainer } from "react-toastify";
import { auth } from "./components/firebase";
import { User } from "firebase/auth";
import AppRoutes from "./routes/appRoutes";
import Navbar from "./components/navigationbar";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} />
      <AppRoutes user={user} />
      <ToastContainer />
    </>
  );
}

export default App;
