import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../../services/api';
import { StatCard, Loading, Badge, Card } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import {
  Users, DoorOpen, CreditCard,
  AlertCircle, TrendingUp, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CATEGORY_COLORS = {
  electricity: '#f59e0b',
  water: '#3b82f6',
  internet: '#8b5cf6',
  maintenance: '#ef4444',
  food: '#10b981',
  security: '#f97316',
  other: '#6b7280',
};

const PIE_COLORS = ['#6172f3', '#f97316', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(({ data }) => setData(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const stats = data?.stats || {};

  const complaintPieData = (data?.complaintStats || []).map((s) => ({
    name: s._id?.replace(/_/g, ' '),
    value: s.count,
  }));

  const revenuePeriods = (data?.revenueChart || []).map((r) => ({
    month: `${r._id.month?.substring(0, 3)} ${r._id.year}`,
    revenue: r.total,
  }));

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h2 className="font-display text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-primary-100 mt-1 text-sm">Here's what's happening in your hostels today.</p>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <div className="text-xs text-primary-100">Occupancy Rate</div>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
            <div className="text-2xl font-bold">₹{(stats.monthlyRevenue / 1000).toFixed(0)}K</div>
            <div className="text-xs text-primary-100">This Month</div>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
            <div className="text-2xl font-bold">{stats.todayVisitors}</div>
            <div className="text-xs text-primary-100">Visitors Today</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.activeStudents} icon={Users} color="blue" subtitle={`${stats.totalStudents} registered`} />
        <StatCard title="Available Rooms" value={stats.availableRooms} icon={DoorOpen} color="green" subtitle={`${stats.totalRooms} total rooms`} />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={CreditCard} color="orange" subtitle="Need attention" />
        <StatCard title="Open Complaints" value={stats.pendingComplaints} icon={AlertCircle} color="red" subtitle="Awaiting response" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-slate-900">Revenue Trend</h3>
              <p className="text-slate-400 text-xs">Monthly rent collections</p>
            </div>
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-primary-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenuePeriods} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v / 1000}K`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#6172f3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Complaints pie */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-slate-900">Complaints</h3>
              <p className="text-slate-400 text-xs">By status</p>
            </div>
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-orange-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={complaintPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {complaintPieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent complaints */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Recent Complaints</h3>
          <div className="space-y-3">
            {(data?.recentComplaints || []).map((c) => (
              <div key={c._id} className="flex items-start justify-between gap-3 pb-3 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: CATEGORY_COLORS[c.category] || '#94a3b8' }} />
                    <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 ml-4">#{c.ticketNumber} · {c.category}</p>
                </div>
                <Badge status={c.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent payments */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {(data?.recentPayments || []).map((p) => (
              <div key={p._id} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.student?.name}</p>
                  <p className="text-xs text-slate-400">{p.month} · {p.student?.rollNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">₹{p.amount?.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-400">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
