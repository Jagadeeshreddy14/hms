const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadSlip, getSlips, getAllSlips, verifySlip, deleteSlip } = require('../controllers/paymentSlipController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/slips/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.body.paymentId}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Only PDF, JPG, PNG accepted'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

router.use(protect);

// Student routes
router.post('/', upload.single('file'), uploadSlip);
router.get('/', getSlips);

// Admin/Warden routes
router.get('/admin/all', authorize('admin', 'warden'), getAllSlips);
router.put('/:id/verify', authorize('admin', 'warden'), verifySlip);
router.delete('/:id', authorize('admin', 'warden'), deleteSlip);

module.exports = router;
