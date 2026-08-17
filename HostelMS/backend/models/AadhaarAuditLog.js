const mongoose = require('mongoose');

const aadhaarAuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: [
        'AADHAAR_UPLOAD',
        'AADHAAR_VERIFICATION_STARTED',
        'AADHAAR_VERIFIED',
        'AADHAAR_VERIFICATION_FAILED',
        'AADHAAR_MANUAL_REVIEW_QUEUED',
        'MANUAL_REVIEW_STARTED',
        'MANUAL_VERIFICATION_APPROVED',
        'MANUAL_VERIFICATION_REJECTED',
        'MANUAL_VERIFICATION_REUPLOAD_REQUESTED',
        'AADHAAR_DATA_REVOKED',
      ],
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AadhaarVerification',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AadhaarAuditLog', aadhaarAuditLogSchema);
