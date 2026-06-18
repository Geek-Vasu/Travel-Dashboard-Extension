import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowRight, CheckCircle2, AlertCircle, Inbox, ShieldCheck, FileText } from 'lucide-react';

export default function EmailScanner() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    is_scanning: false,
    processed: 0,
    total: 0,
    logs: []
  });
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);
  const logEndRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/scanner/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        
        if (!data.is_scanning) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startScan = async () => {
    setError(null);
    try {
      const res = await fetch('/api/scanner/scan', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok && (data.status === 'started' || data.status === 'already_scanning')) {
        await fetchStatus();
        if (!pollingRef.current) {
          pollingRef.current = setInterval(fetchStatus, 500);
        }
      } else {
        setError(data.message || 'Failed to initiate Gmail mailbox scan.');
      }
    } catch (err) {
      setError('Connection failure: API server is currently unreachable.');
    }
  };

  useEffect(() => {
    startScan();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status.logs]);

  const percentage = status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;
  const isFinished = !status.is_scanning && status.processed > 0 && status.processed === status.total;

  const getLogStatusBadge = (logStatus) => {
    switch (logStatus) {
      case 'completed': 
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold">Processed</span>;
      case 'processing': 
        return <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold animate-pulse">Syncing</span>;
      case 'failed': 
        return <span className="bg-red-50 text-red-600 border border-red-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold">Failed</span>;
      default: 
        return <span className="bg-slate-50 text-slate-400 border border-slate-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold">Waiting</span>;
    }
  };

  return (
    <div className="flex-1 py-12 px-6 md:px-16 max-w-4xl mx-auto w-full flex flex-col justify-center gap-8 select-none text-slate-800">
      
      {/* Title Header */}
      <div className="text-left space-y-2 max-w-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold uppercase tracking-wider">
          <RefreshCw className={`w-3.5 h-3.5 ${status.is_scanning ? 'animate-spin' : ''}`} />
          Inbox Sync Station
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Scanning your travel stubs
        </h2>
        <p className="text-sm font-medium text-slate-400">
          Syncing recent travel stubs and itineraries directly from your inbox archive.
        </p>
      </div>

      {/* Progress Board */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 flex flex-col gap-6 rounded-2xl shadow-sm">
        
        {/* Progress bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end font-semibold text-xs text-slate-500 uppercase tracking-wide">
            <div className="flex items-center gap-2">
              {status.is_scanning ? (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
              <span className={status.is_scanning ? "text-blue-600" : "text-slate-900"}>
                {status.is_scanning ? 'Scanning Gmail Inbox...' : isFinished ? 'Inbox sync completed successfully' : 'Scan inactive'}
              </span>
            </div>
            <span className="text-slate-900 font-bold">{status.processed} / {status.total} Analysed</span>
          </div>

          {/* Smooth Rounded Progress Bar */}
          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <motion.div 
              className="bg-blue-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap justify-between items-center gap-4 border-t border-slate-100 pt-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Active Filters: Flight, Hotel, Cab, Train stubs
          </div>
          
          <div className="flex gap-2.5">
            <button 
              onClick={startScan}
              disabled={status.is_scanning}
              className="py-2.5 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              Re-run Scan
            </button>

            {isFinished && (
              <button 
                onClick={() => navigate('/dashboard')}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/15 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 font-semibold text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Sync Logs Panel */}
      <div className="bg-white border border-slate-200 p-6 flex flex-col min-h-80 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4 text-slate-900 text-xs font-bold uppercase tracking-wider">
          <Inbox className="w-4.5 h-4.5 text-blue-600" />
          Extraction Pipeline logs
        </div>

        <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-slate-600 space-y-2 pr-2 max-h-96">
          {status.logs.length === 0 ? (
            <div className="text-slate-400 font-medium text-center py-12">
              Sync standby. Initializing Gmail query connection...
            </div>
          ) : (
            <div className="space-y-1.5">
              {status.logs.map((log, index) => (
                <div 
                  key={log.id || index} 
                  className="flex gap-4 items-center hover:bg-slate-50/80 py-2 px-3 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                >
                  <span className="text-slate-400 text-[10px] font-semibold w-16">
                    {new Date(log.processed_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <div className="flex-shrink-0 w-24 text-left">
                    {getLogStatusBadge(log.status)}
                  </div>
                  <div className="flex items-center gap-2 text-slate-800 font-semibold truncate flex-1">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{log.subject}</span>
                  </div>
                  {log.error_message && (
                    <span className="text-red-500 font-semibold text-[10px] truncate max-w-xs bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      {log.error_message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
