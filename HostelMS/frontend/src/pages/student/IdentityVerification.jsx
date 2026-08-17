import React, { useState, useEffect, useRef } from 'react';
import { kycAPI } from '../../services/api';
import { PageHeader, Card, Button, Loading } from '../../components/common';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ExternalLink,
  CheckCircle2, AlertTriangle, XCircle, FileArchive,
  User, Key, Trash2, Clock, Info, RefreshCw
} from 'lucide-react';

export default function IdentityVerification() {
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [zipFile, setZipFile] = useState(null);
  const [shareCode, setShareCode] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const shareCodeInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const { data } = await kycAPI.getAadhaarStatus();
      setKycData(data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Aadhaar verification status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Please upload a valid .zip file downloaded from UIDAI');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds maximum limit of 5MB');
      return;
    }
    setZipFile(file);
    setTimeout(() => {
      shareCodeInputRef.current?.focus();
    }, 150);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleVerifySubmit = async (e) => {
    if (e) e.preventDefault();

    if (!zipFile) {
      toast.error('Please choose your Aadhaar Offline e-KYC ZIP file');
      return;
    }

    if (!shareCode || shareCode.trim().length !== 4) {
      toast.error('Please enter the 4-digit numeric Share Code');
      shareCodeInputRef.current?.focus();
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('zipFile', zipFile);
    formData.append('shareCode', shareCode.trim());

    try {
      const { data } = await kycAPI.verifyAadhaar(formData);
      toast.success(data.message || 'Aadhaar verification completed!');
      setZipFile(null);
      setShareCode('');
      fetchStatus();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
        'The uploaded e-KYC file could not be processed. Please check your Share Code and try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      await kycAPI.deleteAadhaarData();
      toast.success('Aadhaar verification record cleared');
      setShowRevokeModal(false);
      fetchStatus();
    } catch (err) {
      toast.error('Error resetting verification data');
    }
  };

  if (loading) return <Loading />;

  const status = kycData?.status || 'NOT_VERIFIED';

  const getStatusBadge = () => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Manual Review
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'PENDING':
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-300">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-300">
            ○ Not Verified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Aadhaar Identity Verification"
        subtitle="Official UIDAI Paperless Offline e-KYC Verification"
      />

      {/* VERIFIED SUCCESS CARD */}
      {status === 'VERIFIED' ? (
        <Card className="p-6 md:p-8 bg-white border border-emerald-200 shadow-sm rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-600/20">
                ✓
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-900">Aadhaar Identity Verified</h3>
                  {getStatusBadge()}
                </div>
                <p className="text-xs text-slate-500">
                  Government UIDAI Paperless e-KYC Cryptographically Validated
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRevokeModal(true)}
              className="text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Re-verify Document
            </Button>
          </div>

          {/* Resident Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Resident Photo (Real base64 extracted from UIDAI XML) */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              {kycData?.photoBase64 ? (
                <img
                  src={kycData.photoBase64}
                  alt="Verified Resident"
                  className="w-28 h-32 object-cover rounded-xl border-2 border-emerald-500 shadow-md"
                />
              ) : (
                <div className="w-28 h-32 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                  <User className="w-12 h-12" />
                </div>
              )}
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                ✓ UIDAI Verified Photo
              </span>
            </div>

            {/* Demographic Information */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Full Name</span>
                  <span className="text-sm font-bold text-slate-900">{kycData?.verifiedName || 'Resident'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
                  <span className="text-sm font-bold text-slate-900">{kycData?.verifiedDob || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender</span>
                  <span className="text-sm font-bold text-slate-900">{kycData?.verifiedGender || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Masked Aadhaar Number</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{kycData?.maskedAadhaar || 'XXXX-XXXX-XXXX'}</span>
                </div>
              </div>

              {/* Verified Address */}
              {kycData?.address && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Permanent Address</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {[
                      kycData.address.careOf,
                      kycData.address.street,
                      kycData.address.city,
                      kycData.address.state,
                      kycData.address.pincode
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Verification Metadata Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500">
                <span>
                  <strong>Verified On:</strong> {kycData?.verifiedAt ? new Date(kycData.verifiedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
                </span>
                <span>
                  <strong>Method:</strong> {kycData?.verificationMethod === 'MANUAL_ADMIN_REVIEW' ? 'Manual Admin Review' : 'Aadhaar Offline e-KYC'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        /* NOT VERIFIED / MANUAL REVIEW / PENDING / FAILED WORKFLOW */
        <Card className="p-6 md:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Aadhaar Paperless e-KYC</h3>
              <p className="text-xs text-slate-500">
                Official 3-Step Verification using UIDAI Paperless Offline XML
              </p>
            </div>
            <div>{getStatusBadge()}</div>
          </div>

          {/* MANUAL REVIEW NOTICE BANNER */}
          {status === 'MANUAL_REVIEW' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block text-sm">Under Administrative Review</span>
                <p>Your Aadhaar document requires manual verification by the hostel administrator.</p>
                {kycData?.failureReason && (
                  <p className="text-[11px] text-amber-700 italic">Reason: {kycData.failureReason}</p>
                )}
              </div>
            </div>
          )}

          {/* FAILED NOTICE BANNER */}
          {status === 'FAILED' && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900">
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block text-sm">Verification Incomplete</span>
                <p>The uploaded e-KYC file could not be processed. Please download a fresh Offline e-KYC file from UIDAI and try again.</p>
              </div>
            </div>
          )}

          {/* STEP 1: Download from UIDAI */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">Step 1</span>
                <h4 className="text-sm font-bold text-slate-900">Download Aadhaar Offline e-KYC from UIDAI</h4>
                <p className="text-xs text-slate-500">
                  Log in to the official myAadhaar portal using Aadhaar OTP, choose a 4-digit Share Code (e.g. 1234), and download your paperless e-KYC ZIP file.
                </p>
              </div>
              <a
                href="https://myaadhaar.uidai.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" /> Open UIDAI Offline e-KYC
              </a>
            </div>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-6">
            {/* STEP 2: Upload Offline e-KYC ZIP */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">Step 2</span>
              <h4 className="text-sm font-bold text-slate-900">Upload Offline e-KYC ZIP *</h4>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isDragOver
                    ? 'border-primary-500 bg-primary-50/50'
                    : zipFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-primary-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="hidden"
                />
                <FileArchive className={`w-8 h-8 mb-2 ${zipFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                {zipFile ? (
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-800">{zipFile.name}</p>
                    <p className="text-[11px] text-slate-500">{(zipFile.size / 1024).toFixed(1)} KB • Click to choose different file</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Choose downloaded .zip file</p>
                    <p className="text-[11px] text-slate-500">offlineaadhaar_... .zip (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: Enter Share Code */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">Step 3</span>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Enter 4-Digit Share Code *</h4>
                <span className="text-[11px] text-slate-400">4 numeric digits</span>
              </div>
              <p className="text-xs text-slate-500">
                The 4-digit numeric password you created on UIDAI while downloading your e-KYC file.
              </p>

              <div className="relative max-w-xs">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  ref={shareCodeInputRef}
                  type="password"
                  maxLength="4"
                  placeholder="e.g. 1234"
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-base font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Action Submit */}
            <Button
              type="submit"
              loading={uploading}
              disabled={uploading || !zipFile || shareCode.length !== 4}
              className="w-full py-3.5 text-sm font-bold shadow-lg shadow-primary-600/20"
            >
              <ShieldCheck className="w-4 h-4 mr-2 inline" />
              {uploading ? 'Validating UIDAI Digital Signature...' : 'Verify Aadhaar Identity'}
            </Button>
          </form>

          {/* UIDAI Privacy & Compliance Seal */}
          <div className="pt-2 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              Compliant with UIDAI Paperless Offline e-KYC Guidelines: Raw Aadhaar numbers are never stored or logged. Demographic data is extracted directly from the digitally signed XML.
            </span>
          </div>
        </Card>
      )}

      {/* Revoke / Re-verify Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h4 className="text-lg font-bold text-slate-900">Re-verify Aadhaar Identity?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will clear your current verification status and allow you to upload a new Aadhaar Offline e-KYC document.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowRevokeModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleRevoke}
              >
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
