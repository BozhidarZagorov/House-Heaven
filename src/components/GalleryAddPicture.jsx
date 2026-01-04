import { useEffect, useState } from 'react';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '/public/config/firebaseinit';
import { useAuth } from '/public/ctx/FirebaseAuth';
import { useNavigate } from 'react-router'


export default function GalleryAddPicture() {
    // const [imgUrl, setImgUrl] = useState('');
    const [imgFile, setImgFile] = useState('');
    const [likes, setLikes] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, isAuthenticated } = useAuth(); //! auth ctx
    const [isAdmin, setIsAdmin] = useState(false);

    const navigate = useNavigate();

    
    
   const [adminLoading, setAdminLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsAdmin(false);
            setAdminLoading(false);
        return;
    }

  const checkAdmin = async () => {
    try {
      const ref = doc(db, "admin", user.uid);
      const snap = await getDoc(ref);
      setIsAdmin(snap.exists());
    } catch (err) {
      console.error("Admin check failed:", err);
      setIsAdmin(false);
    } finally {
      setAdminLoading(false);
    }
  };

  checkAdmin();
}, [user]);

    useEffect(() => {
        if (!adminLoading && !isAdmin) {
            alert("You do not have permission to do that.");
            navigate("/",{replace: true});
        }
    }, [adminLoading, isAdmin, navigate]);

    const uploadImageToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'getUrls');

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/dbleq6bwe/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            return data.secure_url; // Get the uploaded image URL
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error('Image upload failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!imgFile) {
            setError('Image URL is required.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const imgUrl = await uploadImageToCloudinary(imgFile)
            // Add a new picture to the "gallery" collection
            const docRef = await addDoc(collection(db, "gallery"), {
                imgUrl: imgUrl,
                likes: likes,
                likedByUserId: [], // Initialize with an empty array for tracking likes
                createdByUserId: user.uid
            });

            // console.log("Document written with ID: ", docRef.id);
            navigate('/gallery'); 

        } catch (e) {
            setError('Error adding picture: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gallery-container">
            
        <div className="mx-auto max-w-2xl text-center mt-20">
            <h2 className="text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">Add Picture</h2>
            <p className="mt-2 text-lg/8 font-semibold  sm:text-3xl text-gray-600">Add your picture to the gallery</p>
        </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-xl sm:mt-20">

            <div className="sm:col-span-2">

                <div className="sm:col-span-2">
                    <label htmlFor="imgUrl" className="block text-sm/6 font-semibold text-center text-white sm:text-2xl">Image</label>
                    <div className="mt-2.5">
                    <input
                        type="file"
                        accept='image/*'
                        id="imgFile"
                        // value={imgUrl}
                        onChange={(e) => setImgFile(e.target.files[0])}
                        className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 opacity-80"
                        required
                    />
                    </div>
                </div>

                <div className="mt-10">
                <button
                    type="submit"
                    className="block w-full btn-orange"
                    disabled={loading}
                >
                    {loading ? 'Adding Picture...' : 'Add Picture'}
                </button>
                {loading ? 
                        <span className="flex justify-center mt-5">
                            <svg className="spinner"></svg>
                        </span> 
                    : null }
                </div>
            </div>
            </form>
        </div>
    );
}
