import React, { useEffect, useState } from 'react';
import { analyticsAPI, complaintAPI, visitorAPI } from '../../services/api';
import { Card, StatCard, Badge, Loading } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { DoorOpen, AlertCircle, UserCheck, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WardenDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getDashboard(),
      complaintAPI.getAll({ status: 'pending' }),
      visitorAPI.getAll({ status: 'checked_in' }),
    ]).then(([d, c, v]) => {
      setData(d.data.data);
      setComplaints(c.data.data);
      setVisitors(v.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  const stats = data?.stats || {};

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-700 rounded-2xl p-6 text-white">
        <h2 className="font-display text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-blue-100 mt-1 text-sm">Warden Dashboard — Hostel Status</p>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/15 rounded-xl px-4 py-2.5 text-center">
            <div className="text-xl font-bold">{stats.occupancyRate}%</div>
            <div className="text-xs text-blue-100">Occupancy</div>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2.5 text-center">
            <div className="text-xl font-bold">{visitors.length}</div>
            <div className="text-xs text-blue-100">Visitors Inside</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Available Rooms" value={stats.availableRooms} icon={DoorOpen} color="green" />
        <StatCard title="Active Students" value={stats.activeStudents} icon={UserCheck} color="blue" />
        <StatCard title="Pending Complaints" value={stats.pendingComplaints} icon={AlertCircle} color="orange" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={CreditCard} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-slate-900">Pending Complaints</h3>
            <Link to="/warden/complaints" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          {complaints.length === 0 ? <p className="text-slate-400 text-sm text-center py-6">🎉 No pending complaints!</p> : (
            <div className="space-y-3">
              {complaints.slice(0, 5).map(c => (
                <div key={c._id} className="flex items-start justify-between gap-3 pb-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.student?.name} · {c.category} · #{c.ticketNumber}</p>
                  </div>
                  <Badge status={c.priority} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-slate-900">Active Visitors</h3>
            <Link to="/warden/visitors" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          {visitors.length === 0 ? <p className="text-slate-400 text-sm text-center py-6">No visitors currently inside</p> : (
            <div className="space-y-3">
              {visitors.slice(0, 5).map(v => (
                <div key={v._id} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{v.visitorName}</p>
                    <p className="text-xs text-slate-400">Visiting {v.student?.name} · {new Date(v.entryTime).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</p>
                  </div>
                  <Badge status={v.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
