import React, { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import SignInwithGoogle from "./signInWithGoogle";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  signInWithEmail,
  subscribeToAuthChanges,
} from "../services/authService";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      console.log("Form submitted with empty fields");
      return;
    }

    try {
      await signInWithEmail(email, password);
      console.log("User logged in Successfully");
      navigate("/");
      toast.success("User logged in Successfully", {
        position: "bottom-center",
      });
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (user) {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>RoamWise</h1>
      <form onSubmit={handleSubmit}>
        <h3>Login</h3>

        <div className="mb-3">
          <label>Email address</label>
          <input
            type="email"
            className="form-control"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="block text-left">Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="d-grid">
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
        <div className="row">
          <a
            className="col-5 forgot-password text-primary"
            href="/resetPassword"
          >
            Forgot Password
          </a>

          <p className="col forgot-password text-right">
            New user? <Link to="/register">Register Here</Link>
          </p>
        </div>
        <SignInwithGoogle />
      </form>
    </div>
  );
}

export default Login;
