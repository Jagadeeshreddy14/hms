const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    hostelBlock: {
      type: String,
      required: true,
    },
    floor: {
      type: Number,
      required: true,
      default: 1,
    },
    capacity: {
      type: Number,
      required: true,
      default: 2,
    },
    occupiedCount: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ['single', 'double', 'triple', 'dormitory'],
      default: 'double',
    },
    monthlyRent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
    },
    amenities: [String],
    status: {
      type: String,
      enum: ['available', 'occupied', 'full', 'maintenance'],
      default: 'available',
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    description: String,
    images: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: available beds count
roomSchema.virtual('availableBeds').get(function () {
  return this.capacity - this.occupiedCount;
});

// Auto-update status based on occupancy
roomSchema.pre('save', function (next) {
  if (this.occupiedCount === 0) this.status = 'available';
  else if (this.occupiedCount >= this.capacity) this.status = 'full';
  else this.status = 'occupied';
  next();
});

// Compound index for unique room per hostel
roomSchema.index({ roomNumber: 1, hostel: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
