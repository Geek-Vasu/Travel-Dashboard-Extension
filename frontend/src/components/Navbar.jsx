import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, RefreshCw, Sparkles } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/80 py-3.5 px-6 md:px-16 flex justify-between items-center select-none shadow-sm">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
          T
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-slate-900 leading-none">
            Travelista
          </span>
          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
            Automatic Travel Planner
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Link 
          to="/dashboard" 
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          Dashboard console
        </Link>
        
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-3 py-1 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Simulation Active</span>
        </div>
      </div>
    </nav>
  );
}
