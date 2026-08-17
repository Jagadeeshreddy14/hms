import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { notificationAPI } from '../../services/api';

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/hostels': 'Hostel Management',
  '/admin/rooms': 'Room Management',
  '/admin/students': 'Student Management',
  '/admin/payments': 'Payment Management',
  '/admin/complaints': 'Complaints',
  '/admin/visitors': 'Visitor Management',
  '/admin/analytics': 'Analytics',
  '/warden': 'Warden Dashboard',
  '/warden/rooms': 'Room Allocation',
  '/warden/complaints': 'Complaints',
  '/warden/visitors': 'Visitor Log',
  '/warden/payments': 'Payments',
  '/student': 'My Dashboard',
  '/student/room': 'My Room',
  '/student/payments': 'My Payments',
  '/student/complaints': 'My Complaints',
  '/student/visitors': 'Visitor Registration',
};

export default function Header() {
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    notificationAPI.getAll()
      .then(({ data }) => setUnread(data.unreadCount || 0))
      .catch(() => {});
  }, [location.pathname]);

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-4 flex items-center justify-between flex-shrink-0">
      <div className="pl-10 md:pl-0">
        <h1 className="font-display font-semibold text-slate-900 text-xl">{title}</h1>
        <p className="text-slate-400 text-xs mt-0.5">{today}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 w-48"
          />
        </div>
        <button className="relative w-9 h-9 flex items-center justify-center bg-slate-100 rounded-xl hover:bg-slate-200 transition">
          <Bell className="w-4 h-4 text-slate-600" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
}
