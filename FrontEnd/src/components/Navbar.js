import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, User, LayoutDashboard, Leaf } from 'lucide-react';

function Navbar({ cartCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'farmer') return '/farmer-dashboard';
    if (user.role === 'buyer') return '/buyer-dashboard';
    if (user.role === 'admin') return '/admin-dashboard';
    return '/';
  };

  return (
    <nav className="w-full bg-emerald-900 text-white sticky top-0 z-50 shadow-lg border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-amber-500 p-1.5 rounded-lg text-emerald-900 transition-transform group-hover:scale-105 flex items-center justify-center">
              <Leaf className="h-6 w-6 fill-current" />
            </div>
            <span className="text-xl md:text-2xl font-extrabold tracking-tight">
              किसान<span className="text-amber-400">Setu</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link to="/" className={`text-sm md:text-base font-medium transition-colors hover:text-amber-400 ${location.pathname === '/' ? 'text-amber-400' : 'text-gray-100'}`}>
              Home
            </Link>
            <Link to="/AboutUs" className={`text-sm md:text-base font-medium transition-colors hover:text-amber-400 ${location.pathname === '/AboutUs' ? 'text-amber-400' : 'text-gray-100'}`}>
              About Us
            </Link>

            {token && user ? (
              <>
                <Link to={getDashboardLink()} className={`flex items-center space-x-1 text-sm md:text-base font-medium transition-colors hover:text-amber-400 ${location.pathname.includes('dashboard') ? 'text-amber-400' : 'text-gray-100'}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
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

                <div className="flex items-center space-x-3 bg-emerald-800 px-3 py-1.5 rounded-full border border-emerald-700 max-w-[150px] sm:max-w-none">
                  <User className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-semibold truncate hidden md:inline max-w-[120px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="bg-amber-400 text-emerald-950 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider scale-90">
                    {user.role}
                  </span>
                </div>

                <button onClick={handleLogout} className="flex items-center space-x-1 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-emerald-950 px-3 py-1.5 rounded-full transition-all cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/Login" className="text-sm md:text-base font-semibold text-gray-100 hover:text-amber-400 transition-colors">
                  Login
                </Link>
                <Link to="/Signup" className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-sm md:text-base px-4 py-2 rounded-full transition-all shadow-md">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
