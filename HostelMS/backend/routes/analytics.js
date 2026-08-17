const express = require('express');
const router = express.Router();
const { getDashboard, getOccupancyReport } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', authorize('admin', 'warden'), getDashboard);
router.get('/occupancy', authorize('admin', 'warden'), getOccupancyReport);

module.exports = router;
