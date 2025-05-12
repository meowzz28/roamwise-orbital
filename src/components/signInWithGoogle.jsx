import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import googleLogo from '../google.png';
import { useNavigate } from "react-router-dom";

function SignInwithGoogle() {
    const navigate = useNavigate();
    function googleLogin() {

        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).then(async (result) => {
            console.log(result);
            const user = result.user;
            if(user) {
                await setDoc(doc(db, "Users", user.uid), {
                          email: user.email,
                          firstName: user.displayName,
                        });
                toast.success("User logged in Successfully", {
                    position: "top-center",
                });
                navigate("/profile");
            }
        });
    }
    return (
    //     <div>
    //   <p className="continue-p">--Or continue with--</p>
    //   <div
    //     style={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
    //     onClick={googleLogin}
    //   >
    //     <img src={require("../google.png")} width={"60%"} />
    //   </div>
    // </div>

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
        src={googleLogo}
        alt="Sign in with Google"
        style={{
          height: "50px",
          display: "block",
        }}
      />
    </button>
  </div>
</div>

    )

}

export default SignInwithGoogle;