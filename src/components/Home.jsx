import { Link } from "react-router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "/public/config/firebaseinit";
import { useAuth } from "/public/ctx/FirebaseAuth";


export default function Home() {
      const [bgUrl, setBgUrl] = useState("");
      const [bgFile, setBgFile] = useState(null);
      const [loading, setLoading] = useState(true);
      const [uploading, setUploading] = useState(false);
      
      const {isAdmin} = useAuth();
      
      useEffect(() => {
        const fetchBackground = async () => {
          const ref = doc(db, "siteConfig", "home");
          const snap = await getDoc(ref);
          
          if (snap.exists()) {
            setBgUrl(snap.data().backgroundImageUrl); 
          }
          setLoading(false);
        };
      
        fetchBackground();
      }, []);
  

        const uploadImageToCloudinary = async (file) => {

            const CLOUDINARY_UPLOAD_URL = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME 

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "getUrls");

            const response = await fetch(CLOUDINARY_UPLOAD_URL, {
              method: "POST",
              body: formData,
            });
        
            const data = await response.json();
            if (!data.secure_url) throw new Error("Upload failed");

        return data.secure_url;
        };

        // background handler
        const handleUpdateBackground = async () => {
          if (!bgFile) return alert("Please select an image");
        
          try {
            setUploading(true);

            const imageUrl = await uploadImageToCloudinary(bgFile);

            const ref = doc(db, "siteConfig", "home");
            await updateDoc(ref, {
              backgroundImageUrl: imageUrl,
            });
        
            setBgUrl(imageUrl);
            setBgFile(null);
            alert("Background updated!");
          } catch (err) {
            console.error(err);
            alert("Failed to update background");
          } finally {
            setUploading(false);
          }
        };

       if (loading) return null;
  
    return (
    <div
      className="background-container"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-container text-center">
          <h1 className="main-title">GuestHouse Haven</h1>
          <p className="main-subtitle">
            Explore Rodopa Mountain's Hidden Paradice
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link to="/apartments" className="btn-orange">
              Make reservation
            </Link>
          </div>

          {/* change background | admin only */}
          {isAdmin && (
            <div className="mt-8 bg-white/80 p-4 rounded-xl">
              <p className="font-semibold mb-2">Admin: Change background</p>
              <input
                type="file"
                accept="image/"
                onChange={(e) => setBgFile(e.target.files[0])}
                className="w-full"
              />
              <button
                onClick={handleUpdateBackground}
                disabled={uploading}
                className="btn-orange mt-3 w-full"
              >
                {uploading ? "Uploading..." : "Update background"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
