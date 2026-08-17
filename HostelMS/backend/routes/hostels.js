const express = require('express');
const router = express.Router();
const { getHostels, getHostel, createHostel, updateHostel, deleteHostel } = require('../controllers/hostelController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getHostels);
router.get('/:id', getHostel);
router.post('/', authorize('admin'), createHostel);
router.put('/:id', authorize('admin', 'warden'), updateHostel);
router.delete('/:id', authorize('admin'), deleteHostel);

module.exports = router;
