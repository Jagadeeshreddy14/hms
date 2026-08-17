const express = require('express');
const router = express.Router();
const { getAll, getByHostel, create, update, delete: deleteOne } = require('../controllers/bankDetailController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Get all bank details (for students to see where to pay)
router.get('/', getAll);

// Get bank details for specific hostel
router.get('/hostel/:hostelId', getByHostel);

// Create bank details (admin only)
router.post('/', authorize('admin'), create);

// Update bank details (admin only)
router.put('/:id', authorize('admin'), update);

// Delete bank details (admin only)
router.delete('/:id', authorize('admin'), deleteOne);

module.exports = router;
