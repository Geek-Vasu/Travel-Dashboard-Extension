import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';

export default function SpendCharts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics/spend');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 text-sm font-semibold text-slate-500">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-blue-600" />
        Loading Ledger Records...
      </div>
    );
  }

  if (!data || (!data.category_spend && !data.monthly_spend)) {
    return (
      <div className="text-center py-12 border border-slate-200 bg-white rounded-2xl shadow-sm text-slate-400 font-medium text-xs">
        No travel cost logs detected.
      </div>
    );
  }

  const categoryColors = {
    'Flights': '#2563EB',
    'Hotels': '#10B981',
    'Cabs': '#F59E0B',
    'Trains': '#64748B'
  };

  const categoryColorsList = ['#2563EB', '#10B981', '#F59E0B', '#64748B'];

  const categorySpendFiltered = data.category_spend.filter(item => item.spend > 0);

  const formatCost = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-slate-200 font-semibold text-xs text-slate-800 rounded-xl shadow-md">
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">{payload[0].name}</span>
          <span className="block text-sm font-extrabold text-slate-900">{formatCost(payload[0].value)}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-slate-800">
      {/* Category Pie Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center select-none">
        <div className="self-start mb-6">
          <h4 className="font-bold text-sm tracking-tight text-slate-900 uppercase">Expense Distribution</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Segment Ledger Share</span>
        </div>
        
        {categorySpendFiltered.length === 0 ? (
          <div className="text-slate-400 font-semibold text-xs py-12">No spend records logged.</div>
        ) : (
          <div className="w-full h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySpendFiltered}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="spend"
                  nameKey="category"
                  stroke="#FFF"
                  strokeWidth={1}
                >
                  {categorySpendFiltered.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[entry.category] || categoryColorsList[index % 4]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-[11px] font-semibold text-slate-650 uppercase ml-1.5">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Monthly Spend Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 select-none">
        <div className="mb-6">
          <h4 className="font-bold text-sm tracking-tight text-slate-900 uppercase">Billing Period Flow</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Aggregate Travel Ledger</span>
        </div>

        {data.monthly_spend.length === 0 ? (
          <div className="text-slate-400 font-semibold text-xs py-12 text-center">No periodic logs found.</div>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_spend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  stroke="#64748B" 
                  tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748B" 
                  tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(v) => `₹${v/1000}K`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="spend" 
                  fill="#2563EB" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
