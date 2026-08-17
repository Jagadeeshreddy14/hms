const mongoose = require('mongoose');

const bankDetailSchema = new mongoose.Schema(
  {
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
      unique: true,
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      unique: true,
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      uppercase: true,
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
    },
    branchName: {
      type: String,
      default: '',
    },
    upiId: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BankDetail', bankDetailSchema);
