import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from "../config/firebaseinit"
import { onAuthStateChanged, signInWithPopup, signOut} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseinit";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setIsAuthenticated(!!currentUser);
              
             if (!currentUser) {
                setIsAdmin(false);
                setAuthLoading(false);
                return;
              } 
              
              
          const checkAdmin = async () => {
            try {
              const adminRef = doc(db, "admin", currentUser.uid);
              const adminSnap = await getDoc(adminRef);
              setIsAdmin(adminSnap.exists());
            } catch (err) {
              console.error("Admin check failed:", err);
              setIsAdmin(false);
            } finally {
              setAuthLoading(false);
            }
          };
      
          checkAdmin(); // call async function
        });


        return () => unsubscribe(); //clean up on unmount
    }, []);

    const loginWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
    };
    const logout = async () => {
        await signOut(auth);
    };


    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loginWithGoogle, isAdmin, authLoading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

//! Custom Hook to use Auth Context
export function useAuth() {
    return useContext(AuthContext);
}
