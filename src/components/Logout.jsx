// import React from "react";
// import { useNavigate } from "react-router";
// import { auth } from "/public/config/firebaseinit";
// import { signOut } from "firebase/auth";

import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "/public/ctx/FirebaseAuth";

// export default function Logout() {
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//       console.log("logged out");
//       navigate("/"); // Redirect to Home
//     } catch (error) {
//       console.error("Logout failed:", error.message);
//     }
//   };

//   React.useEffect(() => {
//     handleLogout(); //! LogsOut on path reach // when button is clicked //
//   }, []);
// }

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const doLogout = async () => {
      await logout();
      navigate("/");
    };
    doLogout();
  }, [logout, navigate]);

  return null;
}