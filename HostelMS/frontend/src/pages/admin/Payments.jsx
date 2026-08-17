import React, { useEffect, useState, useCallback } from 'react';
import { paymentAPI, studentAPI, hostelAPI, bankDetailAPI, paymentSlipAPI, getFileUrl } from '../../services/api';
import { PageHeader, Button, Badge, Loading, Empty, Modal, Table, Card, StatCard, FormInput, FormSelect } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { getPeriodLabel, getDueDateForPeriod } from '../../utils/paymentUtils';
import toast from 'react-hot-toast';
import { CreditCard, Plus, CheckCircle, Edit2, Eye, Check, X, Clock, AlertTriangle } from 'lucide-react';

const PERIODS = [{ value: 'H1', label: 'H1 (Jan-Jun)' }, { value: 'H2', label: 'H2 (Jul-Dec)' }];

export default function PaymentsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [bankModal, setBankModal] = useState(false);
  const [previewProof, setPreviewProof] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ student: '', amount: '', period: 'H1', year: new Date().getFullYear(), dueDate: '' });
  const [payForm, setPayForm] = useState({ paymentMethod: 'online', transactionId: '' });
  const [bankForm, setBankForm] = useState({ hostel: '', accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '', upiId: '', phoneNumber: '' });

  const load = useCallback(async () => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    const { data } = await paymentAPI.getAll(params);
    setPayments(data.data);
  }, [filterStatus]);

  useEffect(() => {
    const init = async () => {
      await load();
      if (!isStudent) {
        const [studentsData, hostelsData] = await Promise.all([
          studentAPI.getAll(),
          hostelAPI.getAll(),
        ]);
        setStudents(studentsData.data.data);
        setHostels(hostelsData.data.data);
        
        try {
          const bankData = await bankDetailAPI.getAll();
          if (bankData.data.data?.length > 0) {
            setBankDetails(bankData.data.data[0]);
          }
        } catch (e) {}
      }
      setLoading(false);
    };
    init();
  }, [load, isStudent]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const dueDate = form.dueDate || getDueDateForPeriod(form.period, form.year).toISOString().split('T')[0];
      await paymentAPI.create({ ...form, amount: Number(form.amount), year: Number(form.year), dueDate });
      toast.success('Payment record created');
      setCreateModal(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Error creating payment'); }
    finally { setSaving(false); }
  };

  const handleMarkPaid = async () => {
    setSaving(true);
    try {
      await paymentAPI.markAsPaid(payModal._id, payForm);
      toast.success('Payment marked as paid');
      setPayModal(null);
      load();
    } catch (e) { toast.error('Error updating payment'); }
    finally { setSaving(false); }
  };

  const handleApproveSlip = async (slipId) => {
    setSaving(true);
    try {
      await paymentSlipAPI.verifySlip(slipId, { status: 'verified' });
      toast.success('Payment approved and marked as paid!');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error approving payment');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectSlip = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setSaving(true);
    try {
      await paymentSlipAPI.verifySlip(rejectModal.slip._id, { status: 'rejected', rejectionReason: rejectReason.trim() });
      toast.success('Payment screenshot rejected');
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error rejecting payment');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBankDetails = async () => {
    setSaving(true);
    try {
      if (bankDetails) {
        await bankDetailAPI.update(bankDetails._id, bankForm);
        toast.success('UPI & Bank details updated');
        setBankDetails({ ...bankDetails, ...bankForm });
      } else {
        const { data } = await bankDetailAPI.create(bankForm);
        toast.success('UPI & Bank details saved');
        setBankDetails(data.data);
      }
      setBankModal(false);
    } catch (e) { 
      toast.error(e.response?.data?.message || 'Error saving bank details'); 
    }
    finally { setSaving(false); }
  };

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingApprovalsCount = payments.filter(p => p.status === 'pending_verification').length;
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'pending_verification').reduce((s, p) => s + p.amount, 0);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Management"
        description="Track rent payments, UPI verification, and dues"
        action={!isStudent && (
          <Button onClick={() => { setForm({ student: students[0]?._id || '', amount: 5500, period: 'H1', year: new Date().getFullYear(), dueDate: '' }); setCreateModal(true); }}>
            <Plus className="w-4 h-4" /> Add Payment
          </Button>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Collected" value={`₹${(totalPaid / 1000).toFixed(1)}K`} icon={CreditCard} color="green" />
        <StatCard title="Pending Verifications" value={pendingApprovalsCount} icon={Clock} color={pendingApprovalsCount > 0 ? 'orange' : 'green'} subtitle="Need approval" />
        <StatCard title="Total Pending Amount" value={`₹${(totalPending / 1000).toFixed(1)}K`} icon={CreditCard} color="blue" />
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">All Statuses</option>
            <option value="pending_verification">Pending Verification (Needs Approval)</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>

          {pendingApprovalsCount > 0 && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {pendingApprovalsCount} payment screenshot{pendingApprovalsCount > 1 ? 's' : ''} awaiting your approval
            </span>
          )}
        </div>
      </Card>

      {/* UPI / Bank Details Section */}
      {!isStudent && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-display font-semibold text-slate-900">Hostel UPI & Bank Settings</h3>
              <p className="text-sm text-slate-500 mt-1">Configure UPI ID used to generate student payment QR codes</p>
            </div>
            <Button onClick={() => {
              if (bankDetails) {
                setBankForm(bankDetails);
              } else if (hostels.length > 0) {
                setBankForm({ ...bankForm, hostel: hostels[0]._id });
              }
              setBankModal(true);
            }} size="sm">
              <Edit2 className="w-4 h-4" /> {bankDetails ? 'Edit UPI / Bank' : 'Add UPI Details'}
            </Button>
          </div>

          {bankDetails ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-semibold">Hostel UPI ID (For QR Code)</p>
                <p className="text-base font-mono font-bold text-primary-700 mt-1">{bankDetails.upiId || 'Not Set'}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-semibold">Account Holder Name</p>
                <p className="text-sm font-medium text-slate-900 mt-1">{bankDetails.accountHolderName}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-semibold">Bank & Account</p>
                <p className="text-sm font-medium text-slate-900 mt-1">{bankDetails.bankName} • <span className="font-mono">{bankDetails.accountNumber}</span></p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-xl">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No UPI details added yet. Click above to add UPI ID.</p>
            </div>
          )}
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table headers={['Student', 'Period/Year', 'Amount', 'Status', 'Payment Proof', 'Receipt / Date', 'Actions']}>
          {payments.map(p => (
            <tr key={p._id} className="hover:bg-slate-50 transition">
              <td className="py-3 px-4">
                <p className="font-medium text-slate-900 text-sm">{p.student?.name || 'Student'}</p>
                <p className="text-slate-400 text-xs">{p.student?.rollNumber || p.student?.phone || '-'}</p>
              </td>
              <td className="py-3 px-4 text-sm text-slate-600">
                <p className="font-medium">{getPeriodLabel(p.period)} {p.year}</p>
                <p className="text-xs text-slate-400">Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : '-'}</p>
              </td>
              <td className="py-3 px-4 text-sm font-semibold text-slate-900">₹{p.amount?.toLocaleString('en-IN')}</td>
              <td className="py-3 px-4"><Badge status={p.status} /></td>
              <td className="py-3 px-4">
                {p.slip?.fileUrl ? (
                  <button
                    onClick={() => setPreviewProof({ ...p.slip, studentName: p.student?.name, amount: p.amount, paymentId: p._id })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg border border-primary-200 transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Proof
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">No proof uploaded</span>
                )}
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">
                {p.status === 'paid' ? (
                  <div>
                    <span className="font-mono font-semibold text-emerald-700 block">{p.receiptNumber}</span>
                    <span className="text-slate-400">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '-'}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>
              <td className="py-3 px-4">
                {p.status === 'pending_verification' && p.slip && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveSlip(p.slip._id)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                      title="Approve Payment"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setRejectModal(p)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold border border-red-200 transition"
                      title="Reject Screenshot"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}

                {p.status === 'pending' && !isStudent && (
                  <Button size="sm" variant="success" onClick={() => { setPayModal(p); setPayForm({ paymentMethod: 'upi', transactionId: '' }); }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                  </Button>
                )}

                {p.status === 'paid' && (
                  <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
        {payments.length === 0 && <Empty icon={CreditCard} title="No payment records" description="Payment records will appear here" />}
      </Card>

      {/* Proof Preview Modal */}
      {previewProof && (
        <Modal open={Boolean(previewProof)} onClose={() => setPreviewProof(null)} title="Payment Screenshot Proof">
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-900">{previewProof.studentName}</p>
                <p className="text-xs text-slate-500">Amount: ₹{previewProof.amount?.toLocaleString('en-IN')}</p>
              </div>
              <a
                href={getFileUrl(previewProof.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                Open in New Tab ↗
              </a>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center min-h-[250px] max-h-[450px]">
              {previewProof.fileType === 'pdf' ? (
                <iframe
                  src={getFileUrl(previewProof.fileUrl)}
                  title="PDF Preview"
                  className="w-full h-80 border-0"
                />
              ) : (
                <img
                  src={getFileUrl(previewProof.fileUrl)}
                  alt="Payment Screenshot Proof"
                  className="max-h-[420px] max-w-full object-contain"
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPreviewProof(null)}>
                Close
              </Button>
              {payments.find(p => p._id === previewProof.paymentId)?.status === 'pending_verification' && (
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={() => {
                    handleApproveSlip(previewProof._id);
                    setPreviewProof(null);
                  }}
                >
                  <Check className="w-4 h-4" /> Approve Payment
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Proof Modal */}
      {rejectModal && (
        <Modal open={Boolean(rejectModal)} onClose={() => setRejectModal(null)} title="Reject Payment Screenshot">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Provide a reason for rejecting the payment proof from <strong>{rejectModal.student?.name}</strong>. The student will be notified to re-upload.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction amount mismatch, blurry screenshot, invalid UTR..."
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" loading={saving} onClick={handleRejectSlip}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Add Payment Record">
        <div className="space-y-4">
          <FormSelect label="Student *" value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}>
            {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber || s.phone})</option>)}
          </FormSelect>
          <div className="grid grid-cols-2 gap-3">
            <FormSelect label="Period *" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}>
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </FormSelect>
            <FormInput label="Year *" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
          </div>
          <FormInput label="Amount (₹) *" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <FormInput label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleCreate}>Create Record</Button>
          </div>
        </div>
      </Modal>

      {/* Mark paid modal */}
      <Modal open={Boolean(payModal)} onClose={() => setPayModal(null)} title="Mark Payment as Paid">
        {payModal && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl text-sm">
              <p><strong>Student:</strong> {payModal.student?.name}</p>
              <p><strong>Period:</strong> {getPeriodLabel(payModal.period)} {payModal.year}</p>
              <p><strong>Amount:</strong> ₹{payModal.amount?.toLocaleString('en-IN')}</p>
            </div>
            <FormSelect label="Payment Method" value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
            </FormSelect>
            <FormInput label="Transaction ID" value={payForm.transactionId} onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPayModal(null)}>Cancel</Button>
              <Button variant="success" className="flex-1" loading={saving} onClick={handleMarkPaid}>Confirm Paid</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bank modal */}
      <Modal open={bankModal} onClose={() => setBankModal(false)} title="Configure Hostel UPI & Bank Details">
        <div className="space-y-4">
          <FormInput 
            label="Hostel UPI ID * (e.g. hostelname@okaxis)" 
            value={bankForm.upiId} 
            onChange={e => setBankForm({ ...bankForm, upiId: e.target.value })} 
            placeholder="e.g. myhostel@upi"
          />
          <FormInput label="Account Holder Name *" value={bankForm.accountHolderName} onChange={e => setBankForm({ ...bankForm, accountHolderName: e.target.value })} />
          <FormInput label="Bank Name *" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} />
          <FormInput label="Account Number *" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
          <FormInput label="IFSC Code *" value={bankForm.ifscCode} onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value })} />
          <FormInput label="Branch Name" value={bankForm.branchName} onChange={e => setBankForm({ ...bankForm, branchName: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setBankModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSaveBankDetails}>Save Details</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
