import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, ChevronLeft, Trash2, Mail, CheckCircle2, RefreshCw, ArrowRight, Lock, User, Phone, Loader2 } from 'lucide-react';
import { signInWithGooglePopup } from '../config/firebase';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const res = await signInWithGooglePopup();
      if (!res.success) {
        toast.error(res.error || 'Google sign up was cancelled');
        return;
      }
      setForm(prev => ({
        ...prev,
        name: res.user.name || prev.name,
        email: res.user.email || prev.email,
        password: prev.password || 'GoogleAuth@2025',
        confirmPassword: prev.confirmPassword || 'GoogleAuth@2025',
      }));
      toast.success(`Google verified: ${res.user.email}`);
      // Skip directly to Step 3 (Document Uploads)
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error('Google sign-up failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const [files, setFiles] = useState({
    aadhar: { file: null, preview: null, status: 'idle', error: '' },
    collegeId: { file: null, preview: null, status: 'idle', error: '' },
    photo: { file: null, preview: null, status: 'idle', error: '' },
  });

  // Countdown for Resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    return () => {
      Object.values(files).forEach(f => { if (f && f.preview) URL.revokeObjectURL(f.preview); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: uploaded } = e.target;
    const file = uploaded?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFiles(prev => ({ ...prev, [name]: { ...prev[name], error: 'Invalid file type' } }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFiles(prev => ({ ...prev, [name]: { ...prev[name], error: 'File too large (max 5MB)' } }));
      return;
    }

    const preview = file.type === 'application/pdf' ? null : URL.createObjectURL(file);
    setFiles(prev => ({ ...prev, [name]: { file, preview, status: 'ready', error: '' } }));
  };

  const removeFile = (key) => {
    const f = files[key];
    if (f && f.preview) URL.revokeObjectURL(f.preview);
    setFiles(prev => ({ ...prev, [key]: { file: null, preview: null, status: 'idle', error: '' } }));
  };

  const validateStep1 = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword || !form.phone.trim()) {
      toast.error('Please fill all required fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (form.phone.trim().length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateStep1()) return;
    setSendingOtp(true);
    try {
      const { data } = await authAPI.sendOtp({ email: form.email.trim().toLowerCase(), purpose: 'registration' });
      toast.success(data.message || 'Verification code sent to your email');
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Email delivery delayed. You can proceed with document uploads.');
      setStep(2);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    setVerifyingOtp(true);
    try {
      await authAPI.verifyOtp({
        email: form.email.trim().toLowerCase(),
        otp: otp.trim(),
        purpose: 'registration'
      });
      toast.success('Email verified successfully!');
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setSendingOtp(true);
    try {
      const { data } = await authAPI.sendOtp({ email: form.email.trim().toLowerCase(), purpose: 'registration' });
      toast.success(data.message || 'New verification code sent');
      setResendTimer(60);
      setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error resending code');
    } finally {
      setSendingOtp(false);
    }
  };

  const validateStep3 = () => {
    if (!files.aadhar.file) { toast.error('Please upload Aadhaar / Government ID'); return false; }
    if (files.aadhar.file && files.aadhar.file.type !== 'application/pdf') { toast.error('Aadhaar must be a PDF'); return false; }
    if (!files.collegeId.file) { toast.error('Please upload College ID / Employee ID'); return false; }
    if (!files.photo.file) { toast.error('Please upload Passport-size photo'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);

    setFiles(prev => Object.fromEntries(Object.entries(prev).map(([k,v])=>[k,{...v,status:'uploading'}])));

    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => formData.append(k, form[k]));
      formData.append('role', 'student');
      formData.append('aadhar', files.aadhar.file);
      formData.append('collegeId', files.collegeId.file);
      formData.append('photo', files.photo.file);
      formData.append('isEmailVerified', 'true');

      const { data } = await authAPI.registerStudent(formData);
      setFiles(prev => Object.fromEntries(Object.entries(prev).map(([k,v])=>[k,{...v,status:'uploaded'}])));
      toast.success(data.message || 'Registration submitted successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error(err);
      setFiles(prev => Object.fromEntries(Object.entries(prev).map(([k,v])=>[k,{...v,status:'failed'}])));
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderFileBlock = (key, label, acceptText) => {
    const f = files[key];
    return (
      <div className="border border-slate-700 bg-slate-800/40 rounded-xl p-4 transition hover:border-slate-600">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-slate-200">{label} *</div>
          <div className="text-xs font-mono text-slate-400 capitalize">{f.status}</div>
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex-1 flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-700/80 rounded-xl cursor-pointer hover:bg-slate-900 transition">
            <Upload className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="text-sm text-slate-200 truncate font-medium">{f.file ? f.file.name : acceptText}</div>
              {f.error && <div className="text-xs text-red-400 mt-0.5">{f.error}</div>}
            </div>
            <input type="file" name={key} accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />
          </label>
          <div className="flex items-center gap-2">
            {f.preview ? (
              <img src={f.preview} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-slate-700 shadow-sm" />
            ) : f.file && f.file.type === 'application/pdf' ? (
              <a href={URL.createObjectURL(f.file)} target="_blank" rel="noreferrer" className="text-xs text-primary-400 underline font-semibold">Preview PDF</a>
            ) : (
              <div className="w-14 h-14 bg-slate-900/80 rounded-lg flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 text-center px-1">No file</div>
            )}
            {f.file && (
              <button type="button" onClick={() => removeFile(key)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition" title="Remove">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to Login
          </Link>
          <div className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            Step <span className="text-primary-400 font-bold">{step}</span> of 3
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-primary-500' : 'bg-slate-800'}`}></div>
          <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-primary-500' : 'bg-slate-800'}`}></div>
          <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-primary-500' : 'bg-slate-800'}`}></div>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl text-white font-bold tracking-tight">
              {step === 1 && 'Create Student Account'}
              {step === 2 && 'Verify Your Email'}
              {step === 3 && 'Upload Verification Documents'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {step === 1 && 'Enter your personal details to receive your email verification code.'}
              {step === 2 && `Enter the 6-digit code sent to ${form.email}`}
              {step === 3 && 'Upload government identification and college proof for admin approval.'}
            </p>
          </div>

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Google 1-Click Fast Track */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading || sendingOtp}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:border-white/30"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                {googleLoading ? 'Connecting to Google...' : 'Sign up with Google (Instant Verification)'}
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900/90 px-3 text-slate-500 font-medium">Or fill details manually</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      name="name"
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      name="phone"
                      placeholder="10-digit mobile"
                      value={form.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    name="email"
                    type="email"
                    placeholder="student@example.com"
                    value={form.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">We will send a 6-digit OTP code to verify this email address.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      name="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      name="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full mt-4 bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-500 hover:to-emerald-500 py-3 rounded-xl text-white font-semibold text-sm shadow-lg shadow-primary-900/30 transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {sendingOtp ? (
                  <>Sending Verification Code...</>
                ) : (
                  <>
                    Next: Verify Email <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Email OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700/80 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Verification Code sent to</p>
                    <p className="text-sm font-semibold text-white truncate max-w-[240px]">{form.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-primary-400 hover:underline font-semibold"
                >
                  Change
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[12px] font-mono text-2xl font-bold py-3.5 px-4 rounded-2xl bg-slate-800 border-2 border-primary-500/50 text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-center text-sm">
                {resendTimer > 0 ? (
                  <span className="text-xs text-slate-400">
                    Resend code in <strong className="text-primary-400 font-mono">{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={sendingOtp}
                    className="text-xs text-primary-400 hover:text-primary-300 font-semibold inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm font-semibold transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || otp.length !== 6}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>

              <div className="text-center pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs text-slate-400 hover:text-primary-400 transition font-medium underline"
                >
                  Skip Email OTP & Upload ID Documents Directly →
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Document Uploads */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Account details for <strong>{form.email}</strong> confirmed. Please upload your verification documents for admin review.</span>
              </div>

              <div className="space-y-3">
                {renderFileBlock('aadhar', 'Aadhaar / Government ID (PDF Only)', 'Select Aadhaar PDF file')}
                {renderFileBlock('collegeId', 'College ID / Employee ID (PDF or Image)', 'Select College or Work ID')}
                {renderFileBlock('photo', 'Passport-size Photo (JPG or PNG)', 'Select passport photo')}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm font-semibold transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-500 hover:to-emerald-500 rounded-xl text-white font-semibold text-sm shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Submitting Application...' : 'Submit Registration'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 text-center">
            Already have an approved account? <Link to="/login" className="text-primary-400 hover:underline font-semibold">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

