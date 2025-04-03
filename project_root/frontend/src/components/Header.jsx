import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useWallet } from '../hooks/useWallet';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { connectWallet, disconnectWallet, address, isConnected } = useWallet();

  const handleLogout = () => {
    logout();
    if (isConnected) {
      disconnectWallet();
    }
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <i className="fas fa-shield-alt text-2xl text-blue-600"></i>
            <span className="font-bold text-xl text-gray-800">Content Guardian</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            {user && (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                <Link to="/governance" className="text-gray-600 hover:text-gray-900">Governance</Link>
              </>
            )}
          </nav>

          {/* User Actions & Wallet */}
          <div className="hidden md:flex items-center space-x-4">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-gray-600">
                <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            )}
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
                >
                  {isConnected ? 'Disconnect' : 'Logout'}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link to="/" className="block py-2 text-gray-600 hover:text-gray-900">Home</Link>
            {user && (
              <>
                <Link to="/dashboard" className="block py-2 text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link to="/governance" className="block py-2 text-gray-600 hover:text-gray-900">
                  Governance
                </Link>
              </>
            )}
            
            {/* Wallet Connection - Mobile */}
            {!isConnected ? (
              <button
                onClick={() => {
                  connectWallet();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left py-2 text-blue-600 hover:text-blue-700"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="py-2 text-gray-600">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            )}
            
            {user ? (
              <>
                <span className="block py-2 text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 text-red-600 hover:text-red-700"
                >
                  {isConnected ? 'Disconnect' : 'Logout'}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block py-2 text-blue-600 hover:text-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
