import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, User, LayoutDashboard, Leaf, Menu, X } from 'lucide-react';

function Navbar({ cartCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    navigate('/');
    setIsMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'farmer') return '/farmer-dashboard';
    if (user.role === 'buyer') return '/buyer-dashboard';
    if (user.role === 'admin') return '/admin-dashboard';
    return '/';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="w-full bg-emerald-900 text-white sticky top-0 z-50 shadow-lg border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group" onClick={closeMenu}>
            <div className="bg-amber-500 p-1.5 rounded-lg text-emerald-900 transition-transform group-hover:scale-105 flex items-center justify-center">
              <Leaf className="h-6 w-6 fill-current" />
            </div>
            <span className="text-xl md:text-2xl font-extrabold tracking-tight">
              किसान<span className="text-amber-400">Setu</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`text-base font-medium transition-colors hover:text-amber-400 ${location.pathname === '/' ? 'text-amber-400' : 'text-gray-100'}`}>
              Home
            </Link>
            <Link to="/AboutUs" className={`text-base font-medium transition-colors hover:text-amber-400 ${location.pathname === '/AboutUs' ? 'text-amber-400' : 'text-gray-100'}`}>
              About Us
            </Link>

            {token && user ? (
              <>
                <Link to={getDashboardLink()} className={`flex items-center space-x-1 text-base font-medium transition-colors hover:text-amber-400 ${location.pathname.includes('dashboard') ? 'text-amber-400' : 'text-gray-100'}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                {user.role === 'buyer' && (
                  <Link to="/buyer-dashboard" className="relative p-1.5 text-gray-100 hover:text-amber-400 transition-colors">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-emerald-950 text-xs font-bold px-1.5 py-0.5 rounded-full scale-90">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="flex items-center space-x-3 bg-emerald-800 px-3 py-1.5 rounded-full border border-emerald-700">
                  <User className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm font-semibold truncate max-w-[120px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="bg-amber-400 text-emerald-950 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider scale-90">
                    {user.role}
                  </span>
                </div>

                <button onClick={handleLogout} className="flex items-center space-x-1 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-emerald-950 px-3 py-1.5 rounded-full transition-all cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/Login" className="text-base font-semibold text-gray-100 hover:text-amber-400 transition-colors">
                  Login
                </Link>
                <Link to="/Signup" className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-base px-4 py-2 rounded-full transition-all shadow-md">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {token && user && user.role === 'buyer' && (
              <Link to="/buyer-dashboard" className="relative p-1.5 text-gray-100 hover:text-amber-400 transition-colors mr-2" onClick={closeMenu}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-emerald-950 text-xs font-bold px-1.5 py-0.5 rounded-full scale-90">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-emerald-900 border-b border-emerald-800 shadow-xl pb-3 pt-2 px-2 space-y-1 absolute w-full">
          <Link
            to="/"
            onClick={closeMenu}
            className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'bg-emerald-800 text-amber-400' : 'text-gray-100 hover:bg-emerald-800 hover:text-amber-400'}`}
          >
            Home
          </Link>
          <Link
            to="/AboutUs"
            onClick={closeMenu}
            className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/AboutUs' ? 'bg-emerald-800 text-amber-400' : 'text-gray-100 hover:bg-emerald-800 hover:text-amber-400'}`}
          >
            About Us
          </Link>

          {token && user ? (
            <>
              <Link
                to={getDashboardLink()}
                onClick={closeMenu}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${location.pathname.includes('dashboard') ? 'bg-emerald-800 text-amber-400' : 'text-gray-100 hover:bg-emerald-800 hover:text-amber-400'}`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              
              <div className="flex items-center px-3 py-2 mt-2 border-t border-emerald-800">
                <div className="flex-shrink-0 bg-emerald-800 p-2 rounded-full">
                  <User className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user.name}</div>
                  <div className="text-xs font-medium text-emerald-300 uppercase tracking-wider">{user.role}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-2 flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-emerald-800 hover:text-red-200"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </>
          ) : (
            <div className="pt-4 pb-2 border-t border-emerald-800 space-y-2">
              <Link
                to="/Login"
                onClick={closeMenu}
                className="block w-full text-center px-4 py-2 text-base font-medium text-gray-100 hover:text-amber-400"
              >
                Login
              </Link>
              <Link
                to="/Signup"
                onClick={closeMenu}
                className="block w-full text-center px-4 py-2 border border-transparent text-base font-bold rounded-md text-emerald-950 bg-amber-500 hover:bg-amber-400"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
