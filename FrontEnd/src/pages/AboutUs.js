import React from 'react';
import { User, Globe, Shield, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function AboutUs() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        {/* Hero Banner */}
        <div className="bg-emerald-800 text-white p-10 rounded-3xl shadow-xl mb-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 w-32 h-32 rounded-full filter blur-2xl opacity-20 -mr-10 -mt-10"></div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Empowering Indian Farmers</h1>
          <p className="text-lg md:text-xl font-medium max-w-3xl mx-auto text-emerald-100">
            KisanSetu is a tech-enabled agricultural supply chain platform that directly connects rural growers with bulk purchasers, ensuring fair prices and transparency.
          </p>
        </div>

        {/* Core Values Section */}
        <h2 className="text-3xl font-extrabold text-emerald-950 text-center mb-10">Our Core Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-emerald-600 hover:shadow-lg transition-all text-left">
            <div className="p-3 w-min rounded-full mb-4 bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-2">Digital Marketplace</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We eliminate intermediaries by letting farmers list crops directly, helping buyers purchase authentic, fresh farm harvest with ease.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-amber-500 hover:shadow-lg transition-all text-left">
            <div className="p-3 w-min rounded-full mb-4 bg-amber-100 text-amber-700 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-2">Secure Transactions</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              With encrypted JWT authentication, role-based dashboards, and structured order statuses, every purchase is protected and accounted for.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-emerald-600 hover:shadow-lg transition-all text-left">
            <div className="p-3 w-min rounded-full mb-4 bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-2">Transparent Pricing</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Zero hidden commissions. Buyers get competitive market rates and farmers take home the direct value of their intensive hard work.
            </p>
          </div>
        </div>
        
        {/* Founders section */}
        <div className="text-center pt-10 border-t border-gray-200 mb-6">
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-8">Meet the Core Team</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-12">
            <div className="w-48 text-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 h-28 w-28 rounded-full mx-auto mb-4 flex items-center justify-center text-emerald-700">
                <User className="h-12 w-12" />
              </div>
              <h4 className="font-bold text-lg text-emerald-950">Kanhaiya Mishra</h4>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-1">Lead Architect</p>
            </div>
            {/* <div className="w-48 text-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 h-28 w-28 rounded-full mx-auto mb-4 flex items-center justify-center text-emerald-700">
                <User className="h-12 w-12" />
              </div>
              <h4 className="font-bold text-lg text-emerald-950">Arjun Singh</h4>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-1">Agritech Operations</p>
            </div> */}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default AboutUs;