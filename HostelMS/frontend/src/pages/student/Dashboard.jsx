import React, { useEffect, useState } from 'react';
import { studentAPI, paymentAPI, complaintAPI, bankDetailAPI, paymentSlipAPI, getFileUrl } from '../../services/api';
import { Card, StatCard, Badge, Loading } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { getPeriodShortLabel } from '../../utils/paymentUtils';
import { CreditCard, AlertCircle, UserCheck, Wifi, Zap, Droplets, Copy, Check, Upload, CheckCircle2, Clock, QrCode, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [slips, setSlips] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const loadData = async () => {
    try {
      const [s, p, c, b, slipsData] = await Promise.all([
        studentAPI.getMe().catch(() => null),
        paymentAPI.getAll(),
        complaintAPI.getAll(),
        bankDetailAPI.getAll().catch(() => null),
        paymentSlipAPI.getSlips().catch(() => ({ data: { data: [] } })),
      ]);
      setStudent(s?.data?.data);
      const paymentList = p.data.data || [];
      setPayments(paymentList);
      setComplaints(c.data.data || []);
      setSlips(slipsData.data.data || []);
      if (b?.data?.data?.length > 0) {
        setBankDetails(b.data.data[0]);
      }
      // Auto-select first pending or pending_verification payment
      const defaultPay = paymentList.find(pay => pay.status === 'pending' || pay.status === 'pending_verification');
      if (defaultPay) {
        setSelectedPaymentId(defaultPay._id);
      } else if (paymentList.length > 0) {
        setSelectedPaymentId(paymentList[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, PNG files allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setScreenshotFile(file);
    if (file.type.startsWith('image/')) {
      setScreenshotPreview(URL.createObjectURL(file));
    } else {
      setScreenshotPreview(null);
    }
  };

  const handleUploadScreenshot = async (e) => {
    e.preventDefault();
    if (!selectedPaymentId) {
      toast.error('Please select a payment');
      return;
    }
    if (!screenshotFile) {
      toast.error('Please select a payment screenshot image or PDF');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', screenshotFile);
      formData.append('paymentId', selectedPaymentId);
      if (transactionId.trim()) formData.append('transactionId', transactionId.trim());

      const { data } = await paymentSlipAPI.upload(formData);
      toast.success(data.message || 'Screenshot uploaded! Pending admin approval.');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setTransactionId('');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error uploading screenshot');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loading />;

  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'pending_verification').length;
  const activeComplaints = complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length;
  const amountPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);

  const selectedPayment = payments.find(p => p._id === selectedPaymentId) || payments[0];
  const upiId = bankDetails?.upiId || 'hostel@upi';
  const hostelName = student?.hostel?.name || bankDetails?.accountHolderName || 'Hostel Fee';

  const upiAmount = selectedPayment ? selectedPayment.amount : 0;
  const upiRef = `${student?.rollNumber || student?.name || 'Student'}_${selectedPayment?.period || 'Fee'}_${selectedPayment?.year || ''}`.replace(/\s+/g, '_');
  const upiParams = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(hostelName)}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(upiRef)}`;
  const upiPayString = `upi://pay?${upiParams}`;
  const gpayUrl = `tez://upi/pay?${upiParams}`;
  const phonePeUrl = `phonepe://pay?${upiParams}`;
  const paytmUrl = `paytmmp://pay?${upiParams}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayString)}&margin=10`;

  const existingSlipForSelected = slips.find(s => s.payment?._id === selectedPayment?._id || s.payment === selectedPayment?._id);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">Hello, {user?.name?.split(' ')[0]}! 👋</h2>
            <p className="text-emerald-100 mt-1 text-sm">
              {student?.rollNumber ? `Resident ID: ${student.rollNumber}` : "Here's your hostel status overview"}
              {student?.course ? ` · ${student.course}` : ''}
              {student?.branch ? ` (${student.branch})` : ''}
            </p>
          </div>
          {student?.bloodGroup && (
            <div className="bg-white/20 backdrop-blur-sm px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide border border-white/20">
              🩸 Blood Group: <span className="font-bold text-white">{student.bloodGroup}</span>
            </div>
          )}
        </div>

        {/* Room info */}
        {student?.room ? (
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white/15 rounded-xl px-4 py-2.5">
              <div className="text-sm font-semibold">Room {student.room.roomNumber}</div>
              <div className="text-xs text-emerald-100">Block {student.room.hostelBlock}</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2.5">
              <div className="text-sm font-semibold">Floor {student.room.floor}</div>
              <div className="text-xs text-emerald-100">{student.room.type} room</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2.5">
              <div className="text-sm font-semibold">₹{student.room.monthlyRent?.toLocaleString('en-IN')}/mo</div>
              <div className="text-xs text-emerald-100">Monthly rent</div>
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-white/15 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm">⚠️ No room assigned yet.</span>
            <Link to="/student/browse-rooms" className="text-sm font-semibold text-white hover:underline">Browse rooms →</Link>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Payments" value={pendingPayments} icon={CreditCard} color={pendingPayments > 0 ? 'orange' : 'green'} subtitle={pendingPayments > 0 ? 'Action required' : 'All clear'} />
        <StatCard title="Amount Paid" value={`₹${(amountPaid / 1000).toFixed(0)}K`} icon={CreditCard} color="green" subtitle="Total verified" />
        <StatCard title="Active Complaints" value={activeComplaints} icon={AlertCircle} color={activeComplaints > 0 ? 'red' : 'green'} subtitle="Open tickets" />
        <StatCard title="Total Complaints" value={complaints.length} icon={AlertCircle} color="purple" subtitle="All time" />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-display font-semibold text-slate-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/student/complaints', icon: Zap, label: 'Electricity Issue', color: 'bg-amber-50 text-amber-600 border-amber-100' },
            { to: '/student/complaints', icon: Droplets, label: 'Water Problem', color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { to: '/student/complaints', icon: Wifi, label: 'WiFi Issue', color: 'bg-violet-50 text-violet-600 border-violet-100' },
            { to: '/student/visitors', icon: UserCheck, label: 'Register Visitor', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          ].map(a => (
            <Link key={a.label} to={a.to} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${a.color} hover:opacity-80 transition text-center`}>
              <a.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* UPI Payment & Verification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: UPI QR & Payment Action */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-slate-900 text-lg">UPI Fee Payment</h3>
                  <p className="text-xs text-slate-500">Scan QR Code or pay via UPI ID, then upload screenshot</p>
                </div>
              </div>
              {selectedPayment && (
                <Badge status={selectedPayment.status} />
              )}
            </div>

            {/* Payment Selector if multiple */}
            {payments.length > 1 && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Select Fee / Period</label>
                <select
                  value={selectedPaymentId}
                  onChange={(e) => setSelectedPaymentId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {payments.map(p => (
                    <option key={p._id} value={p._id}>
                      {getPeriodShortLabel(p.period)} {p.year} — ₹{p.amount?.toLocaleString('en-IN')} ({p.status?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedPayment ? (
              <div className="mt-5 space-y-6">
                {/* State: PAID */}
                {selectedPayment.status === 'paid' && (
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-emerald-900 text-base">Payment Completed & Verified</h4>
                    <p className="text-xs text-emerald-700">
                      Amount ₹{selectedPayment.amount?.toLocaleString('en-IN')} paid for {getPeriodShortLabel(selectedPayment.period)} {selectedPayment.year}
                    </p>
                    {selectedPayment.receiptNumber && (
                      <div className="inline-block mt-2 px-3 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-medium text-emerald-800">
                        Receipt No: {selectedPayment.receiptNumber}
                      </div>
                    )}
                  </div>
                )}

                {/* State: PENDING VERIFICATION */}
                {selectedPayment.status === 'pending_verification' && (
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 text-sm">Screenshot Under Admin Review</h4>
                        <p className="text-xs text-blue-700 mt-0.5">
                          You uploaded payment proof for ₹{selectedPayment.amount?.toLocaleString('en-IN')}. Admin will review and confirm.
                        </p>
                      </div>
                    </div>
                    {existingSlipForSelected && (
                      <div className="pt-2 flex items-center justify-between text-xs border-t border-blue-200/60">
                        <span className="text-blue-800 font-medium truncate max-w-[200px]">{existingSlipForSelected.fileName}</span>
                        <a
                          href={getFileUrl(existingSlipForSelected.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline font-semibold"
                        >
                          View Uploaded Proof →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* State: PENDING or OVERDUE - Show QR & Upload Form */}
                {(selectedPayment.status === 'pending' || selectedPayment.status === 'overdue') && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                      {/* QR Code Container */}
                      <div className="flex flex-col items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200">
                          <img
                            src={qrCodeUrl}
                            alt="UPI Payment QR Code"
                            className="w-44 h-44 object-contain rounded-lg"
                          />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 mt-3">Scan to Pay with Any UPI App</p>
                        <div className="flex gap-2 text-[10px] text-slate-500 mt-1">
                          <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
                        </div>
                      </div>

                      {/* Amount & UPI Details */}
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs text-slate-500 font-medium">Total Amount Due</span>
                          <p className="text-3xl font-display font-bold text-slate-900 mt-0.5">
                            ₹{selectedPayment.amount?.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Period: <strong className="text-slate-700">{getPeriodShortLabel(selectedPayment.period)} {selectedPayment.year}</strong>
                          </p>
                        </div>

                        {/* UPI ID Box */}
                        <div className="bg-white border border-slate-200 p-3 rounded-xl">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hostel UPI ID</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono text-sm font-semibold text-slate-800 truncate">{upiId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(upiId, 'upi')}
                              className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition"
                              title="Copy UPI ID"
                            >
                              {copiedField === 'upi' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Quick Pay via UPI App Buttons */}
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-2">⚡ Or Tap to Pay with UPI App:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={gpayUrl}
                              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-800 shadow-sm transition active:scale-95"
                            >
                              <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4] inline-block"></span>
                              Google Pay
                            </a>
                            <a
                              href={phonePeUrl}
                              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#5f259f] hover:bg-[#4d1d82] rounded-xl text-xs font-semibold text-white shadow-sm transition active:scale-95"
                            >
                              <span className="w-2.5 h-2.5 rounded-full bg-white inline-block"></span>
                              PhonePe
                            </a>
                            <a
                              href={paytmUrl}
                              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#002e6e] hover:bg-[#002252] rounded-xl text-xs font-semibold text-white shadow-sm transition active:scale-95"
                            >
                              <span className="w-2.5 h-2.5 rounded-full bg-[#00b9f5] inline-block"></span>
                              Paytm
                            </a>
                            <a
                              href={upiPayString}
                              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold text-white shadow-sm transition active:scale-95"
                            >
                              <span className="w-2.5 h-2.5 rounded-full bg-white inline-block"></span>
                              Any UPI App
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                      ℹ️ Once paid in your UPI app, take a screenshot and upload it below for admin verification.
                    </div>
                  </div>
                )}

                {/* Upload Form for Pending */}
                {(selectedPayment.status === 'pending' || selectedPayment.status === 'overdue') && (
                  <form onSubmit={handleUploadScreenshot} className="pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary-600" />
                      Step 2: Upload Payment Screenshot
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Transaction ID / UTR (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 412356789012"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Screenshot Proof * (JPG, PNG, PDF)</label>
                        <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition truncate">
                          <Upload className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-700 truncate">
                            {screenshotFile ? screenshotFile.name : 'Choose Screenshot'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {screenshotPreview && (
                      <div className="mt-2 p-2 bg-slate-50 border rounded-xl flex items-center gap-3">
                        <img src={screenshotPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
                        <div className="text-xs">
                          <p className="font-medium text-slate-800">{screenshotFile?.name}</p>
                          <p className="text-slate-400">{(screenshotFile?.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={uploading || !screenshotFile}
                      className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
                    >
                      {uploading ? 'Uploading...' : 'Submit Screenshot for Admin Approval'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-6">No payment records found.</p>
            )}
          </Card>
        </div>

        {/* Right Col: Payment History */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Payment Records
              </h3>
              <span className="text-xs text-slate-400">{payments.length} records</span>
            </div>

            {payments.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No payment records available</p>
            ) : (
              <div className="space-y-3">
                {payments.map(p => {
                  const periodLabel = getPeriodShortLabel(p.period);
                  const isSelected = selectedPaymentId === p._id;
                  return (
                    <div
                      key={p._id}
                      onClick={() => setSelectedPaymentId(p._id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected ? 'bg-primary-50/50 border-primary-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{periodLabel} {p.year}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {p.status === 'paid' && p.paymentDate
                              ? `Paid on ${new Date(p.paymentDate).toLocaleDateString('en-IN')}`
                              : `Due by ${p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : '—'}`}
                          </p>
                          {p.receiptNumber && (
                            <p className="text-[11px] text-emerald-700 font-mono mt-1 font-medium">
                              {p.receiptNumber}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">₹{p.amount?.toLocaleString('en-IN')}</p>
                          <div className="mt-1">
                            <Badge status={p.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
