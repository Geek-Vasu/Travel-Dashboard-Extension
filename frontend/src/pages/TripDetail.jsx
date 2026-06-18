import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Compass, Calendar, CreditCard, ChevronLeft, RefreshCw, AlertTriangle, Info, MapPin } from 'lucide-react';
import Timeline from '../components/Timeline';
import BookingCard from '../components/BookingCard';
import SourceEmailModal from '../components/SourceEmailModal';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'insights' | 'spend'
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const fetchTripDetails = async () => {
    try {
      const res = await fetch(`/api/trips/${id}`);
      if (res.ok) {
        const json = await res.json();
        setTrip(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center text-sm font-medium text-slate-500 bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading Route Timeline...</span>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none text-slate-800 bg-[#F8FAFC]">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Trip Record Not Found</h3>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleBookingUpdate = (updatedBooking) => {
    fetchTripDetails();
  };

  const handleViewSource = (booking) => {
    setSelectedEmail(booking);
    setIsModalOpen(true);
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'caution': return 'CRITICAL ALERT';
      case 'warning': return 'WARNING';
      default: return 'INFO';
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'caution': return 'bg-red-50 border-red-100 text-red-800';
      case 'warning': return 'bg-amber-50 border-amber-100 text-amber-800';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  // Category metrics computation
  const categories = { Flight: 0, Hotel: 0, Cab: 0, Train: 0 };
  let totalCost = 0;
  
  trip.bookings.forEach((b) => {
    const typeStr = b.booking_type.charAt(0).toUpperCase() + b.booking_type.slice(1);
    if (typeStr in categories) {
      categories[typeStr] += b.cost;
    }
    totalCost += b.cost;
  });

  const chartData = Object.keys(categories)
    .map((key) => ({ name: key, value: categories[key] }))
    .filter((c) => c.value > 0);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#64748B'];

  const formatCost = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="flex-1 py-10 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-8 select-none text-slate-800">
      
      {/* Header Navigation */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-355 py-2 px-4 rounded-xl shadow-sm self-start transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-blue-600" />
          Back to Dashboard
        </button>

        {/* Trip Summary Info */}
        <div className="flex justify-between items-start gap-6 flex-wrap border-b border-slate-250/60 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">{trip.trip_name}</h2>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                trip.status === 'Upcoming' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                trip.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                {trip.status}
              </span>
            </div>
            
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Destination: <span className="text-slate-850 font-bold">{trip.destination.toUpperCase()}</span>
            </p>
          </div>

          <div className="flex gap-4 font-semibold text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-right shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Dates</span>
              <span className="text-slate-800 font-mono">
                {new Date(trip.start_date).toLocaleDateString('en-IN', { month: '2-digit', day: '2-digit' }).replace('/', '.')} &rarr; {new Date(trip.end_date).toLocaleDateString('en-IN', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace('/', '.')}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-right min-w-[140px] shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Total Cost</span>
              <span className="text-base font-black text-slate-900 font-mono">{formatCost(totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Timeline and Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Itinerary timeline (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="font-bold text-sm uppercase text-slate-400 tracking-wider font-mono">
            Itinerary Route
          </h3>
          <Timeline events={trip.timeline_events} />
        </div>

        {/* Right Column: details, bookings, insights and spend (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Brutalist tabs replaced with rounded modern tab pills */}
          <div className="flex border-b border-slate-200 font-mono text-[11px] font-bold uppercase tracking-wider space-x-1.5 p-0.5">
            {[
              { id: 'bookings', label: `Bookings (${trip.bookings.length})` },
              { id: 'insights', label: `Insights (${trip.insights.length})` },
              { id: 'spend', label: 'Spend Share' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600 font-bold' 
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Tab Body */}
          <div className="space-y-4">
            
            {/* BOOKINGS LIST */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {trip.bookings.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm font-medium text-xs text-slate-400">
                    No travel stubs registered.
                  </div>
                ) : (
                  trip.bookings.map((booking) => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking} 
                      onUpdate={handleBookingUpdate}
                      onViewSource={handleViewSource}
                    />
                  ))
                )}
              </div>
            )}

            {/* INSIGHTS */}
            {activeTab === 'insights' && (
              <div className="space-y-4">
                {/* Trip AI Summary Banner */}
                {trip.ai_summary && (
                  <div className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                      Trip Overview
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold italic">
                      "{trip.ai_summary}"
                    </p>
                  </div>
                )}

                {/* Insights alert boxes */}
                <div className="space-y-3">
                  {trip.insights.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm font-medium text-xs text-slate-400">
                      No advisory insights generated.
                    </div>
                  ) : (
                    trip.insights.map((insight) => (
                      <div 
                        key={insight.id} 
                        className={`flex gap-3 p-4 border rounded-xl text-xs font-semibold font-mono ${getSeverityClass(insight.severity)}`}
                      >
                        <div className="font-extrabold">[!]</div>
                        <div className="space-y-0.5">
                          <span className="font-black text-[9px] tracking-wider block text-slate-400">{getSeverityLabel(insight.severity)}</span>
                          <span className="text-slate-800">{insight.message}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* EXPENSES PIE LEDGER */}
            {activeTab === 'spend' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col items-center">
                <div className="self-start mb-4">
                  <h4 className="font-bold text-base text-slate-900 tracking-tight">Ledger Splits</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Cost category</span>
                </div>

                {chartData.length === 0 ? (
                  <div className="text-slate-400 font-medium text-xs py-12">No cost ledger stubs consolidated.</div>
                ) : (
                  <div className="w-full space-y-6">
                    <div className="w-full h-44 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="#FFF"
                            strokeWidth={1}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Cost ledger list */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 font-mono text-xs font-semibold text-slate-700">
                      {chartData.map((entry, index) => (
                        <div key={entry.name} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span>{entry.name}</span>
                          </div>
                          <span className="font-bold text-slate-950">{formatCost(entry.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Traceability Modal */}
      <SourceEmailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        email={selectedEmail}
      />
    </div>
  );
}
