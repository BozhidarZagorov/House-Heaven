import { Routes, Route } from 'react-router';
import "/public/config/firebaseinit"

import { AuthProvider } from '/public/ctx/FirebaseAuth';

import useFavicon from './components/Favicon';
import Header from './components/Header'
import Home from './components/Home'
import Register from './components/Register';
import Login from './components/Login';
import Logout from './components/Logout';
import Contacts from './components/Contacts';
import NotFound from './components/NotFound';
import Gallery from './components/Gallery';
import GalleryAddPicture from './components/GalleryAddPicture';
import GalleryPicture from './components/GalleryPicture';
import Apartments from './components/Apartments';
import ApartmentDetails from './components/ApartmentDetails';
import Footer from './components/Footer';

import './App.css'
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';


function App() {
    useFavicon("https://res.cloudinary.com/dbleq6bwe/image/upload/v1767396248/prhouse_iqxjut.png");
    return (
    <AuthProvider>
        <div className="bg-white flex flex-col min-h-screen">

            <main className="flex-grow bg-gray-200">

            <Header />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login/>} />
                <Route path="/register" element={<Register/>} />
                <Route path="/logout" element={<Logout/>} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/gallery/addPicture" element={<GalleryAddPicture/>} />
                <Route path="/gallery/:pictureId" element={<GalleryPicture />} />
                <Route path="/apartments" element={<Apartments />}/>
                <Route path="/apartments/:apartmentId" element={<ApartmentDetails />}/>
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/termsOfService" element={<TermsOfService />} />
                <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
            </main>

            <Footer/>
        </div>
    </AuthProvider>
    )
}

export default App
