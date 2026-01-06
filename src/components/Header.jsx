import { useState } from 'react'
import { Link, NavLink } from 'react-router';

import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

import { useAuth } from "/public/ctx/FirebaseAuth";

const navigation = [
    { name: 'Home', path: '/' },
    { name: 'Apartments', path: '/apartments' },
    { name: 'Gallery', path: '/gallery' },
]

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { user, isAuthenticated } = useAuth(); //! auth ctx

    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <nav aria-label="Global" className="navbar">
                <div className="flex lg:flex-1">
                    <Link to="/" className="navbar-logo">
                        <span className="sr-only">GuestHouse Heaven</span>
                        <img alt="" src="https://res.cloudinary.com/dbleq6bwe/image/upload/v1767396248/prhouse_iqxjut.png" />
                    </Link>
                </div>
                <div className="flex lg:hidden">
                    <button type="button" onClick={() => setMobileMenuOpen(true)} className="menu-button">
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <div className={`desktop-nav ${user ? "flex-grow-10" : "flex-grow-4"}`}>
                    {navigation.map((item) => (
                        <NavLink 
                            key={item.name} 
                            to={item.path} 
                            className="btn-orange" 
                            style={({ isActive }) => isActive ? { color: 'black' } : {}}>
                            
                            {item.name}
                        </NavLink>
                    ))}
                </div>
                <div className="auth-buttons">
                    {isAuthenticated ? (
                        <Link to="/logout" className="btn-orange">
                            Log out <span aria-hidden="true">&rarr;</span>
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="btn-orange">
                                Log in <span aria-hidden="true">&larr;</span>
                            </Link>
                            <Link to="/register" className="btn-orange">
                                Register <span aria-hidden="true">&larr;</span>
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile Menu */}
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="mobile-menu">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="navbar-logo">
                            <span className="sr-only">GuestHouse Heaven</span>
                            <img alt="" src="https://res.cloudinary.com/dbleq6bwe/image/upload/v1767396248/prhouse_iqxjut.png" />
                        </Link>
                        <button type="button" onClick={() => setMobileMenuOpen(false)} className="menu-button">
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mobile-nav">
                        {navigation.map((item) => (
                            <Link key={item.name} to={item.path} className="mobile-nav-link">
                                {item.name}
                            </Link>
                        ))}
                        {isAuthenticated ? (
                            <Link to="/logout" className="logout-button">
                                Log out <span aria-hidden="true">&rarr;</span>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="mobile-nav-link">
                                    Log in <span aria-hidden="true">&larr;</span>
                                </Link>
                                <Link to="/register" className="mobile-nav-link">
                                    Register <span aria-hidden="true">&larr;</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </Dialog>
        </header>
    );
}
