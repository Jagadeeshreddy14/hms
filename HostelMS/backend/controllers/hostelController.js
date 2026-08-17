const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Student = require('../models/Student');

// @desc    Get all hostels
// @route   GET /api/hostels
exports.getHostels = async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ isActive: true }).populate('warden', 'name email phone');

    // Add room stats for each hostel
    const hostelsWithStats = await Promise.all(
      hostels.map(async (hostel) => {
        const [total, available, occupied, full] = await Promise.all([
          Room.countDocuments({ hostel: hostel._id }),
          Room.countDocuments({ hostel: hostel._id, status: 'available' }),
          Room.countDocuments({ hostel: hostel._id, status: 'occupied' }),
          Room.countDocuments({ hostel: hostel._id, status: 'full' }),
        ]);
        return { ...hostel.toObject(), stats: { total, available, occupied, full } };
      })
    );

    res.json({ success: true, count: hostels.length, data: hostelsWithStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hostel
// @route   GET /api/hostels/:id
exports.getHostel = async (req, res, next) => {
  try {
    const hostel = await Hostel.findById(req.params.id).populate('warden', 'name email phone');
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    res.json({ success: true, data: hostel });
  } catch (error) {
    next(error);
  }
};

// @desc    Create hostel
// @route   POST /api/hostels
exports.createHostel = async (req, res, next) => {
  try {
    const hostel = await Hostel.create(req.body);
    res.status(201).json({ success: true, data: hostel });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hostel
// @route   PUT /api/hostels/:id
exports.updateHostel = async (req, res, next) => {
  try {
    const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    res.json({ success: true, data: hostel });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hostel
// @route   DELETE /api/hostels/:id
exports.deleteHostel = async (req, res, next) => {
  try {
    await Hostel.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Hostel deactivated' });
  } catch (error) {
    next(error);
  }
};
