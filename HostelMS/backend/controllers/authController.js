const User = require('../models/User');
const Student = require('../models/Student');

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  // Update lastLogin
  User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).exec();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      studentId: user.studentId,
    },
  });
};

// @desc    Register user (admin/warden)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Students must use the student registration endpoint
    if (!role || role === 'student') {
      return res.status(400).json({
        success: false,
        message: 'Students must use the student registration endpoint'
      });
    }

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please log in or use a different email.'
      });
    }

    const user = await User.create({ name, email: normalizedEmail, password, role, phone });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Register as student with documents
// @route   POST /api/auth/register-student
// @access  Public
exports.registerStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      course,
      year,
      guardianName,
      guardianPhone,
      address,
      permanentAddress,
      city,
      state,
      pincode,
    } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Debug: Log incoming data
    console.log('📝 Student Registration Request:');
    console.log('   Body fields:', { name, email, phone, course, year, guardianName });
    console.log('   Files received:', req.files ? Object.keys(req.files) : 'NO FILES');
    if (req.files) {
      console.log('   Aadhar:', req.files.aadhar ? `✓ ${req.files.aadhar[0].filename}` : '✗');
      console.log('   College ID:', req.files.collegeId ? `✓ ${req.files.collegeId[0].filename}` : '✗');
    }

    // Validate required fields
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please log in or use a different email.'
      });
    }

    // Check if aadhar and college ID files are provided
    if (!req.files?.aadhar || !req.files?.collegeId) {
      console.log('❌ File validation failed');
      return res.status(400).json({
        success: false,
        message: 'Both Aadhar card and College ID are required'
      });
    }

    // Validate file types
    const aadharFile = req.files.aadhar[0];
    const collegeIdFile = req.files.collegeId[0];
    const photoFile = req.files.photo ? req.files.photo[0] : null;

    console.log('📄 File validation:');
    console.log('   Aadhar mime:', aadharFile.mimetype);
    console.log('   College ID mime:', collegeIdFile.mimetype);

    if (aadharFile.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Aadhar card must be in PDF format'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: 'student',
      phone
    });

    // Create student record with pending approval
    const studentData = {
      user: user._id,
      name,
      email,
      phone,
      course,
      year: parseInt(year) || 1,
      guardianName,
      guardianPhone,
      address,
      permanentAddress,
      city,
      state,
      pincode,
      aadharUrl: `/uploads/documents/${aadharFile.filename}`,
      collegeIdUrl: `/uploads/documents/${collegeIdFile.filename}`,
      registrationStatus: 'pending',
    };
    if (photoFile) {
      studentData.photoUrl = `/uploads/documents/${photoFile.filename}`;
    }
    const student = await Student.create(studentData);

    // Update user with student reference
    await User.findByIdAndUpdate(user._id, { studentId: student._id });

    console.log('✅ Student registered successfully:', student._id);

    res.status(201).json({
      success: true,
      message: 'Registration submitted for approval. Please wait for admin approval to login.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationStatus: student.registrationStatus,
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password').populate('studentId');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }

    // Check if student registration is pending
    if (user.role === 'student' && user.studentId) {
      if (user.studentId.registrationStatus === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your registration is pending approval. Please wait for admin approval.'
        });
      }
      if (user.studentId.registrationStatus === 'rejected') {
        return res.status(403).json({
          success: false,
          message: `Your registration was rejected. Reason: ${user.studentId.rejectionReason}`
        });
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('studentId');
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      studentId: user.studentId,
    },
  });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
