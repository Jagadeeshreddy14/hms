const express = require('express');
const router = express.Router();
const { getVisitors, createVisitor, checkoutVisitor, updateVisitor, deleteVisitor } = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getVisitors);
router.post('/', createVisitor);
router.put('/:id/checkout', authorize('admin', 'warden'), checkoutVisitor);
router.put('/:id', authorize('admin', 'warden'), updateVisitor);
router.delete('/:id', authorize('admin'), deleteVisitor);

module.exports = router;
