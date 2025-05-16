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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <AppRoutes user={user} />
      <ToastContainer />
    </Router>
  );
}

export default App;
