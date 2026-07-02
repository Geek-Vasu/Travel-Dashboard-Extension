import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map, 
  Calendar, 
  Sparkles, 
  BarChart3, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  Compass,
  User,
  LogOut,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ expanded, setExpanded }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Vasu Dev', email: 'vasu.dev@gmail.com' });

  useEffect(() => {
    // Fetch authenticated user info
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          if (data && data.email) {
            setUser({ name: data.name, email: data.email });
          }
        }
      } catch (e) {
        console.error('Failed to fetch user:', e);
      }
    };
    fetchUser();
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', type: 'link' },
    { name: 'Trips', icon: Map, path: '/dashboard#trips', type: 'scroll', targetId: 'trips-section' },
    { name: 'Timeline', icon: Calendar, path: '/dashboard#timeline', type: 'scroll', targetId: 'timeline-section' },
    { name: 'Google Calendar', icon: ExternalLink, path: 'https://calendar.google.com/', type: 'external' },
    { name: 'Insights', icon: Sparkles, path: '/validate', type: 'link' },
    { name: 'Analytics', icon: BarChart3, path: '/dashboard#analytics', type: 'scroll', targetId: 'analytics-section' },
    { name: 'Settings', icon: Settings, path: '#settings', type: 'modal' },
  ];

  const handleNavClick = (item, e) => {
    if (item.type === 'scroll') {
      e.preventDefault();
      if (location.pathname !== '/dashboard') {
        navigate(item.path);
        // Wait for navigation and then scroll
        setTimeout(() => {
          const element = document.getElementById(item.targetId);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        const element = document.getElementById(item.targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update hash in URL
        window.history.pushState(null, null, item.path);
      }
    } else if (item.type === 'modal') {
      e.preventDefault();
      alert('Settings & Simulation toggles are available in the top right console badge.');
    } else if (item.type === 'external') {
      e.preventDefault();
      window.open(item.path, '_blank');
    }
  };

  return (
    <motion.div 
      animate={{ width: expanded ? 260 : 80 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 h-screen bg-white border-r border-slate-200 flex flex-col justify-between z-40 select-none shadow-sm"
    >
      <div className="flex flex-col">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 cursor-pointer overflow-hidden whitespace-nowrap"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm">
              T
            </div>
            {expanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="flex flex-col"
              >
                <span className="font-semibold text-sm tracking-tight text-slate-900 leading-none">
                  Travelista
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
                  Consumer Portal
                </span>
              </motion.div>
            )}
          </div>

          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Pills */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.type === 'link' 
              ? location.pathname === item.path 
              : location.pathname === '/dashboard' && location.hash === item.path.substring(item.path.indexOf('#'));

            const Icon = item.icon;

            return (
              <a
                key={item.name}
                href={item.path}
                onClick={(e) => handleNavClick(item, e)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                
                {expanded ? (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="truncate font-medium"
                  >
                    {item.name}
                  </motion.span>
                ) : (
                  <div className="absolute left-16 bg-slate-950 text-white text-[11px] font-medium px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* User Section / Bottom Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        {expanded ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs text-slate-800 truncate leading-none">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">
                  {user.email}
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                // Mock logout
                alert('Disconnecting account...');
                navigate('/');
              }}
              title="Disconnect Account"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center group relative">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors">
              <User className="w-5 h-5" />
            </div>
            <div className="absolute left-16 bottom-2 bg-slate-950 text-white text-[11px] font-medium px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {user.name} ({user.email})
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
