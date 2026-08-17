// students.js
const express = require('express');
const router = express.Router();
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', authorize('admin', 'warden'), getStudents);
router.get('/:id', getStudent);
router.post('/', authorize('admin'), createStudent);
router.put('/:id', authorize('admin', 'warden'), updateStudent);
router.delete('/:id', authorize('admin'), deleteStudent);

module.exports = router;
