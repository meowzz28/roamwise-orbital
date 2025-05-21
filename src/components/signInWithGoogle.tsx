import React from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function SignInwithGoogle() {
  const navigate = useNavigate();
  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      console.log(result);
      const user = result.user;
      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: user.displayName,
        });
        toast.success("User logged in Successfully", {
          position: "top-center",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };
  return (
    <div>
      <p className="continue-p">--Or continue with--</p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={googleLogin}
          style={{
            padding: 0,
            border: "none",
            background: "none",
            display: "inline-block",
            cursor: "pointer",
          }}
        >
          <img
            src="/google.png"
            alt="Sign in with Google"
            style={{
              height: "50px",
              display: "block",
            }}
          />
        </button>
      </div>
    </div>
  );
}

export default SignInwithGoogle;
