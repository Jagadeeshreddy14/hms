const Visitor = require('../models/Visitor');
const Student = require('../models/Student');
const QRCode = require('qrcode');

// @desc    Get visitors
// @route   GET /api/visitors
exports.getVisitors = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.hostel) filter.hostel = req.query.hostel;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) {
      const start = new Date(req.query.date);
      const end = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      filter.entryTime = { $gte: start, $lt: end };
    }

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) filter.student = student._id;
    }

    const visitors = await Visitor.find(filter)
      .populate('student', 'name rollNumber room')
      .populate('approvedBy', 'name')
      .sort('-entryTime');

    res.json({ success: true, count: visitors.length, data: visitors });
  } catch (error) {
    next(error);
  }
};

// @desc    Create visitor entry
// @route   POST /api/visitors
exports.createVisitor = async (req, res, next) => {
  try {
    let studentId = req.body.student;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      studentId = student._id;
    }

    const visitor = await Visitor.create({
      ...req.body,
      student: studentId,
      approvedBy: req.user._id,
      status: 'checked_in',
    });

    // Generate QR code for visitor pass
    try {
      const qrData = JSON.stringify({
        id: visitor._id,
        name: visitor.visitorName,
        entry: visitor.entryTime,
      });
      const qrCode = await QRCode.toDataURL(qrData);
      visitor.qrCode = qrCode;
      await visitor.save();
    } catch (e) {
      console.log('QR generation failed, continuing...', e.message);
    }

    res.status(201).json({ success: true, data: visitor });
  } catch (error) {
    next(error);
  }
};

// @desc    Check out visitor
// @route   PUT /api/visitors/:id/checkout
exports.checkoutVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { exitTime: new Date(), status: 'checked_out' },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor record not found' });
    res.json({ success: true, data: visitor, message: 'Visitor checked out' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update visitor
// @route   PUT /api/visitors/:id
exports.updateVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    res.json({ success: true, data: visitor });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete visitor record
// @route   DELETE /api/visitors/:id
exports.deleteVisitor = async (req, res, next) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Visitor record deleted' });
  } catch (error) {
    next(error);
  }
};
