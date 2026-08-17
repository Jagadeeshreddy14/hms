const Student = require('../models/Student');
const Notification = require('../models/Notification');
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
        : 'Aadhaar e-KYC submitted — undergoing review',
      data: {
        status: student.aadhaarVerification.status,
        verifiedName: student.aadhaarVerification.verifiedName,
        verifiedDob: student.aadhaarVerification.verifiedDob,
        verifiedGender: student.aadhaarVerification.verifiedGender,
        maskedAadhaar: student.aadhaarVerification.maskedAadhaar,
        verifiedAt: student.aadhaarVerification.verifiedAt,
        failureReason: student.aadhaarVerification.failureReason,
        address: student.aadhaarVerification.address,
        photoBase64: student.aadhaarVerification.photoBase64,
        nameSimilarity: kycResult.nameSimilarity,
      },
    });
  } catch (error) {
    console.error('❌ Aadhaar KYC Error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'The uploaded e-KYC document could not be verified. Please download a fresh Offline e-KYC file from UIDAI and try again.',
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
// @access  Private (Admin)
exports.adminReviewKyc = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    const { studentId } = req.params;

    if (!['VERIFIED', 'FAILED', 'NOT_VERIFIED'].includes(status)) {
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

    student.aadhaarVerification = {
      ...(student.aadhaarVerification || {}),
      status,
      reviewedBy: req.user._id,
      reviewNotes: reviewNotes || '',
      verifiedAt: status === 'VERIFIED' ? new Date() : student.aadhaarVerification?.verifiedAt,
      failureReason: status === 'FAILED' ? (reviewNotes || 'Verification rejected by administrator') : undefined,
    };

    await student.save();

    // Send notification
    await Notification.create({
      user: student.user,
      title: status === 'VERIFIED' ? 'Aadhaar Verification Approved' : 'Aadhaar Verification Status Updated',
      message: status === 'VERIFIED'
        ? 'Your Aadhaar identity has been reviewed and approved by the administrator.'
        : `Your Aadhaar verification was reviewed: ${reviewNotes || 'Please upload fresh e-KYC documents.'}`,
      type: status === 'VERIFIED' ? 'success' : 'warning',
      link: '/student/identity-verification',
    });

    res.status(200).json({
      success: true,
      message: `Student Aadhaar verification updated to ${status}`,
      data: student.aadhaarVerification,
    });
  } catch (error) {
    next(error);
  }
};
