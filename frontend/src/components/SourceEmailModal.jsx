import React from 'react';
import { X, Mail, ExternalLink, AlertTriangle } from 'lucide-react';

export default function SourceEmailModal({ isOpen, onClose, email }) {
  if (!isOpen || !email) return null;

  const getConfidenceBadgeClass = (score) => {
    if (score >= 0.9) return 'premium-badge-success';
    if (score >= 0.7) return 'premium-badge-warning';
    return 'premium-badge-error';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 0.9) return 'VERIFIED';
    if (score >= 0.7) return 'REVIEW SUGGESTED';
    return 'NEEDS ATTENTION';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" 
        onClick={onClose}
      />
      
      {/* Modal Content - Soft Modern Panel */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight uppercase">Source Email Reference</h3>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">ID: {email.source_email_id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs font-semibold leading-relaxed">
          {/* Metadata Card */}
          <div className="p-5 border border-slate-250 bg-slate-50/30 rounded-xl space-y-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Subject</span>
              <span className="text-slate-800 font-bold text-sm uppercase block leading-tight">{email.source_subject || 'Untitled Subject'}</span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Confidence Rating</span>
                <div className="flex items-center gap-2">
                  <span className={`premium-badge ${getConfidenceBadgeClass(email.confidence_score)}`}>
                    {getConfidenceLabel(email.confidence_score)}
                  </span>
                  <span className="text-xs text-slate-450 font-bold font-mono">({Math.round(email.confidence_score * 105)}%)</span>
                </div>
              </div>
              
              <a 
                href={email.source_gmail_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md shadow-blue-600/5 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Inspect Gmail
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Snippet Block */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cleaned Email Payload</span>
            <div className="p-4 rounded-xl bg-slate-900 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-60 leading-relaxed border border-slate-800">
              {email.source_snippet || 'No email content payload.'}
            </div>
          </div>

          {email.confidence_score < 0.9 && (
            <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <span className="font-extrabold uppercase block mb-0.5">Verification Required</span>
                This record was extracted with lower certainty. Please check structural fields like cost, dates, or referencing IDs, and correct them directly in the travel stubs.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
}
