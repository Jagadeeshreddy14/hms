import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, ChevronLeft, Trash2 } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [files, setFiles] = useState({
    aadhar: { file: null, preview: null, status: 'idle', error: '' },
    collegeId: { file: null, preview: null, status: 'idle', error: '' },
    photo: { file: null, preview: null, status: 'idle', error: '' },
  });

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
    if (!form.name || !form.email || !form.password || !form.confirmPassword || !form.phone) {
      toast.error('Please fill all required fields');
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

  const validateStep2 = () => {
    if (!files.aadhar.file) { toast.error('Please upload Aadhaar / Government ID'); return false; }
    if (files.aadhar.file && files.aadhar.file.type !== 'application/pdf') { toast.error('Aadhaar must be a PDF'); return false; }
    if (!files.collegeId.file) { toast.error('Please upload College ID / Employee ID'); return false; }
    if (!files.photo.file) { toast.error('Please upload Passport-size photo'); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);

    setFiles(prev => Object.fromEntries(Object.entries(prev).map(([k,v])=>[k,{...v,status:'uploading'}])));

    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => formData.append(k, form[k]));
      formData.append('role', 'student');
      formData.append('aadhar', files.aadhar.file);
      formData.append('collegeId', files.collegeId.file);
      formData.append('photo', files.photo.file);

      const { data } = await authAPI.registerStudent(formData);
      setFiles(prev => Object.fromEntries(Object.entries(prev).map(([k,v])=>[k,{...v,status:'uploaded'}])));
      toast.success(data.message || 'Registration submitted — pending verification');
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
      <div className="border border-slate-600 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-300">{label} *</div>
          <div className="text-xs text-slate-400">{f.status}</div>
        </div>
        <div className="flex gap-3">
          <label className="flex-1 flex items-center gap-3 p-3 bg-slate-700/20 rounded-lg cursor-pointer">
            <Upload className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-sm text-slate-300">{f.file ? f.file.name : acceptText}</div>
              {f.error && <div className="text-xs text-red-400">{f.error}</div>}
            </div>
            <input type="file" name={key} accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />
          </label>
          <div className="w-28 flex flex-col items-end gap-2">
            {f.preview ? (
              <img src={f.preview} alt="preview" className="w-24 h-24 object-cover rounded-md border" />
            ) : f.file && f.file.type === 'application/pdf' ? (
              <a href={URL.createObjectURL(f.file)} target="_blank" rel="noreferrer" className="text-sm text-primary-300">Preview PDF</a>
            ) : (
              <div className="w-24 h-24 bg-slate-800 rounded-md flex items-center justify-center text-xs text-slate-400">No preview</div>
            )}
            <div className="flex gap-2">
              {f.file && <button type="button" onClick={() => removeFile(key)} className="text-red-400 flex items-center gap-1"><Trash2 className="w-4 h-4" />Remove</button>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" /> Back to Login
          </Link>
          <div className="text-sm text-slate-400">Step <span className="text-primary-400 font-semibold">{step}</span> of 2</div>
        </div>

        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-lg">
          <h2 className="text-2xl text-white font-semibold mb-4">Student Registration</h2>

          {step === 1 && (
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Full Name *</label>
                  <input name="name" value={form.name ?? ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-slate-700/30 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Mobile Number *</label>
                  <input name="phone" value={form.phone ?? ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-slate-700/30 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Email *</label>
                <input name="email" value={form.email ?? ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-slate-700/30 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Password *</label>
                  <input name="password" type="password" value={form.password ?? ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-slate-700/30 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Confirm Password *</label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword ?? ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-slate-700/30 text-white" />
                </div>
              </div>

              <button type="button" onClick={handleNext} className="w-full bg-primary-600 py-2.5 rounded text-white font-semibold">Next: Upload Documents</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-slate-400">Upload required documents. Allowed: JPG, JPEG, PNG, PDF. Max 5MB each.</p>

              <div className="grid grid-cols-1 gap-4">
                {renderFileBlock('aadhar', 'Aadhaar / Government ID', 'Select Aadhaar or Government ID')}
                {renderFileBlock('collegeId', 'College ID / Employee ID', 'Select College / Employee ID')}
                {renderFileBlock('photo', 'Passport-size Photo', 'Select passport photo')}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 border border-slate-600 text-slate-300 py-2.5 rounded">Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-primary-600 py-2.5 rounded text-white">{loading ? 'Submitting...' : 'Submit Registration'}</button>
              </div>
            </form>
          )}

          <div className="mt-4 text-sm text-slate-400">Your account will be assigned <strong>role = "student"</strong> and set to <em>Pending Verification</em> until an admin reviews documents.</div>
        </div>
      </div>
    </div>
  );
}
