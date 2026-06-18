import React, { useState } from 'react';
import { Plane, Hotel, Train, Car, Edit2, Check, RefreshCw, Mail } from 'lucide-react';

export default function BookingCard({ booking, onUpdate, onViewSource }) {
  const [isEditing, setIsEditing] = useState(false);
  const [provider, setProvider] = useState(booking.provider);
  const [cost, setCost] = useState(booking.cost);
  const [pnr, setPnr] = useState(booking.pnr || '');
  const [isSaving, setIsSaving] = useState(false);

  const getConfidenceBadge = (score) => {
    if (score >= 0.9) {
      return <span className="premium-badge premium-badge-success text-[10px]">Verified</span>;
    }
    if (score >= 0.7) {
      return <span className="premium-badge premium-badge-warning text-[10px]">Needs Review</span>;
    }
    return <span className="premium-badge premium-badge-error text-[10px]">Low Confidence</span>;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`/api/trips/${booking.trip_id}/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.toUpperCase(),
          cost: parseFloat(cost) || 0.0,
          pnr: pnr.toUpperCase()
        })
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdate(updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const details = booking.details || {};
  const costFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: booking.currency || 'INR',
    maximumFractionDigits: 0
  }).format(booking.cost);

  const renderDetails = () => {
    const valueStyle = "font-semibold text-slate-800 text-sm mt-0.5 block uppercase";
    const labelStyle = "text-[10px] text-slate-400 font-bold uppercase tracking-wider block";
    
    switch (booking.booking_type) {
      case 'flight':
        return (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <span className={labelStyle}>Route</span>
              <span className={valueStyle}>
                {(details.departure_city || 'N/A').slice(0, 3)} &rarr; {(details.arrival_city || 'N/A').slice(0, 3)}
              </span>
            </div>
            <div>
              <span className={labelStyle}>Flight Code</span>
              <span className={valueStyle}>{details.flight_number || 'N/A'}</span>
            </div>
            <div>
              <span className={labelStyle}>Departure</span>
              <span className={valueStyle}>
                {details.departure_time ? new Date(details.departure_time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
              </span>
            </div>
            <div>
              <span className={labelStyle}>Arrival</span>
              <span className={valueStyle}>
                {details.arrival_time ? new Date(details.arrival_time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
              </span>
            </div>
          </div>
        );
      case 'hotel':
        return (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="col-span-2">
              <span className={labelStyle}>Hotel Address</span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">{details.address || 'N/A'}</span>
            </div>
            <div>
              <span className={labelStyle}>Check-In</span>
              <span className={valueStyle}>
                {details.check_in ? new Date(details.check_in).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
            <div>
              <span className={labelStyle}>Check-Out</span>
              <span className={valueStyle}>
                {details.check_out ? new Date(details.check_out).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>
        );
      case 'train':
        return (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <span className={labelStyle}>Station Run</span>
              <span className={valueStyle}>
                {details.departure_station || 'N/A'} &rarr; {details.arrival_station || 'N/A'}
              </span>
            </div>
            <div>
              <span className={labelStyle}>Coach / Seat</span>
              <span className={valueStyle}>{details.seat_number || 'N/A'}</span>
            </div>
            <div>
              <span className={labelStyle}>Departure Time</span>
              <span className={valueStyle}>
                {details.departure_time ? new Date(details.departure_time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
              </span>
            </div>
            <div>
              <span className={labelStyle}>Arrival Time</span>
              <span className={valueStyle}>
                {details.arrival_time ? new Date(details.arrival_time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
              </span>
            </div>
          </div>
        );
      case 'cab':
        return (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="col-span-2">
              <span className={labelStyle}>Pickup Location</span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">{details.pickup_location || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className={labelStyle}>Destination Dropoff</span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">{details.dropoff_location || 'N/A'}</span>
            </div>
            <div>
              <span className={labelStyle}>Dispatch Time</span>
              <span className={valueStyle}>
                {details.pickup_time ? new Date(details.pickup_time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4 group hover:border-slate-300 hover:shadow-md transition-all">
      
      {/* Header section of Ticket */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
            {booking.booking_type === 'flight' && <Plane className="w-4.5 h-4.5" />}
            {booking.booking_type === 'hotel' && <Hotel className="w-4.5 h-4.5" />}
            {booking.booking_type === 'train' && <Train className="w-4.5 h-4.5" />}
            {booking.booking_type === 'cab' && <Car className="w-4.5 h-4.5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">{booking.provider}</h4>
              {getConfidenceBadge(booking.confidence_score)}
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
              {booking.booking_type} confirmation
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <span className="font-semibold text-sm text-slate-900 block font-mono">{costFormatted}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
            PNR: {booking.pnr || 'N/A'}
          </span>
        </div>
      </div>

      {/* Details list */}
      {renderDetails()}

      {/* Editing Drawer Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Provider ID</label>
              <input 
                type="text" 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-lg font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Reference PNR</label>
              <input 
                type="text" 
                value={pnr} 
                onChange={(e) => setPnr(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-lg font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Spend Total (INR)</label>
              <input 
                type="number" 
                value={cost} 
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-lg font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="py-1.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100/50 text-slate-700 font-semibold text-[11px] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-md shadow-blue-600/5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save Correction
            </button>
          </div>
        </form>
      )}

      {/* Options Tray */}
      {!isEditing && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold">
          <button 
            onClick={() => onViewSource(booking)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors py-1 uppercase tracking-wider text-[10px]"
          >
            <Mail className="w-3.5 h-3.5" />
            Verify Email Source
          </button>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors py-1 uppercase tracking-wider text-[10px]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Correct Stub
          </button>
        </div>
      )}
    </div>
  );
}
