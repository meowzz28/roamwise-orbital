import { sendPasswordResetEmail } from "firebase/auth";
import React, { FormEvent, useState } from "react";
import { auth } from "./firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      console.log("Form submitted with empty fields");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email).then((data) => {
        toast.warn("Check you email");
        navigate("/login");
      });
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };
  return (
    <div
      className="d-flex justify-content-center"
      style={{
        backgroundColor: "#f8f9fa",
        paddingTop: "80px",
        paddingBottom: "40px", // Optional, just for spacing below
      }}
    >
      <div
        className="card p-4"
        style={{
          width: "100%",
          maxWidth: "500px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h1 className="text-center mb-4 border-bottom">Reset Password</h1>
        <p className="text-center mb-2 " style={{ fontSize: "18px" }}>
          Please enter your email address
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="d-grid">
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
          <p className="forgot-password text-right">
            <a href="/login">Back to login</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
