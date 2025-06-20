import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-black text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        {/* Desktop Menu */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold">
              Disaster Response
            </Link>
          </div>

          {/* Hamburger Menu Button - only visible on mobile */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="flex items-center p-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation - hidden on mobile */}
          <div className="hidden md:flex items-center space-x-10">
            <Link to="/" className="hover:text-blue-200 text-md font-bold">
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/create-disaster" className="hover:text-blue-200 text-md font-bold">
                  Create Disaster
                </Link>
                <div className="flex items-center">
                  <span className="mr-10 text-md font-bold">
                    {user.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-md font-bold"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-white text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-md font-bold"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation - only visible when hamburger is clicked */}
        {isOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-gray-700 mt-2">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="hover:text-blue-200 text-md font-bold py-2"
                onClick={toggleMenu}
              >
                Home
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/create-disaster" 
                    className="hover:text-blue-200 text-md font-bold py-2"
                    onClick={toggleMenu}
                  >
                    Create Disaster
                  </Link>
                  <span className="text-md font-bold py-2">
                    {user.username}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded text-md font-bold text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-white text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-md font-bold inline-block"
                  onClick={toggleMenu}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;