import React from 'react';
import { Leaf, Phone, Mail, MapPin } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-100 pt-12 pb-6 border-t border-emerald-900 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-left">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <div className="bg-amber-500 p-1.5 rounded-lg text-emerald-950 flex items-center justify-center">
                <Leaf className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                किसान<span className="text-amber-400">Setu</span>
              </span>
            </div>
            <p className="text-sm text-emerald-200/70 leading-relaxed">
              KisanSetu directly bridges the gap between Indian farmers and corporate buyers, ensuring fair harvest valuation, 0% middleman leakage, and transparent technology-enabled operations.
            </p>
          </div>

          {/* Quick Info Column */}
          <div className="text-left">
            <h4 className="text-white font-semibold text-base mb-4 uppercase tracking-wider">Features</h4>
            <ul className="space-y-2 text-sm text-emerald-200/70">
              <li>Direct Farmer-to-Buyer Market</li>
              <li>Transparent Revenue Analytics</li>
              <li>Encrypted JWT Session Authority</li>
              <li>Local Harvest Logistics Support</li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-3 text-left">
            <h4 className="text-white font-semibold text-base mb-4 uppercase tracking-wider">Get in Touch</h4>
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-amber-400" />
              <span>+91 9918383130</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-amber-400" />
              <span>kanhaiyamishra2005@gmail.com</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>Empowering Indian Agriculture Through Technology</span>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-900 pt-6 text-center text-xs text-emerald-300/50">
          <p>© {new Date().getFullYear()} KisanSetu Platform. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
