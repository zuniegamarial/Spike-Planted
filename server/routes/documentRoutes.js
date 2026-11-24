const express = require('express');
const router = express.Router();

const {
  uploadDocument,
  getMyDocuments,
  getAllDocuments,
  reviewDocument,
  getRequiredDocuments,
  createRequiredDocument,
  toggleRequiredDocument,
  getActiveRequirements
} = require('../controllers/documentController');

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Company / Staff / Coordinator / Admin: Manage required documents
router.get(
  '/requirements/manage',
  protect,
  authorize('staff', 'coordinator', 'admin'),
  getRequiredDocuments
);

router.post(
  '/requirements',
  protect,
  authorize('staff', 'coordinator', 'admin'),
  createRequiredDocument
);

router.patch(
  '/requirements/:id/toggle',
  protect,
  authorize('staff', 'coordinator', 'admin'),
  toggleRequiredDocument
);

// Student: Get active required documents to pass
router.get(
  '/requirements',
  protect,
  authorize('student'),
  getActiveRequirements
);

// Student: Upload a document
router.post(
  '/',
  protect,
  authorize('student'),
  upload.single('file'),
  uploadDocument
);

// Student: Get my documents
router.get(
  '/my-documents',
  protect,
  authorize('student'),
  getMyDocuments
);

// Coordinator/Admin: Get all documents
router.get(
  '/',
  protect,
  authorize('coordinator', 'admin'),
  getAllDocuments
);

// Coordinator/Admin: Approve/Reject a document
router.patch(
  '/:id/review',
  protect,
  authorize('coordinator', 'admin'),
  reviewDocument
);

module.exports = router;