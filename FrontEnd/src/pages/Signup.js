import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { registerUser } from '../utils/api';
import { User, Lock, Mail, Phone, MapPin, Loader2, Sparkles } from 'lucide-react';

function SignupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('buyer'); // 'buyer' or 'farmer'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !location || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await registerUser({
        name,
        email,
        phone,
        location,
        password,
        role
      });
      
      if (response.data && response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (role === 'farmer') {
          navigate('/farmer-dashboard');
        } else {
          navigate('/buyer-dashboard');
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col w-full text-left">
      <Navbar />

      <div className="relative flex flex-grow items-center justify-center py-16 px-6 bg-emerald-950/5">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-lg border border-gray-150 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-600"></div>

          <h2 className="text-3xl font-black mb-1 text-emerald-950 flex items-center">
            <span>Get Started</span>
            <Sparkles className="h-6 w-6 text-amber-500 fill-current ml-2" />
          </h2>
          <p className="text-sm text-gray-500 mb-6 font-medium">Create your secure agritech profile</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`p-3 font-bold text-sm rounded-lg transition-all cursor-pointer ${role === 'buyer' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-500 hover:text-emerald-900'}`}
            >
              Register as Buyer
            </button>
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`p-3 font-bold text-sm rounded-lg transition-all cursor-pointer ${role === 'farmer' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-500 hover:text-emerald-900'}`}
            >
              Register as Farmer
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Full Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Singh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 outline-none text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 outline-none text-sm font-semibold"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Phone Number</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    pattern="[0-9]{10}"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 outline-none text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Operating Location</label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Ludhiana, Punjab"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 outline-none text-sm font-semibold"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Create Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 outline-none text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Confirm Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 outline-none text-sm font-semibold"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-base rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm">
            <span className="text-gray-500">Already registered?</span>
            <Link to="/Login" className="font-bold text-amber-600 hover:text-amber-700 cursor-pointer ml-1">
              Sign in here
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default SignupPage;