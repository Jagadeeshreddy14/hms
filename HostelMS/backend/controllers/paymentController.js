const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// @desc    Get payments
// @route   GET /api/payments
exports.getPayments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.hostel) filter.hostel = req.query.hostel;
    if (req.query.period) filter.period = req.query.period; // H1 or H2
    if (req.query.year) filter.year = parseInt(req.query.year);

    // Students can only see their own payments
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) filter.student = student._id;
    }

    const payments = await Payment.find(filter)
      .populate('student', 'name rollNumber email phone')
      .populate('room', 'roomNumber hostelBlock')
      .populate('hostel', 'name')
      .populate('slip')
      .sort('-createdAt');

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name rollNumber email phone')
      .populate('room', 'roomNumber hostelBlock')
      .populate('hostel', 'name')
      .populate('slip');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Create payment record
// @route   POST /api/payments
exports.createPayment = async (req, res, next) => {
  try {
    const payment = await Payment.create({ ...req.body, collectedBy: req.user._id });

    // Create notification for student
    const student = await Student.findById(req.body.student).populate('user');
    if (student?.user) {
      const periodLabel = req.body.period === 'H1' ? 'Half 1 (Jan-Jun)' : 'Half 2 (Jul-Dec)';
      await Notification.create({
        recipient: student.user._id,
        title: 'Payment Recorded',
        message: `Payment of ₹${req.body.amount} for ${periodLabel} ${req.body.year} has been recorded.`,
        type: 'payment',
        metadata: { paymentId: payment._id },
      });
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark payment as paid
// @route   PUT /api/payments/:id/pay
exports.markAsPaid = async (req, res, next) => {
  try {
    const { paymentMethod, transactionId, notes } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'paid',
        paymentDate: new Date(),
        paymentMethod,
        transactionId,
        notes,
        collectedBy: req.user._id,
      },
      { new: true }
    ).populate('student', 'name');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment, message: 'Payment marked as paid' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
exports.updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment summary / analytics
// @route   GET /api/payments/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'paid', year } },
      { $group: { _id: '$month', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const statusBreakdown = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);

    const totalCollected = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalPending = await Payment.aggregate([
      { $match: { status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        monthlyRevenue,
        statusBreakdown,
        totalCollected: totalCollected[0]?.total || 0,
        totalPending: totalPending[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
