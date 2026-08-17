const BankDetail = require('../models/BankDetail');

// @desc    Get all bank details
// @route   GET /api/bank-details
exports.getAll = async (req, res, next) => {
  try {
    const bankDetails = await BankDetail.find({ isActive: true }).populate('hostel', 'name');
    res.json({ success: true, data: bankDetails });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bank detail for specific hostel
// @route   GET /api/bank-details/hostel/:hostelId
exports.getByHostel = async (req, res, next) => {
  try {
    const bankDetail = await BankDetail.findOne({
      hostel: req.params.hostelId,
      isActive: true,
    }).populate('hostel', 'name');

    if (!bankDetail) {
      return res.status(404).json({ success: false, message: 'Bank details not found' });
    }

    res.json({ success: true, data: bankDetail });
  } catch (error) {
    next(error);
  }
};

// @desc    Create bank details
// @route   POST /api/bank-details
exports.create = async (req, res, next) => {
  try {
    // Check if bank details already exist for this hostel
    const existing = await BankDetail.findOne({ hostel: req.body.hostel });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bank details already exist for this hostel' });
    }

    const bankDetail = await BankDetail.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await bankDetail.populate('hostel', 'name');
    res.status(201).json({ success: true, data: bankDetail });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bank details
// @route   PUT /api/bank-details/:id
exports.update = async (req, res, next) => {
  try {
    const bankDetail = await BankDetail.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('hostel', 'name');

    if (!bankDetail) {
      return res.status(404).json({ success: false, message: 'Bank details not found' });
    }

    res.json({ success: true, data: bankDetail });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bank details
// @route   DELETE /api/bank-details/:id
exports.delete = async (req, res, next) => {
  try {
    const bankDetail = await BankDetail.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!bankDetail) {
      return res.status(404).json({ success: false, message: 'Bank details not found' });
    }

    res.json({ success: true, data: { message: 'Bank details deleted' } });
  } catch (error) {
    next(error);
  }
};
