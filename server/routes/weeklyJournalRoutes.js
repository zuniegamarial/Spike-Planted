const express = require('express');
const router = express.Router();

const {
  getMyJournals,
  createJournal,
  updateJournal,
  submitJournal
} = require('../controllers/weeklyJournalController');

const {
  getAllJournals,
  reviewJournal
} = require('../controllers/coordinatorController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// STUDENT ROUTES
// ─────────────────────────────────────────────

// Student: View own weekly journals
router.get(
  '/my-journals',
  protect,
  authorize('student'),
  getMyJournals
);

// Student: Create a weekly journal
router.post(
  '/',
  protect,
  authorize('student'),
  createJournal
);

// Student: Update a draft journal
router.put(
  '/:id',
  protect,
  authorize('student'),
  updateJournal
);

// Student: Submit a journal for review
router.patch(
  '/:id/submit',
  protect,
  authorize('student'),
  submitJournal
);

// ─────────────────────────────────────────────
// COORDINATOR / ADMIN ROUTES
// ─────────────────────────────────────────────

// Get all submitted journals
router.get(
  '/all',
  protect,
  authorize('coordinator', 'admin'),
  getAllJournals
);

// Review a submitted journal
router.patch(
  '/:id/review',
  protect,
  authorize('admin'),
  reviewJournal
);

module.exports = router;