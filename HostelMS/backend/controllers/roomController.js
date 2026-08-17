const Room = require('../models/Room');
const Student = require('../models/Student');

// @desc    Get all rooms
// @route   GET /api/rooms
exports.getRooms = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.hostel) filter.hostel = req.query.hostel;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const rooms = await Room.find(filter)
      .populate('hostel', 'name type')
      .populate('students', 'name rollNumber');

    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
exports.getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('hostel', 'name type address')
      .populate('students', 'name rollNumber course phone');

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// @desc    Create room
// @route   POST /api/rooms
exports.createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
exports.updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// @desc    Allocate room to student
// @route   POST /api/rooms/:id/allocate
exports.allocateRoom = async (req, res, next) => {
  try {
    let studentId = req.body.studentId;
    if (!studentId && req.user.role === 'student') {
      const studentDoc = await Student.findOne({ user: req.user._id });
      studentId = studentDoc?._id;
    }

    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.occupiedCount >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is full' });
    }

    let student = await Student.findById(studentId);
    if (!student && req.user.role === 'student') {
      student = await Student.findOne({ user: req.user._id });
    }

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.room) {
      return res.status(400).json({ success: false, message: 'Student already has a room assigned' });
    }

    // Update room
    room.occupiedCount += 1;
    room.students.push(studentId);
    await room.save();

    // Update student
    student.room = room._id;
    student.hostel = room.hostel;
    await student.save();

    res.json({ success: true, message: 'Room allocated successfully', data: room });
  } catch (error) {
    next(error);
  }
};

// @desc    Vacate room
// @route   POST /api/rooms/:id/vacate
exports.vacateRoom = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    room.occupiedCount = Math.max(0, room.occupiedCount - 1);
    room.students = room.students.filter((s) => s.toString() !== studentId);
    await room.save();

    await Student.findByIdAndUpdate(studentId, {
      room: null,
      vacatingDate: new Date(),
      status: 'vacated',
    });

    res.json({ success: true, message: 'Room vacated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.occupiedCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete occupied room' });
    }
    await room.deleteOne();
    res.json({ success: true, message: 'Room deleted' });
  } catch (error) {
    next(error);
  }
};
