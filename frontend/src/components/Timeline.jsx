import React from 'react';
import { Calendar, Plane, Building, Train, Car, Clock } from 'lucide-react';

export default function Timeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-slate-200 bg-white rounded-2xl shadow-sm h-48">
        <Calendar className="w-8 h-8 mb-2 text-slate-400" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Operations Logged</p>
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'flight_dep':
      case 'flight_arr':
        return Plane;
      case 'hotel_checkin':
      case 'hotel_checkout':
        return Building;
      case 'train_dep':
      case 'train_arr':
        return Train;
      case 'cab_pickup':
        return Car;
      default:
        return Clock;
    }
  };

  const getEventTagLabel = (type) => {
    switch (type) {
      case 'flight_dep': return 'Departure';
      case 'flight_arr': return 'Arrival';
      case 'hotel_checkin': return 'Check-In';
      case 'hotel_checkout': return 'Check-Out';
      case 'train_dep': return 'Boarding';
      case 'train_arr': return 'Arrival';
      case 'cab_pickup': return 'Pickup';
      default: return 'Activity';
    }
  };

  const getEventColorClass = (type) => {
    switch (type) {
      case 'flight_dep':
      case 'flight_arr':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'hotel_checkin':
      case 'hotel_checkout':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'train_dep':
      case 'train_arr':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cab_pickup':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => new Date(a.event_time) - new Date(b.event_time));

  return (
    <div className="relative pl-6 select-none border-l-2 border-slate-200 space-y-6 max-w-2xl py-2">
      {sortedEvents.map((event, index) => {
        const eventTime = new Date(event.event_time);
        
        // Format time as 12-hour HH:MM AM/PM
        const timeStr = eventTime.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        const dateStr = eventTime.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric'
        }).toUpperCase();

        const Icon = getEventIcon(event.event_type);
        const tagLabel = getEventTagLabel(event.event_type);
        const colorClass = getEventColorClass(event.event_type);

        return (
          <div key={event.id || index} className="relative group">
            {/* Dot Node Indicator */}
            <div className={`absolute -left-[35px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-slate-300 group-hover:bg-blue-600 transition-colors z-10 shadow-sm`} />
            
            {/* Timeline Item Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-slate-350 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Date & Time Column */}
              <div className="flex flex-row md:flex-col items-baseline md:items-start gap-2 md:gap-0.5 md:w-24 flex-shrink-0">
                <span className="text-sm font-extrabold text-slate-800 tracking-tight">{timeStr}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider">{dateStr}</span>
              </div>

              {/* Event Badge & Description Column */}
              <div className="flex-1 flex items-start gap-3">
                <div className={`w-8.5 h-8.5 rounded-lg border flex items-center justify-center shadow-sm flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tagLabel}</span>
                    <span className="text-[10px] text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase">{event.location}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm leading-snug uppercase">{event.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{event.description}</p>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}
