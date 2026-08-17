import React, { useEffect, useState } from 'react';
import { analyticsAPI, paymentAPI } from '../../services/api';
import { Card, Loading, PageHeader } from '../../components/common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6172f3','#f97316','#10b981','#f59e0b','#ef4444','#8b5cf6'];

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [occupancy, setOccupancy] = useState([]);
  const [payAnalytics, setPayAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getDashboard(),
      analyticsAPI.getOccupancy(),
      paymentAPI.getAnalytics({ year: new Date().getFullYear() }),
    ]).then(([d, o, p]) => {
      setDashboard(d.data.data);
      setOccupancy(o.data.data);
      setPayAnalytics(p.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const complaintCategoryData = (dashboard?.complaintsByCategory || []).map(c => ({
    name: c._id,
    count: c.count,
  }));

  const revenueData = (payAnalytics?.monthlyRevenue || []).map(m => ({
    month: m._id,
    revenue: m.total,
    count: m.count,
  }));

  const statusData = (payAnalytics?.statusBreakdown || []).map(s => ({
    name: s._id,
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics & Reports" description="Comprehensive hostel data insights" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${((payAnalytics?.totalCollected || 0) / 1000).toFixed(0)}K`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Amount', value: `₹${((payAnalytics?.totalPending || 0) / 1000).toFixed(0)}K`, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Occupancy Rate', value: `${dashboard?.stats?.occupancyRate || 0}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Students', value: dashboard?.stats?.activeStudents || 0, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(kpi => (
          <Card key={kpi.label} className={`p-5 ${kpi.bg}`}>
            <div className={`text-3xl font-display font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-slate-500 text-sm mt-1">{kpi.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Monthly Revenue ({new Date().getFullYear()})</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `₹${v/1000}K`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#6172f3" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Payment Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Occupancy report */}
      <Card className="p-6">
        <h3 className="font-display font-semibold text-slate-900 mb-4">Hostel Occupancy Report</h3>
        <div className="space-y-4">
          {occupancy.map(h => (
            <div key={h.hostel} className="flex items-center gap-4">
              <div className="w-40 flex-shrink-0">
                <p className="text-sm font-medium text-slate-800 truncate">{h.hostel}</p>
                <p className="text-xs text-slate-400">{h.type}</p>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{h.occupied} / {h.totalCapacity} beds</span>
                  <span className="font-semibold text-slate-700">{h.occupancyRate}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${parseFloat(h.occupancyRate) > 80 ? 'bg-red-400' : parseFloat(h.occupancyRate) > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${h.occupancyRate}%` }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-slate-700">{h.available}</p>
                <p className="text-xs text-slate-400">available</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Complaint categories */}
      <Card className="p-6">
        <h3 className="font-display font-semibold text-slate-900 mb-4">Complaints by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={complaintCategoryData} layout="vertical" barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
            <Tooltip />
            <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
