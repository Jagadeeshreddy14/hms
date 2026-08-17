const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    visitorPhone: {
      type: String,
      required: [true, 'Visitor phone is required'],
    },
    visitorEmail: String,
    visitorIdType: {
      type: String,
      enum: ['aadhar', 'passport', 'voter_id', 'driving_license', 'other'],
    },
    visitorIdNumber: String,
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
    },
    relationship: {
      type: String,
      enum: ['Father', 'Mother', 'Sibling', 'Friend', 'Guardian', 'Other'],
      default: 'Other',
    },
    entryTime: {
      type: Date,
      default: Date.now,
    },
    exitTime: Date,
    expectedExitTime: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'checked_in', 'checked_out', 'rejected'],
      default: 'approved',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: String,
    qrCode: String,
    vehicleNumber: String,
    numberOfVisitors: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);
