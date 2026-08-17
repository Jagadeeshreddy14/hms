import React, { useState, useEffect } from 'react';
import { kycAPI } from '../../services/api';
import { PageHeader, Card, Button, Loading } from '../../components/common';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Shield, ExternalLink,
  CheckCircle2, AlertTriangle, XCircle, Clock, FileArchive,
  User, Key, Trash2, Lock
} from 'lucide-react';

export default function IdentityVerification() {
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [zipFile, setZipFile] = useState(null);
  const [shareCode, setShareCode] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await kycAPI.getAadhaarStatus();
      setKycData(data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load identity verification status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Please select the .zip file downloaded from UIDAI');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }
    setZipFile(file);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!zipFile) {
      toast.error('Please upload your Aadhaar Offline e-KYC ZIP file');
      return;
    }
    if (!shareCode.trim() || shareCode.trim().length !== 4) {
      toast.error('Please enter the 4-digit numeric Share Code');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('zipFile', zipFile);
    formData.append('shareCode', shareCode.trim());

    try {
      const { data } = await kycAPI.verifyAadhaar(formData);
      toast.success(data.message || 'Aadhaar verification completed');
      setZipFile(null);
      setShareCode('');
      fetchStatus();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Verification failed. Please check your ZIP file and Share Code.');
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      await kycAPI.deleteAadhaarData();
      toast.success('Aadhaar verification data removed');
      setShowRevokeModal(false);
      fetchStatus();
    } catch (err) {
      toast.error('Error removing verification data');
    }
  };

  if (loading) return <Loading />;

  const status = kycData?.status || 'NOT_VERIFIED';

  const getStatusBadge = () => {
    switch (status) {
      case 'VERIFIED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>;
      case 'MANUAL_REVIEW':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold border border-orange-300"><AlertTriangle className="w-3.5 h-3.5" /> Under Manual Review</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold border border-amber-300"><Clock className="w-3.5 h-3.5" /> Verification Pending</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold border border-red-300"><XCircle className="w-3.5 h-3.5" /> Verification Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-300"><Shield className="w-3.5 h-3.5" /> Not Verified</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Identity Verification"
        description="Verify your government identity using official UIDAI Aadhaar Paperless Offline e-KYC"
      />

      {/* Main Status Header Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' : status === 'MANUAL_REVIEW' ? 'bg-orange-100 text-orange-600' : 'bg-primary-100 text-primary-600'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-slate-900 text-lg">Aadhaar Offline e-KYC</h3>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Privacy-preserving demographic verification directly validated against UIDAI digital signatures.
              </p>
            </div>
          </div>

          {status === 'VERIFIED' && (
            <button
              onClick={() => setShowRevokeModal(true)}
              className="text-xs text-slate-400 hover:text-red-600 font-semibold transition inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Re-verify / Remove
            </button>
          )}
        </div>

        {/* VERIFIED STATE */}
        {status === 'VERIFIED' ? (
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-emerald-900 text-sm">✓ Aadhaar Verification Successful</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your identity has been digitally verified via UIDAI Paperless Offline e-KYC on {kycData.verifiedAt ? new Date(kycData.verifiedAt).toLocaleDateString('en-IN') : 'Recently'}.
                </p>
              </div>
            </div>

            {/* Verified Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200">
              {/* Photo */}
              {kycData.photoBase64 ? (
                <div className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <img
                    src={kycData.photoBase64}
                    alt="Aadhaar Verified Resident"
                    className="w-24 h-28 object-cover rounded-lg border border-slate-200 shadow-inner"
                  />
                  <span className="text-[11px] font-semibold text-emerald-700 mt-2">UIDAI Photo Proof</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 text-slate-400">
                  <User className="w-10 h-10 mb-1" />
                  <span className="text-xs">Demographic Only</span>
                </div>
              )}

              {/* Demographic Details */}
              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Verified Name</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{kycData.verifiedName || '-'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Aadhaar Ref (Masked)</p>
                    <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{kycData.maskedAadhaar || 'XXXX-XXXX-XXXX'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{kycData.verifiedDob || '-'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gender</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{kycData.verifiedGender === 'M' ? 'Male' : kycData.verifiedGender === 'F' ? 'Female' : kycData.verifiedGender || '-'}</p>
                  </div>
                </div>

                {kycData.address && (kycData.address.street || kycData.address.city) && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Verified Address</p>
                    <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                      {[kycData.address.careOf, kycData.address.street, kycData.address.city, kycData.address.state, kycData.address.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Compliant with UIDAI guidelines: full Aadhaar number is never stored, displayed, or logged.</span>
            </div>
          </div>
        ) : (
          /* NOT VERIFIED / PENDING / MANUAL REVIEW / FAILED STATE */
          <div className="mt-6 space-y-6">
            {status === 'MANUAL_REVIEW' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900 text-sm">Under Administrative Review</h4>
                  <p className="text-xs text-orange-700 mt-0.5">
                    {kycData.failureReason || 'Your e-KYC document was uploaded and is awaiting manual administrator verification.'}
                  </p>
                </div>
              </div>
            )}

            {status === 'FAILED' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 text-sm">Verification Could Not Be Completed</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    {kycData.failureReason || 'The uploaded e-KYC document could not be verified. Please download a fresh ZIP from UIDAI and try again.'}
                  </p>
                </div>
              </div>
            )}

            {/* Step-by-Step Verification Form */}
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-primary-700 uppercase tracking-wider">Step 1</div>
                  <h4 className="font-semibold text-slate-900 text-base">Download Aadhaar Offline e-KYC from UIDAI</h4>
                  <p className="text-xs text-slate-500 max-w-xl">
                    Log in to the official myAadhaar portal using Aadhaar OTP, choose a 4-digit Share Code (e.g. 1234), and download your paperless e-KYC ZIP file.
                  </p>
                </div>
                <a
                  href="https://myaadhaar.uidai.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" /> Open UIDAI Portal
                </a>
              </div>

              {/* Step 2 & 3 Form */}
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Step 2: Upload ZIP */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-2">
                    <div className="text-xs font-bold text-primary-700 uppercase tracking-wider">Step 2</div>
                    <label className="block text-sm font-semibold text-slate-800">
                      Upload Offline e-KYC ZIP *
                    </label>
                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-primary-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-primary-50/40 transition">
                      <FileArchive className="w-8 h-8 text-primary-500 mb-2" />
                      <span className="text-xs font-semibold text-slate-700 text-center truncate max-w-full px-2">
                        {zipFile ? zipFile.name : 'Choose downloaded .zip file'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">offlineaadhaar_... .zip (Max 5MB)</span>
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Step 3: Enter Share Code */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-primary-700 uppercase tracking-wider">Step 3</div>
                      <label className="block text-sm font-semibold text-slate-800">
                        Enter 4-Digit Share Code *
                      </label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        The 4-digit numeric password you created on UIDAI while downloading.
                      </p>
                    </div>

                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        maxLength="4"
                        placeholder="e.g. 1234"
                        value={shareCode}
                        onChange={(e) => setShareCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-10 pr-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    loading={uploading}
                    disabled={uploading || !zipFile || shareCode.length !== 4}
                    className="w-full py-3 text-sm font-semibold shadow-lg"
                  >
                    <ShieldCheck className="w-4 h-4" /> {uploading ? 'Validating UIDAI Signature & e-KYC...' : 'Verify Aadhaar e-KYC'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Card>

      {/* Security & Privacy Notice */}
      <Card className="p-5 bg-slate-900 text-white border-slate-800">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-slate-100">Official UIDAI Security Standards</p>
            <p className="text-slate-400 leading-relaxed">
              The hostel system utilizes UIDAI Paperless Offline e-KYC. Your ZIP file and Share Code are decrypted only in secure memory to validate digital signatures and extract demographic information. Neither the ZIP archive nor full Aadhaar numbers are ever stored on servers or exposed.
            </p>
          </div>
        </div>
      </Card>

      {/* Revoke / Re-verify Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-slate-900">Re-verify Aadhaar Identity?</h4>
            <p className="text-sm text-slate-600">
              This will clear your current verification status and allow you to upload a new Aadhaar Offline e-KYC document.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowRevokeModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleRevoke}>
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
