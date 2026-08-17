const Student = require('../models/Student');
const Notification = require('../models/Notification');
const AadhaarVerification = require('../models/AadhaarVerification');
const AadhaarAuditLog = require('../models/AadhaarAuditLog');
const { processOfflineEkyc } = require('../utils/aadhaarKycService');

// @desc    Upload and verify Aadhaar Offline e-KYC ZIP
// @route   POST /api/kyc/aadhaar/verify
// @access  Private (Student)
exports.uploadAndVerifyAadhaar = async (req, res, next) => {
  try {
    const { shareCode } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your Aadhaar Offline e-KYC ZIP file',
      });
    }

    if (!shareCode || String(shareCode).trim().length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the valid 4-digit Share Code used when downloading from UIDAI',
      });
    }

    // Find student record
    let student = await Student.findOne({ user: req.user._id });
    if (!student && req.user.studentId) {
      student = await Student.findById(req.user.studentId);
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    console.log(`🔒 Processing Aadhaar Offline e-KYC for student: ${student.name} (${student._id})`);

    // Process & verify in-memory
    const kycResult = await processOfflineEkyc(
      req.file.buffer,
      shareCode,
      student.name
    );

    // Save or update dedicated AadhaarVerification collection
    const verificationRecord = await AadhaarVerification.findOneAndUpdate(
      { student: student._id },
      {
        student: student._id,
        status: kycResult.status,
        verificationMethod: 'AADHAAR_OFFLINE_EKYC',
        verifiedName: kycResult.verifiedName,
        verifiedDob: kycResult.verifiedDob,
        verifiedGender: kycResult.verifiedGender,
        maskedAadhaar: kycResult.maskedAadhaar,
        nameMatch: kycResult.nameSimilarity >= 70,
        photoBase64: kycResult.photoBase64,
        address: kycResult.address,
        verificationReference: kycResult.verificationReference,
        verifiedAt: kycResult.verifiedAt,
        failureReason: kycResult.failureReason,
      },
      { upsert: true, new: true }
    );

    // Update student KYC status
    student.aadhaarVerification = {
      status: kycResult.status,
      verificationMethod: 'AADHAAR_OFFLINE_EKYC',
      verifiedName: kycResult.verifiedName,
      verifiedDob: kycResult.verifiedDob,
      verifiedGender: kycResult.verifiedGender,
      verificationReference: kycResult.verificationReference,
      verifiedAt: kycResult.verifiedAt,
      failureReason: kycResult.failureReason,
      photoBase64: kycResult.photoBase64,
      maskedAadhaar: kycResult.maskedAadhaar,
      address: kycResult.address,
    };

    // If verified or in review, update student's address if not set
    if (kycResult.address?.street && !student.address) {
      student.address = kycResult.address.street;
    }
    if (kycResult.address?.city && !student.city) {
      student.city = kycResult.address.city;
    }
    if (kycResult.address?.state && !student.state) {
      student.state = kycResult.address.state;
    }
    if (kycResult.address?.pincode && !student.pincode) {
      student.pincode = kycResult.address.pincode;
    }

    await student.save();

    // Log in AadhaarAuditLog (Never log Aadhaar number or Share Code)
    await AadhaarAuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role || 'student',
      action: kycResult.status === 'VERIFIED'
        ? 'AADHAAR_VERIFIED'
        : kycResult.status === 'MANUAL_REVIEW'
        ? 'AADHAAR_MANUAL_REVIEW_QUEUED'
        : 'AADHAAR_VERIFICATION_FAILED',
      studentId: student._id,
      verificationId: verificationRecord._id,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      details: {
        method: 'AADHAAR_OFFLINE_EKYC',
        status: kycResult.status,
        nameMatch: kycResult.nameSimilarity >= 70,
        nameSimilarityPercent: kycResult.nameSimilarity,
        referenceId: kycResult.verificationReference,
      },
    });

    // Create student notification
    const notificationTitle = kycResult.status === 'VERIFIED'
      ? 'Aadhaar Identity Verified'
      : kycResult.status === 'MANUAL_REVIEW'
      ? 'Aadhaar e-KYC Under Manual Review'
      : 'Aadhaar Verification Incomplete';

    const notificationMessage = kycResult.status === 'VERIFIED'
      ? `Your identity has been successfully verified via UIDAI Aadhaar Offline e-KYC as "${kycResult.verifiedName}".`
      : kycResult.status === 'MANUAL_REVIEW'
      ? `Your Aadhaar e-KYC was received and submitted for administrative review (${kycResult.failureReason || 'Verification check'}).`
      : `Aadhaar verification could not be completed: ${kycResult.failureReason || 'Please check your document'}.`;

    await Notification.create({
      user: req.user._id,
      title: notificationTitle,
      message: notificationMessage,
      type: kycResult.status === 'VERIFIED' ? 'success' : 'warning',
      link: '/student/identity-verification',
    });

    console.log(`✅ Aadhaar e-KYC processed with status: ${kycResult.status}`);

    res.status(200).json({
      success: true,
      message: kycResult.status === 'VERIFIED'
        ? 'Aadhaar verification successful!'
        : 'Aadhaar e-KYC submitted — undergoing administrative review',
      data: {
        status: student.aadhaarVerification.status,
        verificationMethod: 'AADHAAR_OFFLINE_EKYC',
        verifiedName: student.aadhaarVerification.verifiedName,
        verifiedDob: student.aadhaarVerification.verifiedDob,
        verifiedGender: student.aadhaarVerification.verifiedGender,
        maskedAadhaar: student.aadhaarVerification.maskedAadhaar,
        verifiedAt: student.aadhaarVerification.verifiedAt,
        failureReason: student.aadhaarVerification.failureReason,
        address: student.aadhaarVerification.address,
        photoBase64: student.aadhaarVerification.photoBase64,
        nameSimilarity: kycResult.nameSimilarity,
        nameMatch: kycResult.nameSimilarity >= 70,
      },
    });
  } catch (error) {
    console.error('❌ Aadhaar KYC Error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'The uploaded e-KYC document could not be processed. Please download a fresh Offline e-KYC file from UIDAI and try again.',
    });
  }
};

