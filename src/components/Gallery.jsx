import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "/public/config/firebaseinit";
import { useAuth } from '/public/ctx/FirebaseAuth'
import { useNavigate } from "react-router"

import {
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import GalleryItem from "./GalleryItem";

const sortOptions = [
    { name: 'All', href: '/gallery', current: true },
    { name: 'Most Liked', href: '/gallery?sortBy=likes&dir=desc', current: false },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Gallery() {
    const [searchParams] = useSearchParams();
    const [pictures, setPictures] = useState([]);
    const [displayPictures, setDisplayPictures] = useState([]);

    const { user, isAuthenticated } = useAuth(); //! auth ctx
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
    if (!user) {
    setIsAdmin(false);
    return;
    }

    const checkAdmin = async () => {
    const ref = doc(db, "admin", user.uid);
    const snap = await getDoc(ref);
    setIsAdmin(snap.exists());
    };

    checkAdmin();
    }, [user]);


    const navigate = useNavigate();

    useEffect(() => {
        const fetchPictures = async () => {
            const querySnapshot = await getDocs(collection(db, "gallery"));
            const pictureList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPictures(pictureList);
        };

        fetchPictures();
    }, []);

    useEffect(() => {
        const filter = Object.fromEntries(searchParams);

        if (filter.sortBy) {
            setDisplayPictures([...pictures].sort((w1, w2) =>
                filter.dir === 'asc' ? w1[filter.sortBy] - w2[filter.sortBy] : w2[filter.sortBy] - w1[filter.sortBy]))
        } else {
            setDisplayPictures([...pictures]);
        }
    }, [pictures, searchParams])

    const handleAddPictureBtn = () => {
        // if (!isAuthenticated) {
        if (!isAdmin) {
            navigate("/");
            return alert('You do not have permission to do that.');
        } else {
            navigate("/gallery/addPicture");
        }
    }

    return (
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                <h2 className="sr-only">Gallery</h2>

                <div className="flex justify-center px-6 py-8 lg:px-8">
                    <div className="flex gap-x-12">
                        {isAdmin && (
                            <button onClick={handleAddPictureBtn} className="btn-orange">
                                Add Picture
                            </button>
                            )}
                    </div>
                </div>

                <Menu as="div" className="relative inline-block text-left">
                    <div>
                        <MenuButton className="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                            Sort
                            <ChevronDownIcon
                                aria-hidden="true"
                                className="-mr-1 ml-1 size-5 shrink-0 text-gray-400 group-hover:text-gray-500"
                            />
                        </MenuButton>
                    </div>

                    <MenuItems
                        transition
                        className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 shadow-2xl ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                    >
                        <div className="py-1">
                            {sortOptions.map((option) => (
                                <MenuItem key={option.name}>
                                    <Link
                                        to={option.href}
                                        className={classNames(
                                            option.current ? 'font-medium text-gray-900' : 'text-gray-500',
                                            'block px-4 py-2 text-sm data-focus:bg-gray-100 data-focus:outline-hidden',
                                        )}
                                    >
                                        {option.name}
                                    </Link>
                                </MenuItem>
                            ))}
                        </div>
                    </MenuItems>
                </Menu>

                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                    {displayPictures.map((pictures) => (
                        <GalleryItem key={pictures.id} pictures={pictures} />
                    ))}
                </div>
            </div>
    )
}
