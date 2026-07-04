import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CropCard from '../components/CropCard';
import { fetchCrops } from '../utils/api';
import { Sprout, ShieldCheck, Truck, Zap } from 'lucide-react';

function Home() {
  const [featuredCrops, setFeaturedCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedCrops = async () => {
      try {
        const response = await fetchCrops();
        if (response.data && response.data.crops) {
          // Take first 3 crops as featured crops
          setFeaturedCrops(response.data.crops.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load featured crops:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeaturedCrops();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col w-full text-left">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-emerald-900 text-white py-20 px-6 overflow-hidden">
        {/* Abstract blur highlights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full filter blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-emerald-400 rounded-full filter blur-3xl opacity-15 translate-x-1/4 translate-y-1/4"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <span className="bg-amber-400 text-emerald-950 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest">
              Direct Agri-Marketplace
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
              Direct Supply Chain <br />
              for Indian <span className="text-amber-400">Agriculture</span>.
            </h1>
            <p className="text-lg text-emerald-100/90 leading-relaxed max-w-lg">
              KisanSetu connects smallholder farmers directly to corporate and commercial buyers. Enjoy fair crop valuation, transparent pricing, and streamlined logistics.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/Signup" className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold text-base px-8 py-3 rounded-full transition-all shadow-lg">
                Register Account
              </Link>
              <Link to="/Login" className="border-2 border-emerald-500 hover:border-emerald-400 bg-emerald-800/40 hover:bg-emerald-800/75 text-white font-bold text-base px-8 py-3 rounded-full transition-all">
                Login Portal
              </Link>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-800">
              <img 
                src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=800" 
                alt="Harvest Fields" 
                className="w-full h-full object-cover animate-pulse-slow"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Counters */}
      <section className="bg-white py-10 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-800">₹10L+</p>
              <p className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider">Gross Sales Conducted</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-800">500+</p>
              <p className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider">Verified Farmers</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-800">50+</p>
              <p className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider">Commercial Buyers</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-800">0%</p>
              <p className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider">Middleman Commissions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Crops Marketplace Preview */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
          <div>
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-widest flex items-center mb-1">
              <Sprout className="h-4 w-4 mr-1 text-amber-500 fill-current" />
              Live Marketplace
            </span>
            <h2 className="text-3xl font-extrabold text-emerald-950">Active Crops Sourced Direct</h2>
          </div>
          <Link to="/Login" className="text-emerald-700 hover:text-emerald-600 font-bold text-sm flex items-center mt-3 md:mt-0 underline underline-offset-4">
            Browse All Crops in Portal →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-800 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-semibold">Fetching live farm listings...</p>
          </div>
        ) : featuredCrops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCrops.map((crop) => (
              <CropCard 
                key={crop._id} 
                crop={crop} 
                viewMode="guest" 
              />
            ))}
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center max-w-md mx-auto">
            <p className="text-emerald-900 font-bold mb-1">No crops listed currently</p>
            <p className="text-xs text-emerald-700">Please launch the server and login as farmer to add agricultural items!</p>
          </div>
        )}
      </section>

      {/* Supply Chain Pillars */}
      <section className="bg-emerald-950/5 py-16 border-t border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-emerald-950 mb-12 uppercase tracking-wide">Pillars of Our Supply Chain</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-950/5 flex flex-col items-start">
              <div className="bg-emerald-100 text-emerald-800 p-3 rounded-2xl mb-5 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 mb-2">100% Direct & Transparent</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We clear out layers of middlemen commission, enabling buyers to purchase directly at competitive prices while matching margins back to local growers.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-950/5 flex flex-col items-start">
              <div className="bg-emerald-100 text-emerald-800 p-3 rounded-2xl mb-5 flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 mb-2">Integrated Cold Logistics</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Complete transport tracking from harvest plots straight to buyer dock doors, checking crop safety indicators to retain high nutrition and freshness.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-950/5 flex flex-col items-start">
              <div className="bg-emerald-100 text-emerald-800 p-3 rounded-2xl mb-5 flex items-center justify-center">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 mb-2">Instant Account Cleared</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Direct-to-bank electronic transactions. Once crop shipments are checked at pick-up points, farmers receive single-installment net cash payouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;