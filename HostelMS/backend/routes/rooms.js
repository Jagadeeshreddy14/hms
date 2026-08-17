const express = require('express');
const router = express.Router();
const { getRooms, getRoom, createRoom, updateRoom, allocateRoom, vacateRoom, deleteRoom } = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/', authorize('admin', 'warden'), createRoom);
router.put('/:id', authorize('admin', 'warden'), updateRoom);
router.post('/:id/allocate', authorize('admin', 'warden', 'student'), allocateRoom);
router.post('/:id/vacate', authorize('admin', 'warden'), vacateRoom);
router.delete('/:id', authorize('admin'), deleteRoom);

module.exports = router;
