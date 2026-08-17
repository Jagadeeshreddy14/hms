const Student = require('../models/Student');
const Notification = require('../models/Notification');

// @desc    Get pending student registrations
// @route   GET /api/student-approvals
exports.getPendingRegistrations = async (req, res, next) => {
  try {
    const registrations = await Student.find({ registrationStatus: 'pending' })
      .populate('user', 'name email phone')
      .sort('-createdAt');

    res.json({ 
      success: true, 
      registrations,
      data: registrations 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student registration details
// @route   GET /api/student-approvals/:id
exports.getRegistrationDetails = async (req, res, next) => {
  try {
    const registration = await Student.findById(req.params.id)
      .populate('user', 'name email phone role');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, registration, data: registration });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve student registration
// @route   PUT /api/student-approvals/:id/approve
exports.approveRegistration = async (req, res, next) => {
  try {
    const { approvalNotes } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        registrationStatus: 'approved',
        approvedBy: req.user._id,
        approvalDate: new Date(),
      },
      { new: true }
    ).populate('user', 'name email phone');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Create notification for student
    if (student.user) {
      await Notification.create({
        recipient: student.user._id,
        title: 'Registration Approved',
        message: 'Your hostel registration has been approved. You can now login and explore hostel features.',
        type: 'approval',
        metadata: { studentId: student._id },
      });
    }

    res.json({ success: true, data: student, message: 'Registration approved successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject student registration
// @route   PUT /api/student-approvals/:id/reject
exports.rejectRegistration = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        registrationStatus: 'rejected',
        rejectionReason,
        approvedBy: req.user._id,
        approvalDate: new Date(),
      },
      { new: true }
    ).populate('user', 'name email phone');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Create notification for student
    if (student.user) {
      await Notification.create({
        recipient: student.user._id,
        title: 'Registration Rejected',
        message: `Your hostel registration has been rejected. Reason: ${rejectionReason}. Please contact the hostel management.`,
        type: 'rejection',
        metadata: { studentId: student._id },
      });
    }

    res.json({ success: true, data: student, message: 'Registration rejected' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get registration statistics
// @route   GET /api/student-approvals/stats
exports.getRegistrationStats = async (req, res, next) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      Student.countDocuments({ registrationStatus: 'pending' }),
      Student.countDocuments({ registrationStatus: 'approved' }),
      Student.countDocuments({ registrationStatus: 'rejected' }),
    ]);

    res.json({
      success: true,
      pending,
      approved,
      rejected,
      data: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
      },
    });
  } catch (error) {
    next(error);
  }
};