// @desc    Get Aadhaar verification status
// @route   GET /api/kyc/aadhaar/status
// @access  Private (Student)
exports.getAadhaarKycStatus = async (req, res, next) => {
  try {
    let student = await Student.findOne({ user: req.user._id });
    if (!student && req.user.studentId) {
      student = await Student.findById(req.user.studentId);
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const kyc = student.aadhaarVerification || { status: 'NOT_VERIFIED' };

    res.status(200).json({
      success: true,
      data: {
        status: kyc.status || 'NOT_VERIFIED',
        verificationMethod: kyc.verificationMethod,
        verifiedName: kyc.verifiedName,
        verifiedDob: kyc.verifiedDob,
        verifiedGender: kyc.verifiedGender,
        maskedAadhaar: kyc.maskedAadhaar,
        verificationReference: kyc.verificationReference,
        verifiedAt: kyc.verifiedAt,
        failureReason: kyc.failureReason,
        address: kyc.address,
        photoBase64: kyc.photoBase64,
        studentName: student.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Revoke stored Aadhaar KYC demographic data
// @route   DELETE /api/kyc/aadhaar/data
// @access  Private (Student)
exports.deleteAadhaarKycData = async (req, res, next) => {
  try {
    let student = await Student.findOne({ user: req.user._id });
    if (!student && req.user.studentId) {
      student = await Student.findById(req.user.studentId);
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    student.aadhaarVerification = {
      status: 'NOT_VERIFIED',
      verificationMethod: 'AADHAAR_OFFLINE_EKYC',
    };

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Aadhaar KYC data removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all student KYC verifications for admin
// @route   GET /api/kyc/admin/verifications
// @access  Private (Admin/Warden)
exports.getAdminKycVerifications = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const query = {};
    if (status) {
      query['aadhaarVerification.status'] = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .populate('user', 'name email role phone')
      .populate('room', 'roomNumber block floor')
      .populate('hostel', 'name')
      .sort({ 'aadhaarVerification.verifiedAt': -1, updatedAt: -1 });

    const totalStudents = await Student.countDocuments();
    const verifiedCount = await Student.countDocuments({ 'aadhaarVerification.status': 'VERIFIED' });
    const manualReviewCount = await Student.countDocuments({ 'aadhaarVerification.status': 'MANUAL_REVIEW' });
    const pendingCount = await Student.countDocuments({ 'aadhaarVerification.status': 'PENDING' });
    const notVerifiedCount = await Student.countDocuments({
      $or: [
        { 'aadhaarVerification.status': 'NOT_VERIFIED' },
        { 'aadhaarVerification.status': { $exists: false } },
      ],
    });

    res.status(200).json({
      success: true,
      data: students,
      stats: {
        total: totalStudents,
        verified: verifiedCount,
        manualReview: manualReviewCount,
        pending: pendingCount,
        notVerified: notVerifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin review/approve/reject manual KYC
// @route   PUT /api/kyc/admin/review/:studentId
// @route   POST /api/kyc/aadhaar/manual-review
// @access  Private (Admin)
exports.adminReviewKyc = async (req, res, next) => {
  try {
    const { status, reviewNotes, reviewReason } = req.body;
    const studentId = req.params.studentId || req.body.studentId;

    const reasonText = reviewNotes || reviewReason || '';

    if (!['VERIFIED', 'FAILED', 'NOT_VERIFIED', 'MANUAL_REVIEW'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be VERIFIED, FAILED, or NOT_VERIFIED',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    const verificationMethod = status === 'VERIFIED' ? 'MANUAL_ADMIN_REVIEW' : (student.aadhaarVerification?.verificationMethod || 'AADHAAR_OFFLINE_EKYC');

    student.aadhaarVerification = {
      ...(student.aadhaarVerification || {}),
      status,
      verificationMethod,
      reviewedBy: req.user._id,
      reviewNotes: reasonText,
      reviewedAt: new Date(),
      verifiedAt: status === 'VERIFIED' ? new Date() : student.aadhaarVerification?.verifiedAt,
      failureReason: status === 'FAILED' ? (reasonText || 'Verification rejected by administrator') : undefined,
    };

    await student.save();

    // Update AadhaarVerification collection
    const updatedRecord = await AadhaarVerification.findOneAndUpdate(
      { student: student._id },
      {
        student: student._id,
        status,
        verificationMethod,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewReason: reasonText,
        verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
        failureReason: status === 'FAILED' ? reasonText : undefined,
      },
      { upsert: true, new: true }
    );

    // Audit Log
    const auditAction = status === 'VERIFIED'
      ? 'MANUAL_VERIFICATION_APPROVED'
      : status === 'FAILED'
      ? 'MANUAL_VERIFICATION_REJECTED'
      : 'MANUAL_VERIFICATION_REUPLOAD_REQUESTED';

    await AadhaarAuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role || 'admin',
      action: auditAction,
      studentId: student._id,
      verificationId: updatedRecord._id,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      details: {
        method: 'MANUAL_ADMIN_REVIEW',
        status,
        reviewReason: reasonText,
      },
    });

    // Send notification
    await Notification.create({
      user: student.user,
      title: status === 'VERIFIED' ? 'Aadhaar Verification Approved' : 'Aadhaar Verification Status Updated',
      message: status === 'VERIFIED'
        ? 'Your Aadhaar identity has been reviewed and approved by the hostel administrator.'
        : `Your Aadhaar verification was reviewed: ${reasonText || 'Please upload fresh e-KYC documents.'}`,
      type: status === 'VERIFIED' ? 'success' : 'warning',
      link: '/student/identity-verification',
    });

    res.status(200).json({
      success: true,
      message: `Student Aadhaar verification updated to ${status} (Method: ${verificationMethod})`,
      data: student.aadhaarVerification,
    });
  } catch (error) {
    next(error);
  }
};

// Alias for POST /api/kyc/aadhaar/manual-review
exports.manualReviewAadhaar = exports.adminReviewKyc;

