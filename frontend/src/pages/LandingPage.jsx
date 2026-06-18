import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Compass, BarChart3, ArrowRight, Calendar, Sparkles, MapPin, Inbox, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      
      if (data.status === 'oauth_available') {
        window.location.href = data.url;
      } else {
        navigate('/scan');
      }
    } catch (err) {
      console.error(err);
      navigate('/scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col py-16 px-6 md:px-16 max-w-7xl mx-auto w-full space-y-20 select-none text-slate-800">
      
      {/* Hero Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 max-w-3xl text-left"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wider">
          <Inbox className="w-3.5 h-3.5" />
          Inbox Organization System
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Your travel plans, <br />
          <span className="text-blue-600">organized automatically</span>
        </h1>
        
        <p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-xl font-medium">
          Travelista securely scans your email confirmation stubs, classifies bookings, and compiles unified timelines and spend details into an elegant dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <button 
            onClick={handleConnect}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/15 flex items-center justify-center gap-2 group cursor-pointer"
          >
            Connect Gmail Account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          
          <button 
            onClick={() => navigate('/scan')}
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-3.5 rounded-xl text-sm transition-all border border-slate-200 shadow-sm cursor-pointer"
          >
            Launch Simulation Mode
          </button>
        </div>
      </motion.div>

      {/* Featured Preview Component */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full"
      >
        
        {/* Next Trip Showcase (Itinerary-style Card - 8-Columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex flex-col justify-between min-h-[360px] relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Next Upcoming Destination
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  Mumbai Business Trip
                </h2>
              </div>
              <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Upcoming
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/50">
              <Calendar className="w-4 h-4" />
              15 Jul &rarr; 18 Jul, 2026
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-6 mt-8 flex flex-wrap justify-between items-center text-xs font-semibold text-slate-400 gap-4">
            <div className="flex gap-2">
              <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md">Flights</span>
              <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md">Hotel</span>
              <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md">Transfer</span>
            </div>
            <span className="text-slate-900 font-bold text-sm bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
              3 Bookings &bull; ₹86,100 Spend
            </span>
          </div>
        </div>

        {/* Console Overview Sidebar Panel (4-Columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[360px] hover:border-slate-300 transition-all">
          <div className="space-y-6">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Dashboard Overview
            </span>
            
            <div className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 uppercase">Total Trips</span>
                <span className="text-slate-950 font-bold">3</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 uppercase">Active Destination</span>
                <span className="text-slate-950 font-bold">Delhi</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 uppercase">Archived Trips</span>
                <span className="text-slate-950 font-bold">1 (Goa)</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 uppercase">Total Spends</span>
                <span className="text-slate-950 font-bold">₹86,100</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Gmail API Integration Sandboxed</span>
            </div>
          </div>
        </div>

      </motion.div>

      {/* Feature Section: Operational Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full border-t border-slate-200/80 pt-16">
        
        {/* Module 1: Journey Timeline */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">Journey Timetable</h4>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Unified chronological schedule</span>
          </div>
          
          <div className="space-y-3.5 pt-2 text-xs font-semibold text-slate-700">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-blue-600">07:00 AM</span>
              <span className="text-slate-800">Flight DEL &rarr; BOM</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-blue-600">09:15 AM</span>
              <span className="text-slate-800">Arrival Mumbai (BOM)</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-blue-600">10:00 AM</span>
              <span className="text-slate-800">Prepaid Cab Transfer</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-blue-600">12:00 PM</span>
              <span className="text-slate-800">Taj Lands End Check-In</span>
            </div>
          </div>
        </div>

        {/* Module 2: AI Insights Warnings */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">Actionable Alerts</h4>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Intelligent checking rules</span>
          </div>
          
          <div className="space-y-2.5 pt-2 text-[11px] font-semibold">
            <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
              <span className="font-bold">⚠️</span>
              <span>Carry physical Government ID for hotel check-in</span>
            </div>
            <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
              <span className="font-bold">⚠️</span>
              <span>Return Flight reservation not found</span>
            </div>
            <div className="flex gap-2 p-3 rounded-xl bg-slate-50 border border-slate-150 text-slate-600">
              <span className="font-bold">ℹ️</span>
              <span>Taj check-in counter opens at 2:00 PM</span>
            </div>
          </div>
        </div>

        {/* Module 3: Spend Analytics Preview */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">Spend Share</h4>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Financial splits & categories</span>
          </div>
          
          <div className="space-y-3.5 pt-2 text-xs font-semibold text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400">Flight Bookings</span>
              <span className="text-slate-800 font-bold">₹28,700</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400">Hotel Bookings</span>
              <span className="text-slate-800 font-bold">₹54,000</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400">Cab Transfers</span>
              <span className="text-slate-800 font-bold">₹3,400</span>
            </div>
            <div className="flex justify-between items-center pt-2 font-extrabold text-slate-950 text-sm">
              <span>Total Travel Cost</span>
              <span className="text-blue-600">₹86,100</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
