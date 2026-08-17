import React, { useState, useEffect } from 'react';
import { studentApprovalAPI, getFileUrl } from '../../services/api';
import toast from 'react-hot-toast';
import { ChevronRight, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function StudentApprovals() {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, statsRes] = await Promise.all([
        studentApprovalAPI.getPendingRegistrations(),
        studentApprovalAPI.getStats()
      ]);
      setRegistrations(pendingRes.data.registrations || []);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (registration) => {
    try {
      const { data } = await studentApprovalAPI.getRegistrationDetails(registration._id);
      setSelectedRegistration(data.registration);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load details');
    }
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;
    try {
      await studentApprovalAPI.approveRegistration(selectedRegistration._id, {});
      toast.success('Student approved successfully');
      setShowDetailModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (reason) => {
    if (!selectedRegistration) return;
    try {
      await studentApprovalAPI.rejectRegistration(selectedRegistration._id, { rejectionReason: reason });
      toast.success('Student registration rejected');
      setShowDetailModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Student Registration Approvals</h1>
        <p className="text-slate-600">Review and approve pending student registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Pending</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500 opacity-70" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Approved</p>
              <p className="text-3xl font-bold text-emerald-900 mt-1">{stats.approved}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-emerald-500 opacity-70" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Rejected</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.rejected}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-500 opacity-70" />
          </div>
        </div>
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No pending registrations</p>
          <p className="text-slate-500 text-sm mt-1">All student registrations have been reviewed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map((registration) => (
            <button
              key={registration._id}
              onClick={() => handleViewDetails(registration)}
              className="group relative bg-white border border-slate-300 hover:border-primary-400 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 text-left overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary-500/10 transition" />

              <div className="relative z-10">
                {/* Status Badge */}
                <div className="inline-block mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                    <Clock className="w-3 h-3" />
                    Pending Review
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-primary-600 transition">
                  {registration.user?.name || 'Unknown'}
                </h3>

                {/* Student Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Email</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[160px]">{registration.user?.email || registration.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Contact</span>
                    <span className="font-semibold text-slate-900">{registration.user?.phone || registration.phone || '-'}</span>
                  </div>
                </div>

                {/* View Details Link */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between group-hover:border-primary-200">
                  <span className="text-sm font-semibold text-primary-600">View Details</span>
                  <ChevronRight className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRegistration && (
        <DetailModal
          registration={selectedRegistration}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRegistration(null);
          }}
        />
      )}
    </div>
  );
}

function DetailModal({ registration, onApprove, onReject, onClose }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setSubmitting(true);
    try {
      await onReject(rejectReason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 flex items-center justify-between border-b border-primary-600">
          <div>
            <h2 className="text-2xl font-bold text-white">{registration.user?.name}</h2>
            <p className="text-primary-100 text-sm mt-1">Student Registration Review</p>
          </div>
          <button
            onClick={onClose}
            className="text-primary-100 hover:text-white transition text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Personal Information */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Full Name" value={registration.user?.name} />
              <InfoField label="Email" value={registration.user?.email} />
              <InfoField label="Phone" value={registration.user?.phone} />
              <InfoField label="Contact Number" value={registration.phone} />
            </div>
          </section>

          {/* Address Information (if provided) */}
          {(registration.address || registration.permanentAddress || registration.city || registration.state || registration.pincode) && (
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Address Information</h3>
              <div className="space-y-3">
                {registration.address && <InfoField label="Current/Mailing Address" value={registration.address} />}
                {registration.permanentAddress && <InfoField label="Permanent Address" value={registration.permanentAddress} />}
                <div className="grid grid-cols-3 gap-4">
                  {registration.city && <InfoField label="City" value={registration.city} />}
                  {registration.state && <InfoField label="State" value={registration.state} />}
                  {registration.pincode && <InfoField label="Pincode" value={registration.pincode} />}
                </div>
              </div>
            </section>
          )}

          {/* Guardian Information (if provided) */}
          {(registration.guardianName || registration.guardianPhone) && (
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Guardian Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Guardian Name" value={registration.guardianName} />
                <InfoField label="Guardian Phone" value={registration.guardianPhone} />
              </div>
            </section>
          )}

          {/* Uploaded Documents */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Uploaded Documents</h3>
            <div className="space-y-3">
              {registration.photoUrl && (
                <DocumentLink
                  label="Passport Photo"
                  url={registration.photoUrl}
                />
              )}
              {registration.aadharUrl && (
                <DocumentLink
                  label="Aadhar Card (PDF)"
                  url={registration.aadharUrl}
                />
              )}
              {registration.collegeIdUrl && (
                <DocumentLink
                  label="College ID"
                  url={registration.collegeIdUrl}
                />
              )}
            </div>
          </section>

          {/* Rejection Reason Form */}
          {showRejectForm && (
            <section className="bg-red-50 border border-red-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why you're rejecting this registration..."
                className="w-full border border-red-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="4"
              />
            </section>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-8 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition"
          >
            Close
          </button>
          {!showRejectForm ? (
            <>
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
              >
                Approve
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
                className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition"
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-base text-slate-900 font-medium">{value || '-'}</p>
    </div>
  );
}

function DocumentLink({ label, url }) {
  const fullUrl = getFileUrl(url);
  return (
    <div className="flex items-center justify-between p-3 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
      >
        View Document
      </a>
    </div>
  );
}
