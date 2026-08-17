const express = require('express');
const router = express.Router();
const { getPayments, getPayment, createPayment, markAsPaid, updatePayment, getAnalytics } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/analytics', authorize('admin', 'warden'), getAnalytics);
router.get('/', getPayments);
router.get('/:id', getPayment);
router.post('/', authorize('admin', 'warden'), createPayment);
router.put('/:id/pay', authorize('admin', 'warden'), markAsPaid);
router.put('/:id', authorize('admin', 'warden'), updatePayment);

module.exports = router;
