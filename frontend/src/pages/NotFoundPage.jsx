import React from 'react';
import { Link } from 'react-router-dom';
import { Train, Home, Search, AlertCircle } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
        <Train className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-4xl font-black text-slate-900 tracking-tight block">404</span>
        <h1 className="text-xl font-bold text-slate-800">Wrong Platform! Page Not Found</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The coach or route you are looking for has either departed or does not exist on this line.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0f2444] hover:bg-[#1a3863] text-white font-bold text-xs shadow flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/search"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Search Trains</span>
        </Link>
      </div>
    </div>
  );
};
