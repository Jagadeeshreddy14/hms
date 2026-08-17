const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
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
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    period: {
      type: String,
      required: true,
      enum: ['H1', 'H2'], // H1: January-June, H2: July-December
    },
    year: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'pending_verification', 'overdue', 'waived'],
      default: 'pending',
    },
    paymentDate: Date,
    dueDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'online', 'upi', 'bank_transfer', 'cheque', null],
    },
    transactionId: String,
    receiptNumber: String,
    lateFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    notes: String,
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for payment slip
paymentSchema.virtual('slip', {
  ref: 'PaymentSlip',
  localField: '_id',
  foreignField: 'payment',
  justOne: true,
});

// Auto-generate receipt number
paymentSchema.pre('save', function (next) {
  if (!this.receiptNumber && this.status === 'paid') {
    this.receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Index for quick lookups
paymentSchema.index({ student: 1, period: 1, year: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
