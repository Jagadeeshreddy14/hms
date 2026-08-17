import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Building2, LayoutDashboard, DoorOpen, Users, CreditCard,
  AlertCircle, UserCheck, Bell, LogOut, Menu, X, ChevronRight,
  Home, BarChart3, ClipboardList
} from 'lucide-react';

import { studentAPI } from '../../services/api';

const NAV_ITEMS = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/hostels', icon: Building2, label: 'Hostels' },
    { to: '/admin/rooms', icon: DoorOpen, label: 'Rooms' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/student-approvals', icon: ClipboardList, label: 'Student Approvals' },
    { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { to: '/admin/complaints', icon: AlertCircle, label: 'Complaints' },
    { to: '/admin/visitors', icon: UserCheck, label: 'Visitors' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ],
  warden: [
    { to: '/warden', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/warden/rooms', icon: DoorOpen, label: 'Rooms' },
    { to: '/warden/student-approvals', icon: ClipboardList, label: 'Student Approvals' },
    { to: '/warden/complaints', icon: AlertCircle, label: 'Complaints' },
    { to: '/warden/visitors', icon: UserCheck, label: 'Visitors' },
    { to: '/warden/payments', icon: CreditCard, label: 'Payments' },
  ],
  student: [
    { to: '/student', icon: Home, label: 'Dashboard', end: true },
    { to: '/student/browse-rooms', icon: DoorOpen, label: 'Browse Rooms' },
    { to: '/student/room', icon: DoorOpen, label: 'My Room' },
    { to: '/student/payments', icon: CreditCard, label: 'Payments' },
    { to: '/student/complaints', icon: AlertCircle, label: 'Complaints' },
    { to: '/student/visitors', icon: UserCheck, label: 'Visitors' },
  ],
};

const ROLE_COLORS = {
  admin: 'from-violet-600 to-primary-700',
  warden: 'from-blue-600 to-cyan-700',
  student: 'from-emerald-600 to-teal-700',
};

const ROLE_LABELS = {
  admin: 'Administrator',
  warden: 'Warden',
  student: 'Student',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasRoomAssigned, setHasRoomAssigned] = useState(false);

  useEffect(() => {
    if (user?.role === 'student') {
      studentAPI.getMe()
        .then(({ data }) => {
          setHasRoomAssigned(Boolean(data?.data?.room));
        })
        .catch(() => {
          setHasRoomAssigned(Boolean(user?.studentId?.room));
        });
    }
  }, [user]);

  const navItems = (NAV_ITEMS[user?.role] || []).filter((item) => {
    if (user?.role === 'student') {
      if (item.to === '/student/browse-rooms') {
        // ONLY visible before room assignment
        return !hasRoomAssigned;
      }
      if (item.to === '/student/room') {
        // ONLY visible after room is assigned
        return hasRoomAssigned;
      }
    }
    return true;
  });

  const gradient = ROLE_COLORS[user?.role] || 'from-gray-600 to-gray-700';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`bg-gradient-to-br ${gradient} px-6 py-5`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-none">HostelMS</div>
            <div className="text-white/70 text-xs mt-0.5">{ROLE_LABELS[user?.role]}</div>
          </div>
        </div>
      </div>

      {/* User avatar */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700 text-sm">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 text-sm truncate">{user?.name}</div>
            <div className="text-slate-400 text-xs truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3 space-y-0.5">
        <NavLink
          to={`/${user?.role}/notifications`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <Bell className="w-4.5 h-4.5 text-slate-400" />
          Notifications
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}
