import {useRef,useState,useEffect} from "react";
import { Link, useNavigate } from "react-router";
import { auth } from "/public/config/firebaseinit";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from '/public/ctx/FirebaseAuth'

export default function Login (){
  const emailRef = useRef();
  const passwordRef = useRef();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, loginWithGoogle } = useAuth(); //! auth ctx
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated || user) {
      navigate("/");
      // return alert('You are already logged in.');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    try {
      const userCredentials = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredentials.user.emailVerified) {
        alert("Please verify your email to have access to functionality.");
      }
      console.log("User logged in:", email);
      navigate("/"); // Redirect to Home
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

    const handleGoogleLogin = async () => {
    if (googleLoading) return; // hard guard

    try {
      setGoogleLoading(true);
      await loginWithGoogle();
    } catch (err) {
      console.error("Google login failed:", err);
    } finally {
      setGoogleLoading(false);
    }
  };


    return (
      <>
        <div className="relative isolate px-6 py-24 sm:py-32 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <img
              alt="GuestHouse"
              src="https://res.cloudinary.com/dbleq6bwe/image/upload/v1767396248/prhouse_iqxjut.png"
              className="mx-auto h-10 w-auto"
            />
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
              Log in to your account
            </h2>
          </div>
  
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">

          {error && <p className="text-red-500 text-sm">{error}</p>}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    ref={emailRef}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 sm:text-sm/6 opacity-80"
                  />
                </div>
              </div>
  
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                    Password
                  </label>
                  {/* <div className="text-sm">
                    <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                      Forgot password?
                    </a>
                  </div> */}
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    ref={passwordRef}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 sm:text-sm/6 opacity-80"
                  />
                </div>
              </div>
  
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center btn-orange"
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>
                
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="
                    flex w-full items-center mt-3 justify-center gap-3
                    rounded-md border border-gray-300 bg-white
                    px-4 py-2.5 text-sm font-semibold text-gray-700
                    shadow-sm transition
                    hover:bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-orange-600
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                >

                  
                  {/*  google logo  */}
                  <svg className="h-5 w-5" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.4H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8.1 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.5 0 19-8.5 19-19 0-1.3-.1-2.3-.4-3.6z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.6 19 12 24 12c3.1 0 5.9 1.2 8.1 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.7 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.4H42V20H24v8h11.3c-1.1 3.2-3.6 5.7-6.7 6.9l6.3 5.3C38.5 37.7 43 31.9 43 24c0-1.3-.1-2.3-.4-3.6z"/>
                  </svg>
                 
                  <span>
                      {googleLoading ? "Logging in..." : "Continue with Google"}
                  </span>
                  </button>

                {loading || googleLoading ? 
                        <span className="flex justify-center mt-5">
                            <svg className="spinner"></svg>
                        </span> 
                    : null }
              </div>
            </form>
  
            <p className="mt-10 text-center text-sm/6 text-gray-500">
              Not a member?{' '}
              <Link to="/register" className="font-semibold text-orange-600 hover:text-orange-500">
                Register
              </Link>
            </p>
          </div>
        </div>
      </>
    )
  }
  