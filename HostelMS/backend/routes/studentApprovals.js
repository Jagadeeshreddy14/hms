const express = require('express');
const router = express.Router();
const { getPendingRegistrations, getRegistrationDetails, approveRegistration, rejectRegistration, getRegistrationStats } = require('../controllers/studentApprovalController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'warden'));

// Get stats
router.get('/stats', getRegistrationStats);

// Get all pending registrations
router.get('/', getPendingRegistrations);

// Get specific registration details
router.get('/:id', getRegistrationDetails);

// Approve registration
router.put('/:id/approve', approveRegistration);

// Reject registration
router.put('/:id/reject', rejectRegistration);

module.exports = router;
