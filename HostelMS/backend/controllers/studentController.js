const Student = require('../models/Student');
const User = require('../models/User');
const Room = require('../models/Room');

// @desc    Get all students
// @route   GET /api/students
exports.getStudents = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.hostel) filter.hostel = req.query.hostel;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.room) filter.room = req.query.room;

    // Text search
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { rollNumber: regex }, { email: regex }];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('room', 'roomNumber hostelBlock')
        .populate('hostel', 'name')
        .skip(skip)
        .limit(limit)
        .sort('-createdAt'),
      Student.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: students.length,
      total,
      pages: Math.ceil(total / limit),
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
exports.getStudent = async (req, res, next) => {
  try {
    let student;

    // If 'me' is passed, get the logged-in student
    if (req.params.id === 'me') {
      student = await Student.findOne({ user: req.user._id })
        .populate('room', 'roomNumber hostelBlock floor type monthlyRent amenities')
        .populate('hostel', 'name address type amenities');
    } else {
      student = await Student.findById(req.params.id)
        .populate('room', 'roomNumber hostelBlock floor type monthlyRent amenities')
        .populate('hostel', 'name address type amenities');
    }

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Create student
// @route   POST /api/students
exports.createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);

    // Link student to user
    if (req.body.user) {
      await User.findByIdAndUpdate(req.body.user, { studentId: student._id });
    }

    res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Remove from room if allocated
    if (student.room) {
      await Room.findByIdAndUpdate(student.room, {
        $inc: { occupiedCount: -1 },
        $pull: { students: student._id },
      });
    }

    await student.deleteOne();
    res.json({ success: true, message: 'Student removed' });
  } catch (error) {
    next(error);
  }
};
