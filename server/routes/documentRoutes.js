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

// Staff / Coordinator / Admin: Manage required documents
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

// Staff / Coordinator / Admin: Get documents
router.get(
  '/',
  protect,
  authorize('staff', 'coordinator', 'admin'),
  getAllDocuments
);

// Staff / Coordinator / Admin: Approve/Reject a document
router.patch(
  '/:id/review',
  protect,
  authorize('staff', 'coordinator', 'admin'),
  reviewDocument
);

module.exports = router;