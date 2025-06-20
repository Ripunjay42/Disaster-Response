import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-black text-white shadow-lg">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold">
            Disaster Response
          </Link>
        </div>

        <div className="flex items-center space-x-10">
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
    </nav>
  );
};

export default Navbar;