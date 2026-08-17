const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { protect, authorize } = require('../middleware/auth');
const {
  uploadAndVerifyAadhaar,
  getAadhaarKycStatus,
  deleteAadhaarKycData,
  getAdminKycVerifications,
  adminReviewKyc,
} = require('../controllers/kycController');

// Rate limiting for Aadhaar verification to prevent brute forcing of share codes
const kycLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 verification requests per windowMs
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure Multer for In-Memory storage (zero disk write for sensitive ZIP)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum file size
  },
  fileFilter: (req, file, cb) => {
    const isZip = file.mimetype === 'application/zip' ||
                  file.mimetype === 'application/x-zip-compressed' ||
                  file.originalname.toLowerCase().endsWith('.zip');
    if (isZip) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files downloaded from UIDAI are supported'));
    }
  },
});

// Student KYC Routes
router.post(
  '/aadhaar/verify',
  protect,
  authorize('student'),
  kycLimiter,
  (req, res, next) => {
    upload.single('zipFile')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  uploadAndVerifyAadhaar
);

router.get('/aadhaar/status', protect, authorize('student'), getAadhaarKycStatus);
router.delete('/aadhaar/data', protect, authorize('student'), deleteAadhaarKycData);

// Admin & Warden Routes
router.get('/admin/verifications', protect, authorize('admin', 'warden'), getAdminKycVerifications);
router.put('/admin/review/:studentId', protect, authorize('admin'), adminReviewKyc);

module.exports = router;
