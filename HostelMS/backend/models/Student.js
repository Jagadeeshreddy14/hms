const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    rollNumber: {
      type: String,
      trim: true,
    },
    course: {
      type: String,
    },
    year: {
      type: Number,
      min: 1,
      max: 6,
    },
    branch: {
      type: String,
      enum: ['CSE', 'EEE', 'CIVIL', 'MECH', 'AERO', 'OTHER'],
    },
    department: String,
    university: String,
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
    // Guardian info
    guardianName: String,
    guardianPhone: String,
    guardianRelation: {
      type: String,
      default: 'Parent',
    },
    // Address
    address: String,
    permanentAddress: String,
    city: String,
    state: String,
    pincode: String,
    // Dates
    admissionDate: Date,
    vacatingDate: Date,
    // Documents
    idProofType: {
      type: String,
      enum: ['aadhar', 'passport', 'voter_id', 'driving_license'],
    },
    idProofNumber: String,
    aadharUrl: String,
    collegeIdUrl: String,
    // Registration Approval
    registrationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalDate: Date,
    rejectionReason: String,
    // Status
    status: {
      type: String,
      enum: ['active', 'vacated', 'suspended'],
      default: 'active',
    },
    photo: String,
    photoUrl: String,
    bloodGroup: String,
    emergencyContact: String,
  },
  { timestamps: true }
);

// Unique index only for non-empty string roll numbers
studentSchema.index(
  { rollNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { rollNumber: { $type: 'string', $gt: '' } },
  }
);

// Prevent storing empty string or null for rollNumber
studentSchema.pre('save', function (next) {
  if (!this.rollNumber || (typeof this.rollNumber === 'string' && this.rollNumber.trim() === '')) {
    this.rollNumber = undefined;
  }
  next();
});

studentSchema.pre(['updateOne', 'findOneAndUpdate', 'findByIdAndUpdate'], function (next) {
  const update = this.getUpdate();
  if (update) {
    if (update.rollNumber === '' || update.rollNumber === null) {
      delete update.rollNumber;
      if (!update.$unset) update.$unset = {};
      update.$unset.rollNumber = 1;
    } else if (update.$set && (update.$set.rollNumber === '' || update.$set.rollNumber === null)) {
      delete update.$set.rollNumber;
      if (!update.$unset) update.$unset = {};
      update.$unset.rollNumber = 1;
    }
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
