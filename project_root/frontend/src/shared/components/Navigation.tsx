import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Import the useAuth hook
// Example using lucide-react icons (install if needed: npm i lucide-react)
import { Menu, X } from 'lucide-react';

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth(); // Get auth state and logout function
  const mobileMenuRef = useRef<HTMLDivElement>(null); // Ref for the mobile menu container
  const menuButtonRef = useRef<HTMLButtonElement>(null); // Ref for the mobile menu button

  const activeClassName = "text-white bg-blue-700"; // Example active link style
  const inactiveClassName = "text-gray-300 hover:bg-blue-600 hover:text-white";
  const baseLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const mobileLinkClasses = `block ${baseLinkClasses}`; // Base classes for mobile links

  // Effect for focus management
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      // Find the first focusable element (link or button) in the menu
      const firstFocusableElement = mobileMenuRef.current.querySelector<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      firstFocusableElement?.focus();
    } else if (!isMobileMenuOpen && document.activeElement && mobileMenuRef.current?.contains(document.activeElement)) {
       // If menu is closed and focus is still inside, return focus to the button
        menuButtonRef.current?.focus();
    }
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    // Optional: redirect to home or login page after logout
    // navigate('/');
    setIsMobileMenuOpen(false); // Close mobile menu on logout
  };

  const closeMobileMenu = () => {
      setIsMobileMenuOpen(false);
  }

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-white text-xl font-bold" onClick={closeMobileMenu}>
              MyApp
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink
                to="/"
                className={({ isActive }: { isActive: boolean }) => `${baseLinkClasses} ${isActive ? activeClassName : inactiveClassName}`}
              >
                Home
              </NavLink>
              {isAuthenticated && ( // Conditionally render protected links
                <>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }: { isActive: boolean }) => `${baseLinkClasses} ${isActive ? activeClassName : inactiveClassName}`}
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/governance"
                    className={({ isActive }: { isActive: boolean }) => `${baseLinkClasses} ${isActive ? activeClassName : inactiveClassName}`}
                  >
                    Governance
                  </NavLink>
                </>
              )}
              {/* Login/Logout Link/Button */}
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className={`${baseLinkClasses} ${inactiveClassName}`} // Style as a link/button
                >
                  Logout
                </button>
              ) : (
                <NavLink
                  to="/login" // Assuming a /login route exists
                  className={({ isActive }: { isActive: boolean }) => `${baseLinkClasses} ${isActive ? activeClassName : inactiveClassName}`}
                >
                  Login
                </NavLink>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-blue-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close main menu' : 'Open main menu'} // More explicit label
            >
              <span className="sr-only">{isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" /> // Use X icon
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" /> // Use Menu icon
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to="/" onClick={closeMobileMenu} className={({ isActive }: { isActive: boolean }) => `${mobileLinkClasses} ${isActive ? activeClassName : inactiveClassName}`}>Home</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" onClick={closeMobileMenu} className={({ isActive }: { isActive: boolean }) => `${mobileLinkClasses} ${isActive ? activeClassName : inactiveClassName}`}>Dashboard</NavLink>
                <NavLink to="/governance" onClick={closeMobileMenu} className={({ isActive }: { isActive: boolean }) => `${mobileLinkClasses} ${isActive ? activeClassName : inactiveClassName}`}>Governance</NavLink>
              </>
            )}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className={`${mobileLinkClasses} w-full text-left ${inactiveClassName}`} // Style as a link/button
              >
                Logout
              </button>
            ) : (
              <NavLink to="/login" onClick={closeMobileMenu} className={({ isActive }: { isActive: boolean }) => `${mobileLinkClasses} ${isActive ? activeClassName : inactiveClassName}`}>Login</NavLink>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
