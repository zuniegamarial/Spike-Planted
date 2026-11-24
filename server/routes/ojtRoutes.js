const express = require('express');
const router = express.Router();

const {
  getMyAttendance,
  timeIn,
  timeOut
} = require('../controllers/ojtController');

const {
  reviewAttendance
} = require('../controllers/coordinatorController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// Student attendance history
router.get(
  '/my-attendance',
  protect,
  authorize('student'),
  getMyAttendance
);

// Student time-in
router.post(
  '/time-in',
  protect,
  authorize('student'),
  timeIn
);

// Student time-out
router.post(
  '/time-out',
  protect,
  authorize('student'),
  timeOut
);

// Admin: Approve or reject an attendance record
router.patch(
  '/:id/review',
  protect,
  authorize('admin'),
  reviewAttendance
);

module.exports = router;