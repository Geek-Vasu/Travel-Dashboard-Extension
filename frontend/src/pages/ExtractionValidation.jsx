import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ShieldCheck, Mail, ArrowUpRight, Search, FileText } from 'lucide-react';

export default function ExtractionValidation() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'travel', 'non-travel', 'failed', 'low-confidence'
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scanner/validation');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const getConfidenceBadge = (score) => {
    if (score === null || score === undefined) return null;
    if (score >= 0.9) return <span className="premium-badge premium-badge-success text-[10px]">{(score * 100).toFixed(0)}% Conf</span>;
    if (score >= 0.7) return <span className="premium-badge premium-badge-warning text-[10px]">{(score * 100).toFixed(0)}% Conf</span>;
    return <span className="premium-badge premium-badge-error text-[10px]">{(score * 100).toFixed(0)}% Conf</span>;
  };

  const filteredRecords = records.filter(rec => {
    if (filter === 'travel') return rec.is_travel === true;
    if (filter === 'non-travel') return rec.is_travel === false;
    if (filter === 'failed') return rec.status === 'failed';
    if (filter === 'low-confidence') return rec.is_travel === true && rec.confidence_score !== null && rec.confidence_score < 0.85;
    return true;
  });

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  return (
    <div className="flex-1 py-10 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-8 select-none text-slate-800">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-slate-200/60 pb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Extraction Validation</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
            Pipeline Audit & Quality Assurance
          </p>
        </div>
        <button 
          onClick={fetchRecords} 
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-355 text-slate-700 font-semibold text-xs py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Registry List (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Filters Row */}
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider">
            {['all', 'travel', 'non-travel', 'failed', 'low-confidence'].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setSelectedRecordId(null); }}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  filter === f 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 bg-white z-10">
                  <th className="py-3.5 px-5">Subject</th>
                  <th className="py-3.5 px-5">Sender</th>
                  <th className="py-3.5 px-5 text-center">Type</th>
                  <th className="py-3.5 px-5 text-center">Conf</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && records.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-slate-400 font-medium">Synchronizing audit data...</td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-slate-400 font-medium">No matching audit logs found.</td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr 
                      key={rec.id}
                      onClick={() => setSelectedRecordId(rec.id)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        selectedRecordId === rec.id ? 'bg-blue-50/50 hover:bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-5 max-w-[200px] truncate text-slate-900 font-bold uppercase">
                        {rec.subject || '(No Subject)'}
                      </td>
                      <td className="py-3 px-5 max-w-[140px] truncate text-slate-500 font-medium">
                        {rec.sender || 'Unknown'}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {rec.is_travel === true ? (
                          <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">
                            {rec.booking?.booking_type || 'Travel'}
                          </span>
                        ) : rec.is_travel === false ? (
                          <span className="bg-slate-50 text-slate-400 border border-slate-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">
                            Ignored
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {getConfidenceBadge(rec.confidence_score)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {rec.status === 'completed' && <CheckCircle className="w-4.5 h-4.5 text-emerald-500 mx-auto" />}
                        {rec.status === 'failed' && <XCircle className="w-4.5 h-4.5 text-red-500 mx-auto" />}
                        {rec.status === 'processing' && <RefreshCw className="w-4.5 h-4.5 text-blue-600 animate-spin mx-auto" />}
                        {rec.status === 'pending' && <span className="w-2.5 h-2.5 rounded-full bg-slate-300 block mx-auto" />}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-slate-400 font-medium tracking-wide">
            Showing {filteredRecords.length} of {records.length} registered stubs.
          </div>
        </div>

        {/* Right Column: Detail Audit Panel (5 Columns) */}
        <div className="lg:col-span-5">
          {selectedRecord ? (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6 text-xs max-h-[720px] overflow-y-auto">
              
              {/* Header */}
              <div className="border-b border-slate-100 pb-4 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Manifest audit trail</span>
                <h3 className="text-sm font-bold text-slate-900 uppercase truncate mt-1 leading-tight flex items-center gap-1.5">
                  <FileText className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                  {selectedRecord.subject}
                </h3>
                <div className="text-[11px] text-slate-500 font-semibold space-y-0.5">
                  <p>Sender: <span className="text-slate-800">{selectedRecord.sender || 'Unknown'}</span></p>
                  <p>Execution Status: <span className="text-slate-850 font-bold uppercase">{selectedRecord.status}</span></p>
                </div>
              </div>

              {/* Status metrics grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Classification</span>
                  <span className="font-extrabold text-[11px] block mt-1 uppercase text-slate-800">
                    {selectedRecord.is_travel === true ? 'Travel Confirmed' : selectedRecord.is_travel === false ? 'Ignored (Spam/System)' : 'Pending'}
                  </span>
                </div>
                <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Confidence Score</span>
                  <span className="font-extrabold text-[11px] block mt-1 text-slate-800">
                    {selectedRecord.confidence_score !== null ? (selectedRecord.confidence_score * 100).toFixed(0) + '%' : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Error log if failed */}
              {selectedRecord.error_message && (
                <div className="border border-red-100 bg-red-50 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-bold">
                    <ShieldCheck className="w-4 h-4 text-red-500" />
                    <span>Pipeline Execution Failure</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-[10px] text-red-650 bg-white p-2.5 rounded-lg border border-red-100 overflow-x-auto">{selectedRecord.error_message}</pre>
                </div>
              )}

              {/* Trip & Timeline info if compiled */}
              {selectedRecord.trip && (
                <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/20">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Assigned Trip Directory</span>
                    <button 
                      onClick={() => navigate(`/trip/${selectedRecord.trip_id}`)}
                      className="text-blue-600 hover:text-blue-700 font-bold uppercase text-[10px] flex items-center gap-0.5 cursor-pointer"
                    >
                      Trip Page
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-900 uppercase">
                    {selectedRecord.trip.trip_name} ({selectedRecord.trip.destination})
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {new Date(selectedRecord.trip.start_date).toLocaleDateString('en-IN').replace('/', '.')} &rarr; {new Date(selectedRecord.trip.end_date).toLocaleDateString('en-IN').replace('/', '.')}
                  </div>

                  {/* Timeline Preview */}
                  <div className="pt-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-2">Timeline Checkpoints</span>
                    <div className="space-y-2 border-l border-slate-200 pl-3.5">
                      {selectedRecord.trip.timeline_events?.map((ev, idx) => (
                        <div key={idx} className="text-[10px] relative">
                          <div className="absolute w-2 h-2 rounded-full bg-slate-350 left-[-18.5px] top-1" />
                          <span className="font-bold text-blue-600">{new Date(ev.event_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className="text-slate-900 font-bold uppercase pl-1.5">{ev.title}</span>
                          <span className="text-slate-400 block text-[9px] font-semibold mt-0.5">{ev.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* JSON code block logs */}
              <div className="space-y-4 pt-2">
                
                {/* Cleaned Email sent to OpenAI */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cleaned Email Payload</span>
                  <div className="bg-slate-900 text-slate-200 p-3 rounded-xl max-h-36 overflow-y-auto text-[10px] whitespace-pre-wrap font-mono leading-relaxed border border-slate-800">
                    {selectedRecord.cleaned_body || '(Empty Body)'}
                  </div>
                </div>

                {/* Raw Email Text */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Raw Email Source</span>
                  <div className="bg-slate-900 text-slate-200 p-3 rounded-xl max-h-36 overflow-y-auto text-[10px] whitespace-pre-wrap font-mono leading-relaxed border border-slate-800">
                    {selectedRecord.raw_body || '(Empty Body)'}
                  </div>
                </div>

                {/* OpenAI Response */}
                {selectedRecord.openai_response && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">OpenAI Response Output</span>
                    <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl max-h-48 overflow-y-auto text-[10px] font-mono leading-relaxed border border-slate-800">
                      {JSON.stringify(JSON.parse(selectedRecord.openai_response), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Final Stored JSON */}
                {selectedRecord.booking && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Stored Database Records JSON</span>
                    <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl max-h-48 overflow-y-auto text-[10px] font-mono leading-relaxed border border-slate-800">
                      {JSON.stringify({
                        id: selectedRecord.booking.id,
                        trip_id: selectedRecord.booking.trip_id,
                        booking_type: selectedRecord.booking.booking_type,
                        provider: selectedRecord.booking.provider,
                        cost: selectedRecord.booking.cost,
                        currency: selectedRecord.booking.currency,
                        pnr: selectedRecord.booking.pnr,
                        source_email_id: selectedRecord.booking.source_email_id,
                        source_subject: selectedRecord.booking.source_subject,
                        source_sender: selectedRecord.booking.source_sender,
                        source_snippet: selectedRecord.booking.source_snippet,
                        source_gmail_link: selectedRecord.booking.source_gmail_link,
                        confidence_score: selectedRecord.booking.confidence_score,
                        details: selectedRecord.booking.details
                      }, null, 2)}
                    </pre>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="border border-dashed border-slate-250 bg-slate-50/50 p-12 text-center text-slate-400 font-semibold text-xs rounded-2xl h-full min-h-[400px] flex items-center justify-center select-none">
              Select an email transaction record from the left table to inspect the extraction payload.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
