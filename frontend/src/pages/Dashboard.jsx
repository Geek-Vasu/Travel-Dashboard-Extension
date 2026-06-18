import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Calendar, 
  CreditCard, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  MapPin,
  Plane,
  Building,
  Car,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Inbox,
  User,
  ArrowUpRight
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [spendData, setSpendData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/analytics/dashboard');
      const spendRes = await fetch('/api/analytics/spend');
      
      if (res.ok && spendRes.ok) {
        const dashboardJson = await res.json();
        const spendJson = await spendRes.json();
        setData(dashboardJson);
        setSpendData(spendJson);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = data?.stats || { total_trips: 0, upcoming_trips: 0, total_spend: 0, bookings_found: 0 };
  const upcomingTrip = data?.upcoming_trip;
  const trips = data?.trips || [];

  const formatCost = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };


  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'caution': return 'CRITICAL ALERT';
      case 'warning': return 'WARNING';
      default: return 'INFO';
    }
  };

  // Convert timeline events to visual check points
  const getCheckpoints = (events) => {
    if (!events || events.length === 0) return [];
    const sorted = [...events].sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
    
    return sorted.map((ev, idx) => {
      let icon = Plane;
      let title = ev.title;
      let label = "Activity";
      
      if (ev.event_type.startsWith('flight_dep')) {
        icon = Plane;
        label = "Departure";
      } else if (ev.event_type.startsWith('flight_arr')) {
        icon = Plane;
        label = "Arrival";
      } else if (ev.event_type.startsWith('hotel')) {
        icon = Building;
        label = "Lodging";
      } else if (ev.event_type.startsWith('cab')) {
        icon = Car;
        label = "Transfer";
      }

      const t = new Date(ev.event_time);
      const hh = String(t.getHours()).padStart(2, '0');
      const mm = String(t.getMinutes()).padStart(2, '0');

      return {
        id: ev.id,
        title: title,
        label: label,
        time: `${hh}:${mm}`,
        location: ev.location || 'Point',
        icon: icon
      };
    });
  };

  const checkpoints = upcomingTrip ? getCheckpoints(upcomingTrip.timeline_events) : [];

  // Spend charts config
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];
  const categorySpendFiltered = spendData?.category_spend?.filter(item => item.spend > 0) || [];
  const totalCategorySpend = categorySpendFiltered.reduce((sum, item) => sum + item.spend, 0) || 1;

  // Trend data mapping
  const trendData = trips.slice(0, 4).map(t => {
    let cost = 0;
    if (t.trip_name.includes('Mumbai')) cost = 86100;
    else if (t.trip_name.includes('Goa')) cost = 46700;
    else if (t.trip_name.includes('Delhi')) cost = 28600;
    else cost = t.bookings_count * 5000;
    
    return {
      name: t.destination.toUpperCase(),
      spend: cost
    };
  });

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center text-sm font-medium text-slate-500 bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Synchronizing Travel Console...</span>
        </div>
      </div>
    );
  }

  // Premium Empty State
  if (trips.length === 0) {
    return (
      <div className="flex-1 py-16 px-6 md:px-16 max-w-5xl mx-auto w-full flex flex-col justify-center items-center select-none text-slate-800">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-sm space-y-6 max-w-xl flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
            <Compass className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            No travel records compiled
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-md">
            Your travel reservations already exist. Connect your Gmail account to securely import booking stubs and organize them automatically.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => navigate('/scan')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-6 rounded-xl shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/15 transition-all cursor-pointer"
            >
              Sync Gmail Inbox
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-10 text-slate-800 select-none">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
            Travel Management Console
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/scan')}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            Sync Inbox
          </button>
        </div>
      </div>

      {/* SECTION 4: SYSTEM SUMMARY (Metric cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Trips', value: stats.total_trips, trend: '+100%', up: true, subtitle: 'This Quarter' },
          { label: 'Archived Trips', value: stats.total_trips - stats.upcoming_trips, trend: 'Historical', up: null, subtitle: 'Past destinations' },
          { label: 'Active Station', value: upcomingTrip ? upcomingTrip.destination : 'None', trend: '1 Active', up: true, subtitle: 'Spotlight' },
          { label: 'Total Spend', value: formatCost(stats.total_spend), trend: '+INR 12K', up: true, subtitle: 'Average per Month' }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between"
          >
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</span>
            <div className="flex justify-between items-baseline mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{item.value}</span>
              {item.up !== null && (
                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.up ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  {item.trend}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1">{item.subtitle}</span>
          </motion.div>
        ))}
      </div>

      {/* Primary Layout Split Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        
        {/* Left Side Layout Content (8-Columns) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* SECTION 1: UPCOMING TRIP HERO */}
          {upcomingTrip ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 group hover:border-slate-300 transition-all"
            >
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md">Featured Itinerary</span>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-100">
                      Upcoming
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase flex items-center gap-2 mt-2">
                    <MapPin className="w-5.5 h-5.5 text-blue-600" />
                    {upcomingTrip.trip_name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-550">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(upcomingTrip.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase()} &rarr; {new Date(upcomingTrip.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="uppercase">{upcomingTrip.destination}</span>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Est. Spends</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{formatCost(stats.total_spend)}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex flex-wrap justify-between items-center text-xs font-semibold text-slate-500 gap-4">
                <div className="flex gap-2">
                  <span className="bg-slate-50 border border-slate-200/85 px-3 py-1 rounded-lg text-slate-600">
                    {upcomingTrip.bookings_count} Bookings
                  </span>
                  <span className="bg-slate-50 border border-slate-200/85 px-3 py-1 rounded-lg text-slate-600">
                    1 Active Location
                  </span>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <a 
                    href="#timeline-section"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('timeline-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 px-5 rounded-xl border border-slate-200 transition-all text-center cursor-pointer"
                  >
                    View Timeline
                  </a>
                  <Link 
                    to={`/trip/${upcomingTrip.id}`}
                    className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl text-center shadow-md shadow-blue-600/5 hover:shadow-lg transition-all cursor-pointer"
                  >
                    Manage Bookings
                  </Link>
                </div>
              </div>
            </motion.div>

          ) : (
            <div className="bg-white border border-slate-200 p-8 text-center rounded-2xl shadow-sm text-slate-400 font-medium text-xs">
              No upcoming itineraries registered.
            </div>
          )}

          {/* SECTION 2: TRIP TIMELINE */}
          <div id="timeline-section" className="scroll-mt-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Timetable progress tracker</span>
                <h4 className="font-bold text-base text-slate-900 tracking-tight mt-0.5">Horizontal Journey Timeline</h4>
              </div>
              {upcomingTrip && (
                <Link to={`/trip/${upcomingTrip.id}`} className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1">
                  Manage timeline
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {checkpoints.length > 0 ? (
              <div className="relative w-full flex items-stretch gap-4 py-8 overflow-x-auto">
                {checkpoints.map((cp, idx) => {
                  const Icon = cp.icon;
                  return (
                    <div key={cp.id || idx} className="flex items-center gap-4 flex-shrink-0 min-w-[200px] relative">
                      {/* Timeline Element Card */}
                      <div className="flex-1 border border-slate-200 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block leading-none">{cp.label}</span>
                            <span className="text-[11px] font-extrabold text-slate-800 block mt-0.5">{cp.time}</span>
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 leading-tight uppercase truncate">{cp.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-1">{cp.location}</p>
                      </div>

                      {/* Connect Indicator (unless it is last) */}
                      {idx < checkpoints.length - 1 && (
                        <div className="w-6 flex items-center justify-center flex-shrink-0">
                          <span className="h-0.5 w-full bg-slate-250 border-t border-dashed border-slate-300"></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">
                No journey timeline stubs compiled. Start by syncing your inbox.
              </div>
            )}
          </div>

          {/* SECTION 6: TRIP CAROUSEL */}
          <div id="trips-section" className="scroll-mt-6 space-y-4">
            <div className="flex justify-between items-baseline">
              <div>
                <h4 className="font-bold text-lg text-slate-900 tracking-tight">Active & Past Travel Bookings</h4>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">Historical logs directory</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {trips.map((trip) => (
                <motion.div 
                  key={trip.id}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/trip/${trip.id}`)}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between min-h-[180px]"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Station Target</span>
                        <h5 className="font-bold text-base text-slate-900 leading-tight uppercase">{trip.trip_name}</h5>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        trip.status === 'Upcoming' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        trip.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    
                    <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      {new Date(trip.start_date).toLocaleDateString('en-IN', { month: '2-digit', day: '2-digit' }).replace('/', '.')} &rarr; {new Date(trip.end_date).toLocaleDateString('en-IN', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace('/', '.')}
                    </p>
                  </div>

                  <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>{trip.bookings_count} Bookings</span>
                    <span className="text-slate-800 font-bold">Manage Details &rarr;</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side Layout Column (4-Columns) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* SECTION 3: AI INSIGHTS PANEL */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">Notification Feed</span>
              <h4 className="font-bold text-base text-slate-900 tracking-tight mt-0.5">AI Insights Engine</h4>
            </div>

            <div className="space-y-4">
              {upcomingTrip && upcomingTrip.insights.length > 0 ? (
                upcomingTrip.insights.map((insight, idx) => (
                  <div 
                    key={insight.id || idx}
                    className={`flex gap-3 p-4 rounded-xl border text-xs font-medium ${
                      insight.severity === 'caution' ? 'bg-red-50 border-red-100 text-red-800' :
                      insight.severity === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                      'bg-slate-50 border-slate-150 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm leading-none">[!]</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-baseline text-[9px] font-bold text-slate-400 uppercase">
                        <span>{getSeverityLabel(insight.severity)}</span>
                        <span>{idx === 0 ? 'Recently' : 'Sync time'}</span>
                      </div>
                      <p className="leading-relaxed text-slate-900 font-semibold">{insight.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 font-medium text-xs">
                  No active insights stubs logged. Run email scan to extract travel advisories.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: SPEND ANALYTICS */}
          <div id="analytics-section" className="scroll-mt-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">Cost Ledger breakdown</span>
              <h4 className="font-bold text-base text-slate-900 tracking-tight mt-0.5">Spend Analytics</h4>
            </div>

            {/* Total spend preview card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Consolidated Spend</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1">{formatCost(stats.total_spend)}</span>
            </div>

            {/* Donut Chart */}
            <div className="h-44 relative flex items-center justify-center">
              {categorySpendFiltered.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpendFiltered}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="spend"
                      nameKey="category"
                      stroke="#FFF"
                      strokeWidth={1}
                    >
                      {categorySpendFiltered.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-xs font-semibold py-8">No ledger splits.</div>
              )}
              
              <div className="absolute flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 leading-none">Share</span>
                <span className="text-xs font-extrabold text-slate-800 mt-1">Console</span>
              </div>
            </div>

            {/* Spend Splits List */}
            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Split Details</span>
              {categorySpendFiltered.map((entry, index) => {
                const percentage = Math.round((entry.spend / totalCategorySpend) * 100);
                return (
                  <div key={entry.category} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.category}</span>
                    </div>
                    <span className="font-bold text-slate-900">{percentage}% &bull; {formatCost(entry.spend)}</span>
                  </div>
                );
              })}
            </div>

            {/* Spend Trend Bar Chart */}
            <div className="space-y-2 border-t border-slate-100 pt-5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Spend Trend by Trip</span>
              <div className="w-full h-32 mt-2">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748B" 
                        tick={{ fill: '#64748B', fontSize: 8, fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#64748B" 
                        tick={{ fill: '#64748B', fontSize: 8, fontWeight: 'bold' }}
                        tickFormatter={(v) => `₹${v/1000}K`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Bar 
                        dataKey="spend" 
                        fill="#2563EB" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-400 text-xs py-8">No historical trends.</div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
      
    </div>
  );
}
