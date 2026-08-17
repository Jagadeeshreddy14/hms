const PaymentSlip = require('../models/PaymentSlip');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs').promises;

// @desc    Upload payment slip
// @route   POST /api/payment-slips
exports.uploadSlip = async (req, res, next) => {
  try {
    const { paymentId, transactionId } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Validate file type
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'File type not allowed. Only PDF, JPG, PNG accepted' });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
    }

    // Verify payment exists and belongs to student
    const payment = await Payment.findById(paymentId).populate('student');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Verify student owns this payment (if student is uploading)
    const studentId = req.user.studentId || payment.student._id;
    if (req.user.role === 'student' && payment.student._id.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only upload slips for your own payments' });
    }

    // If a slip already exists for this payment:
    // If pending or verified, reject duplicate. If rejected, delete old slip to allow re-upload.
    const existingSlip = await PaymentSlip.findOne({ payment: paymentId });
    if (existingSlip) {
      if (existingSlip.status === 'verified') {
        return res.status(400).json({ success: false, message: 'Payment is already verified and paid' });
      }
      if (existingSlip.status === 'pending') {
        return res.status(400).json({ success: false, message: 'A payment screenshot is already pending review' });
      }
      // If rejected, remove old slip record
      await PaymentSlip.findByIdAndDelete(existingSlip._id);
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase().slice(1);
    const fileName = `${paymentId}_${Date.now()}.${fileExt}`;
    const fileUrl = `/uploads/slips/${fileName}`;

    const slip = await PaymentSlip.create({
      payment: paymentId,
      student: payment.student._id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: fileExt,
      fileUrl,
      status: 'pending',
    });

    // Update payment status to pending_verification
    await Payment.findByIdAndUpdate(paymentId, {
      status: 'pending_verification',
      ...(transactionId ? { transactionId } : {}),
      paymentMethod: 'upi',
    });

    res.status(201).json({ success: true, data: slip, message: 'Payment screenshot submitted for admin approval' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment slips for student
// @route   GET /api/payment-slips
exports.getSlips = async (req, res, next) => {
  try {
    const { paymentId } = req.query;
    const studentId = req.user.studentId;

    let query = { student: studentId };
    if (paymentId) {
      query.payment = paymentId;
    }

    const slips = await PaymentSlip.find(query)
      .populate({
        path: 'payment',
        select: 'period year amount status dueDate receiptNumber paymentDate',
      })
      .sort('-uploadDate');

    res.json({ success: true, data: slips });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all slips (admin/warden)
// @route   GET /api/payment-slips/admin/all
exports.getAllSlips = async (req, res, next) => {
  try {
    const { status, studentId } = req.query;

    let query = {};
    if (status) query.status = status;
    if (studentId) query.student = studentId;

    const slips = await PaymentSlip.find(query)
      .populate({
        path: 'student',
        select: 'name rollNumber email phone',
      })
      .populate('payment', 'period year amount status dueDate receiptNumber transactionId')
      .sort('-uploadDate');

    res.json({ success: true, data: slips });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify/Approve/Reject payment slip
// @route   PUT /api/payment-slips/:id/verify
exports.verifySlip = async (req, res, next) => {
  try {
    const { status, notes, rejectionReason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be verified or rejected' });
    }

    const slip = await PaymentSlip.findByIdAndUpdate(
      req.params.id,
      {
        status,
        verifiedBy: req.user._id,
        verificationNotes: notes,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
      },
      { new: true }
    ).populate('payment').populate('student');

    if (!slip) {
      return res.status(404).json({ success: false, message: 'Payment slip not found' });
    }

    if (status === 'verified') {
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      await Payment.findByIdAndUpdate(slip.payment._id, {
        status: 'paid',
        paymentDate: new Date(),
        paymentMethod: 'upi',
        collectedBy: req.user._id,
        receiptNumber,
        notes: notes || undefined,
      });

      // Notification
      const studentDoc = await Student.findById(slip.student._id);
      if (studentDoc?.user) {
        await Notification.create({
          recipient: studentDoc.user,
          title: 'Payment Approved ✅',
          message: `Your payment of ₹${slip.payment.amount} for ${slip.payment.period} ${slip.payment.year} has been approved! Receipt: ${receiptNumber}`,
          type: 'payment',
          metadata: { paymentId: slip.payment._id },
        });
      }
    } else if (status === 'rejected') {
      // Revert payment back to pending
      await Payment.findByIdAndUpdate(slip.payment._id, {
        status: 'pending',
      });

      // Notification
      const studentDoc = await Student.findById(slip.student._id);
      if (studentDoc?.user) {
        await Notification.create({
          recipient: studentDoc.user,
          title: 'Payment Proof Rejected ⚠️',
          message: `Your payment screenshot for ${slip.payment.period} ${slip.payment.year} was rejected: ${rejectionReason || 'Invalid proof'}. Please re-upload.`,
          type: 'payment',
          metadata: { paymentId: slip.payment._id },
        });
      }
    }

    res.json({ success: true, data: slip, message: status === 'verified' ? 'Payment approved successfully' : 'Payment rejected' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment slip
// @route   DELETE /api/payment-slips/:id
exports.deleteSlip = async (req, res, next) => {
  try {
    const slip = await PaymentSlip.findByIdAndDelete(req.params.id);

    if (!slip) {
      return res.status(404).json({ success: false, message: 'Slip not found' });
    }

    res.json({ success: true, data: { message: 'Slip deleted' } });
  } catch (error) {
    next(error);
  }
};
