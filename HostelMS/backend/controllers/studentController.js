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
    if (req.query.registrationStatus) filter.registrationStatus = req.query.registrationStatus;
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
        .populate('user', 'name email phone role')
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
        .populate({
          path: 'room',
          select: 'roomNumber hostelBlock floor type monthlyRent amenities capacity occupiedCount students description',
          populate: {
            path: 'students',
            select: 'name email phone rollNumber course year branch department bloodGroup emergencyContact guardianName guardianPhone address photoUrl status',
          },
        })
        .populate('hostel', 'name address type amenities');
    } else {
      student = await Student.findById(req.params.id)
        .populate({
          path: 'room',
          select: 'roomNumber hostelBlock floor type monthlyRent amenities capacity occupiedCount students description',
          populate: {
            path: 'students',
            select: 'name email phone rollNumber course year branch department bloodGroup emergencyContact guardianName guardianPhone address photoUrl status',
          },
        })
        .populate('hostel', 'name address type amenities');
    }

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Create student (Admin side creation)
// @route   POST /api/students
exports.createStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      rollNumber,
      course,
      year,
      branch,
      department,
      guardianName,
      guardianPhone,
      guardianRelation,
      emergencyContact,
      bloodGroup,
      address,
      permanentAddress,
      city,
      state,
      pincode,
      room: roomId,
      hostel: hostelId,
      role = 'student',
    } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!name || !normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // Check if user exists or create new
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        name,
        email: normalizedEmail,
        password: password || 'Resident@123',
        phone: phone || undefined,
        role: role || 'student',
      });
    } else if (role && role !== user.role) {
      user.role = role;
      await user.save();
    }

    const studentData = {
      user: user._id,
      name,
      email: normalizedEmail,
      phone,
      rollNumber: rollNumber?.trim() || undefined,
      course: course?.trim() || undefined,
      year: parseInt(year) || 1,
      branch: branch?.trim() || undefined,
      department: department?.trim() || undefined,
      guardianName: guardianName?.trim() || undefined,
      guardianPhone: guardianPhone?.trim() || undefined,
      guardianRelation: guardianRelation?.trim() || 'Parent',
      emergencyContact: emergencyContact?.trim() || undefined,
      bloodGroup: bloodGroup?.trim() || undefined,
      address: address?.trim() || undefined,
      permanentAddress: permanentAddress?.trim() || address?.trim() || undefined,
      city: city?.trim() || undefined,
      state: state?.trim() || undefined,
      pincode: pincode?.trim() || undefined,
      registrationStatus: 'approved',
      approvedBy: req.user?._id,
      approvalDate: new Date(),
      status: 'active',
    };

    // If room is specified, allocate room
    if (roomId) {
      const roomDoc = await Room.findById(roomId);
      if (roomDoc) {
        studentData.room = roomDoc._id;
        studentData.hostel = hostelId || roomDoc.hostel;
      }
    }

    const student = await Student.create(studentData);

    // If room allocated, update Room document
    if (studentData.room) {
      await Room.findByIdAndUpdate(studentData.room, {
        $inc: { occupiedCount: 1 },
        $addToSet: { students: student._id },
      });
    }

    // Link user to student
    user.studentId = student._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Resident added successfully',
      data: student,
    });
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

    // If role update is requested, update the associated User
    if (req.body.role && student.user) {
      await User.findByIdAndUpdate(student.user, { role: req.body.role });
    }

    res.json({ success: true, data: student, message: 'Resident updated successfully' });
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
