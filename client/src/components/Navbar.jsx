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
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold">
            Disaster Response
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/" className="hover:text-blue-200">
            Home
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/create-disaster" className="hover:text-blue-200">
                Create Disaster
              </Link>
              <div className="flex items-center">
                <span className="mr-2">
                  {user.username} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-white text-blue-600 hover:bg-blue-100 px-3 py-1 rounded"
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