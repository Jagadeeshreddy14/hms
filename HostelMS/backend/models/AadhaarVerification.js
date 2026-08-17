const mongoose = require('mongoose');

const aadhaarVerificationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        'NOT_VERIFIED',
        'PENDING',
        'PROCESSING',
        'VERIFIED',
        'FAILED',
        'MANUAL_REVIEW',
        'EXPIRED',
      ],
      default: 'NOT_VERIFIED',
      index: true,
    },

    verificationMethod: {
      type: String,
      enum: [
        'AADHAAR_OFFLINE_EKYC',
        'MANUAL_ADMIN_REVIEW',
      ],
      default: 'AADHAAR_OFFLINE_EKYC',
    },

    verifiedName: {
      type: String,
      trim: true,
    },

    verifiedDob: {
      type: String,
      trim: true,
    },

    verifiedGender: {
      type: String,
      trim: true,
    },

    maskedAadhaar: {
      type: String,
      trim: true,
    },

    nameMatch: {
      type: Boolean,
      default: false,
    },

    photoBase64: {
      type: String,
    },

    address: {
      careOf: String,
      street: String,
      landmark: String,
      locality: String,
      city: String,
      district: String,
      state: String,
      pincode: String,
      fullAddress: String,
    },

    verificationReference: {
      type: String,
    },

    verifiedAt: {
      type: Date,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    reviewedAt: {
      type: Date,
    },

    reviewReason: {
      type: String,
      trim: true,
    },

    failureReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AadhaarVerification', aadhaarVerificationSchema);
