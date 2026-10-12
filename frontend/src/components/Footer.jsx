import React from 'react';
import { Link } from 'react-router-dom';
import { Train, ShieldAlert, Cpu, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#0a162b] text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Train className="w-5 h-5" />
              </div>
              <span>RailBook <span className="text-orange-400">AI</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intelligent railway reservation platform powered by machine learning demand forecasts,
              real-time schedule tracking, and automated recommendations.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded-md w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Provider Core: Online</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Reservation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/search" className="hover:text-white transition">Search Trains</Link></li>
              <li><Link to="/ai-recommendations" className="hover:text-white transition">AI Smart Recommendation</Link></li>
              <li><Link to="/live-status" className="hover:text-white transition">Live Running Status</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition">Demand & Fare Trends</Link></li>
            </ul>
          </div>

          {/* Passenger tools */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Passenger Tools</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/my-bookings" className="hover:text-white transition">My Trips & E-Tickets</Link></li>
              <li><Link to="/profile" className="hover:text-white transition">User Profile & Account</Link></li>
              <li><a href="http://127.0.0.1:8000/api/docs/" target="_blank" rel="noreferrer" className="hover:text-white transition">API Documentation (Swagger)</a></li>
              <li><Link to="/admin-dashboard" className="hover:text-white transition">Operations Center</Link></li>
            </ul>
          </div>

          {/* Compliance & Disclosure */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Development Notice</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/70 p-3 rounded-xl border border-slate-800">
              This application is an educational & demonstration full-stack project.
              Ticket payments use a simulated sandbox gateway and live train running positions are provided
              for simulation and architectural integration testing.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} RailBook AI. Designed with React 19, Django REST Framework & Machine Learning.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>SQLite3 Architecture</span>
            <span>•</span>
            <span>JWT SimpleAuth</span>
            <span>•</span>
            <span>RandomForest Demand Model</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
