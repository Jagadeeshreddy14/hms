const express = require('express');
const router = express.Router();
const { getComplaints, getComplaint, createComplaint, updateStatus, updateComplaint, deleteComplaint, getStats } = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/stats', authorize('admin', 'warden'), getStats);
router.get('/', getComplaints);
router.get('/:id', getComplaint);
router.post('/', authorize('student'), createComplaint);
router.put('/:id/status', authorize('admin', 'warden'), updateStatus);
router.put('/:id', updateComplaint);
router.delete('/:id', deleteComplaint);

module.exports = router;
