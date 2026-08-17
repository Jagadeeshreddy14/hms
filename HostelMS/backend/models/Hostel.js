const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hostel name is required'],
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    type: {
      type: String,
      enum: ['boys', 'girls', 'co-ed'],
      required: true,
    },
    totalRooms: {
      type: Number,
      required: true,
      default: 0,
    },
    warden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amenities: [String],
    description: String,
    contactPhone: String,
    contactEmail: String,
    rules: [String],
    image: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: get available rooms count
hostelSchema.virtual('availableRooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'hostel',
  match: { status: 'available' },
  count: true,
});

// Virtual: get occupied rooms count
hostelSchema.virtual('occupiedRooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'hostel',
  match: { status: 'occupied' },
  count: true,
});

module.exports = mongoose.model('Hostel', hostelSchema);
