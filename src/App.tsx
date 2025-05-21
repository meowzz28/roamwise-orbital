import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "./index.css";
import { ToastContainer } from "react-toastify";
import { auth } from "./components/firebase";
import { User } from "firebase/auth";
import AppRoutes from "./routes/AppRoutes";

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
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <AppRoutes user={user} />
      <ToastContainer />
    </Router>
  );
}

export default App;
