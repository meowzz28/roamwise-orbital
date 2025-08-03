import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { FormEvent, useState } from "react";
import { auth, db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conPassWord, setConPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConPassword;
    if (password != conPassWord) {
      toast.error("Passwords do not match!", {
        position: "bottom-center",
      });
      return;
    }
    let loadingToastId: any;
    try {
      loadingToastId = toast.loading("Creating your user...", {
        position: "bottom-center",
      });
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      console.log(user);
      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: fname,
          lastName: lname,
        });
      }
      console.log("User Registered Successfully!!");
      toast.update(loadingToastId, {
        render: "User created successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });

      await auth.signOut();
      navigate("/login");
    } catch (error: any) {
      if (loadingToastId) {
        toast.update(loadingToastId, {
          render: error.message,
          type: "error",
          isLoading: false,
          autoClose: 3000,
          position: "bottom-center",
        });
      } else {
        toast.error(error.message, {
          position: "bottom-center",
        });
      }
      console.log(error.message);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h3>Sign Up</h3>

      <div className="mb-3">
        <label>First name</label>
        <input
          type="text"
          className="form-control"
          placeholder="First name"
          onChange={(e) => setFname(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label>Last name</label>
        <input
          type="text"
          className="form-control"
          placeholder="Last name"
          onChange={(e) => setLname(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label>Email address</label>
        <input
          type="email"
          className="form-control"
          placeholder="Enter email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label>Confirm Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Re-enter password"
          onChange={(e) => setConPassword(e.target.value)}
          required
        />
      </div>

      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Sign Up
        </button>
      </div>
      <p className="forgot-password text-right">
        Already registered <Link to="/login">Login</Link>
      </p>
    </form>
  );
}
export default Register;
