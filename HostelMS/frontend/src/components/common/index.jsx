import React from 'react';
import { Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

// Stat Card
export function StatCard({ title, value, icon: Icon, color = 'blue', trend, trendValue, subtitle }) {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    purple: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-100' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 shadow-card hover:shadow-card-hover transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-display font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          {trendValue !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

// Badge
export function Badge({ status }) {
  const configs = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    overdue: 'bg-red-100 text-red-700',
    waived: 'bg-slate-100 text-slate-600',
    resolved: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-blue-100 text-blue-700',
    closed: 'bg-slate-100 text-slate-600',
    rejected: 'bg-red-100 text-red-700',
    available: 'bg-emerald-100 text-emerald-700',
    occupied: 'bg-blue-100 text-blue-700',
    full: 'bg-red-100 text-red-700',
    maintenance: 'bg-amber-100 text-amber-700',
    checked_in: 'bg-blue-100 text-blue-700',
    checked_out: 'bg-slate-100 text-slate-600',
    approved: 'bg-emerald-100 text-emerald-700',
    verified: 'bg-emerald-100 text-emerald-700',
    pending_verification: 'bg-blue-100 text-blue-700',
    vacated: 'bg-slate-100 text-slate-600',
    suspended: 'bg-red-100 text-red-700',
    VERIFIED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
    FAILED: 'bg-red-100 text-red-800 border border-red-200',
    MANUAL_REVIEW: 'bg-orange-100 text-orange-800 border border-orange-200',
    NOT_VERIFIED: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
  const cls = configs[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// Priority Badge
export function PriorityBadge({ priority }) {
  const configs = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configs[priority] || ''}`}>
      {priority}
    </span>
  );
}

// Loading spinner
export function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Empty state
export function Empty({ icon: Icon = AlertCircle, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-700 text-lg">{title}</h3>
      {description && <p className="text-slate-400 text-sm mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Page header
export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-display font-bold text-slate-900 text-2xl">{title}</h2>
        {description && <p className="text-slate-500 text-sm mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-semibold text-slate-900 text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Form Input
export function FormInput({ label, error, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <input
        className={`w-full border rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300 transition ${
          error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
        }`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// Form Select
export function FormSelect({ label, error, children, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <select
        className={`w-full border rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300 transition bg-white ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// Card
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-card ${className}`}>
      {children}
    </div>
  );
}

// Button
export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-slate-200 hover:bg-slate-50 text-slate-700',
    ghost: 'hover:bg-slate-100 text-slate-600',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

// Table
export function Table({ headers, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {headers.map((h) => (
              <th key={h} className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {children}
        </tbody>
      </table>
      {empty}
    </div>
  );
}
