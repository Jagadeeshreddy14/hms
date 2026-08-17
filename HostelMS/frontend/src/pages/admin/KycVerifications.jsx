import React, { useState, useEffect, useCallback } from 'react';
import { kycAPI } from '../../services/api';
import { PageHeader, Card, Button, Badge, Loading, Table, StatCard, Modal } from '../../components/common';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ShieldAlert, Shield, AlertTriangle, Eye, Check, X, RefreshCw, User, Search
} from 'lucide-react';

export default function KycVerifications() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, manualReview: 0, pending: 0, notVerified: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('VERIFIED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const { data } = await kycAPI.getAdminVerifications(params);
      setStudents(data.data || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load KYC verifications');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReviewSubmit = async () => {
    if (!selectedStudent) return;
    setProcessing(true);
    try {
      await kycAPI.adminReviewKyc(selectedStudent._id, {
        status: reviewAction,
        reviewNotes: reviewNotes.trim(),
      });
      toast.success(`Verification status updated to ${reviewAction}`);
      setReviewModal(false);
      setSelectedStudent(null);
      setReviewNotes('');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error updating KYC status');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aadhaar KYC Verifications"
        description="Review and monitor student Aadhaar Paperless Offline e-KYC compliance"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.total}
          icon={User}
          color="blue"
        />
        <StatCard
          title="Aadhaar Verified"
          value={stats.verified}
          icon={ShieldCheck}
          color="green"
          subtitle={`${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% compliance`}
        />
        <StatCard
          title="Manual Review"
          value={stats.manualReview}
          icon={AlertTriangle}
          color={stats.manualReview > 0 ? 'orange' : 'green'}
          subtitle="Requires attention"
        />
        <StatCard
          title="Not Verified"
          value={stats.notVerified}
          icon={ShieldAlert}
          color="purple"
          subtitle="Pending submission"
        />
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by student name, roll, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All KYC Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="MANUAL_REVIEW">Manual Review Needed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="NOT_VERIFIED">Not Verified</option>
            </select>
          </div>

          {stats.manualReview > 0 && (
            <span className="text-xs font-semibold text-orange-800 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              {stats.manualReview} student{stats.manualReview > 1 ? 's' : ''} awaiting manual review
            </span>
          )}
        </div>
      </Card>

      {/* KYC Table */}
      <Card>
        <Table headers={['Student', 'Room / Hostel', 'KYC Status', 'Verified Name (Aadhaar)', 'Aadhaar Ref (Masked)', 'Verification Date', 'Actions']}>
          {students.map((student) => {
            const kyc = student.aadhaarVerification || { status: 'NOT_VERIFIED' };
            return (
              <tr key={student._id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-900 text-sm">{student.name}</p>
                  <p className="text-slate-400 text-xs">{student.rollNumber || student.phone || student.email}</p>
                </td>
                <td className="py-3 px-4 text-xs text-slate-600">
                  <p className="font-medium text-slate-800">
                    {student.room ? `Room ${student.room.roomNumber}` : 'Unassigned'}
                  </p>
                  <p className="text-slate-400">{student.hostel?.name || '-'}</p>
                </td>
                <td className="py-3 px-4">
                  <Badge status={kyc.status || 'NOT_VERIFIED'} />
                </td>
                <td className="py-3 px-4 text-sm text-slate-800">
                  {kyc.verifiedName ? (
                    <div>
                      <p className="font-medium text-slate-900">{kyc.verifiedName}</p>
                      {kyc.verifiedGender && (
                        <span className="text-xs text-slate-400">
                          {kyc.verifiedGender === 'M' ? 'Male' : kyc.verifiedGender === 'F' ? 'Female' : kyc.verifiedGender} • {kyc.verifiedDob || ''}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Not verified</span>
                  )}
                </td>
                <td className="py-3 px-4 text-xs font-mono text-slate-700">
                  {kyc.maskedAadhaar || (kyc.verificationReference ? `XXXX-XXXX-${kyc.verificationReference.substring(0, 4)}` : '-')}
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">
                  {kyc.verifiedAt ? new Date(kyc.verifiedAt).toLocaleDateString('en-IN') : '-'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setReviewModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg border border-primary-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
        {students.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            <Shield className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No KYC records found matching your filter.
          </div>
        )}
      </Card>

      {/* KYC Details & Admin Review Modal */}
      {selectedStudent && (
        <Modal
          open={reviewModal}
          onClose={() => {
            setReviewModal(false);
            setSelectedStudent(null);
          }}
          title={`Aadhaar e-KYC: ${selectedStudent.name}`}
        >
          {(() => {
            const kyc = selectedStudent.aadhaarVerification || { status: 'NOT_VERIFIED' };
            return (
              <div className="space-y-5">
                {/* Status & Method */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Verification Status</span>
                    <div className="mt-1"><Badge status={kyc.status} /></div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Method</span>
                    <span className="text-xs font-semibold text-slate-700">{kyc.verificationMethod || 'UIDAI Offline e-KYC'}</span>
                  </div>
                </div>

                {/* Photo & Demographics */}
                <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {kyc.photoBase64 ? (
                    <img
                      src={kyc.photoBase64}
                      alt="UIDAI Verified"
                      className="w-20 h-24 object-cover rounded-lg border border-slate-300 shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                      No Photo
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs flex-1">
                    <div>
                      <span className="text-slate-400 font-semibold uppercase text-[10px]">Aadhaar Name:</span>
                      <p className="font-bold text-slate-900 text-sm">{kyc.verifiedName || 'Not available'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 font-semibold uppercase text-[10px]">DOB:</span>
                        <p className="text-slate-800 font-medium">{kyc.verifiedDob || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold uppercase text-[10px]">Gender:</span>
                        <p className="text-slate-800 font-medium">{kyc.verifiedGender || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold uppercase text-[10px]">Masked Ref ID:</span>
                      <p className="font-mono text-slate-800">{kyc.maskedAadhaar || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Verified Address */}
                {kyc.address && (kyc.address.street || kyc.address.city) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Verified Address</span>
                    <p className="text-slate-800">
                      {[kyc.address.careOf, kyc.address.street, kyc.address.city, kyc.address.state, kyc.address.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {/* Failure / Review Reason if present */}
                {kyc.failureReason && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 space-y-0.5">
                    <span className="font-semibold block text-orange-900">Review Note / Notice:</span>
                    <p>{kyc.failureReason}</p>
                  </div>
                )}

                {/* Admin Action Controls */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">Administrator Action</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewAction('VERIFIED')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${reviewAction === 'VERIFIED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      <Check className="w-3.5 h-3.5 inline mr-1" /> Approve (Verified)
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction('FAILED')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${reviewAction === 'FAILED' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      <X className="w-3.5 h-3.5 inline mr-1" /> Reject (Failed)
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction('NOT_VERIFIED')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${reviewAction === 'NOT_VERIFIED' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Request Re-upload
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Notes / Reason (Sent to Student)</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="e.g. Identity documents verified manually, or name discrepancy resolved..."
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="2"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setReviewModal(false)}>
                      Close
                    </Button>
                    <Button className="flex-1" loading={processing} onClick={handleReviewSubmit}>
                      Save Decision
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
