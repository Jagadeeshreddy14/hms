const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// @desc    Get complaints
// @route   GET /api/complaints
exports.getComplaints = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.hostel) filter.hostel = req.query.hostel;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.priority) filter.priority = req.query.priority;

    // Students see only their complaints
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) filter.student = student._id;
    }

    const complaints = await Complaint.find(filter)
      .populate('student', 'name rollNumber room')
      .populate('assignedTo', 'name')
      .populate('resolvedBy', 'name')
      .sort('-createdAt');

    res.json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
exports.getComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'name rollNumber room hostel')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name')
      .populate('timeline.updatedBy', 'name');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Create complaint
// @route   POST /api/complaints
exports.createComplaint = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const complaint = await Complaint.create({
      ...req.body,
      student: student._id,
      hostel: student.hostel,
      room: student.room,
      timeline: [{ status: 'pending', note: 'Complaint submitted', updatedBy: req.user._id }],
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note, assignedTo } = req.body;

    const updateData = {
      status,
      $push: { timeline: { status, note, updatedBy: req.user._id } },
    };

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
      updateData.assignedAt = new Date();
    }

    if (status === 'resolved') {
      updateData.resolvedBy = req.user._id;
      updateData.resolvedAt = new Date();
      updateData.resolutionNote = note;
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate('student', 'name user');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Notify student
    if (complaint.student?.user) {
      const statusMessages = {
        in_progress: 'Your complaint is now being worked on',
        resolved: 'Your complaint has been resolved',
        rejected: 'Your complaint has been reviewed and rejected',
      };
      if (statusMessages[status]) {
        await Notification.create({
          recipient: complaint.student.user,
          title: 'Complaint Update',
          message: `Ticket #${complaint.ticketNumber}: ${statusMessages[status]}`,
          type: 'complaint_update',
        });
      }
    }

    res.json({ success: true, data: complaint, message: 'Status updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint (general)
// @route   PUT /api/complaints/:id
exports.updateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
exports.deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Students can only delete their own pending complaints
    if (req.user.role === 'student' && complaint.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot delete complaint that is in progress' });
    }

    await complaint.deleteOne();
    res.json({ success: true, message: 'Complaint deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
    ]);

    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data: { overview: stats[0] || {}, byCategory } });
  } catch (error) {
    next(error);
  }
};
