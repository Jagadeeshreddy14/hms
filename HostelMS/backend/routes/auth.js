const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  register,
  registerStudent,
  login,
  googleAuth,
  getMe,
  updateProfile,
  changePassword,
  sendOtp,
  verifyOtp
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`📤 Uploading file: ${file.fieldname} (${file.mimetype})`);
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${file.fieldname}_${Date.now()}${ext}`;
    console.log(`   → Saved as: ${filename}`);
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  console.log(`🔍 Validating file: ${file.fieldname}, MIME: ${file.mimetype}, Size: ${file.size} bytes`);
  
  // Allow PDF and image files for college ID
  const allowedMimes = [];
  if (file.fieldname === 'aadhar') {
    allowedMimes.push('application/pdf');
  } else if (file.fieldname === 'collegeId') {
    allowedMimes.push('application/pdf', 'image/jpeg', 'image/png');
  } else if (file.fieldname === 'photo') {
    // passport-size photo: images only
    allowedMimes.push('image/jpeg', 'image/jpg', 'image/png');
  }

  if (allowedMimes.includes(file.mimetype)) {
    console.log(`   ✓ Accepted`);
    cb(null, true);
  } else {
    console.log(`   ✗ Rejected - Invalid MIME type`);
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${allowedMimes.join(', ')}`));
  }
};

const rateLimit = require('express-rate-limit');

const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please wait 15 minutes before requesting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    success: false,
    message: 'Too many verification attempts from this IP. Please wait 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

router.post('/send-otp', otpSendLimiter, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
router.post('/register', register);
router.post('/register-student', 
  (req, res, next) => {
    console.log('📥 Student registration request received');
    const uploadMiddleware = upload.fields([
      { name: 'aadhar', maxCount: 1 },
      { name: 'collegeId', maxCount: 1 },
      { name: 'photo', maxCount: 1 }
    ]);
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.log(`❌ Upload error: ${err.message}`);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }
      console.log('✓ Files uploaded successfully');
      next();
    });
  },
  registerStudent
);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
