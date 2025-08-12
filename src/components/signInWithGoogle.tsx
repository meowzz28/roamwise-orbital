import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../services/authService";

function SignInwithGoogle() {
  const navigate = useNavigate();
  const googleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      toast.success("User logged in Successfully", {
        position: "bottom-center",
      });
      navigate("/");
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
