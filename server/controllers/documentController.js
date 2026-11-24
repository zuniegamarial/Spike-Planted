const mongoose = require('mongoose');
const path = require('path');
const Document = require('../models/Document');
const RequiredDocument = require('../models/RequiredDocument');
const Student = require('../models/Student');

const DEFAULT_REQUIREMENTS = [
  'MOA',
  'Insurance',
  'Endorsement Letter',
  'Medical Certificate',
  'Other'
];

async function findStudentRecord(user) {
  if (!user) return null;

  if (user.student && mongoose.Types.ObjectId.isValid(user.student)) {
    const byRef = await Student.findById(user.student);
    if (byRef) return byRef;
  }

  const byUserField = await Student.findOne({ user: user._id });
  if (byUserField) return byUserField;

  if (user.email) {
    const byEmail = await Student.findOne({ email: user.email });
    if (byEmail) return byEmail;
  }

  return null;
}

// Staff / Coordinator / Admin: View posted required documents + approved student submissions
exports.getRequiredDocuments = async (req, res) => {
  try {
    let requirements = await RequiredDocument.find().sort({ createdAt: 1 });

    if (!requirements || requirements.length === 0) {
      requirements = DEFAULT_REQUIREMENTS.filter((t) => t !== 'Other').map(
        (title, idx) => ({
          _id: `default-${idx}`,
          title,
          description: 'Required OJT document',
          dueDate: null,
          isActive: true
        })
      );
    }

    const approvedDocs = await Document.find({ status: 'Approved' }).sort({
      reviewedAt: -1,
      createdAt: -1
    });

    const studentIds = [
      ...new Set(
        approvedDocs
          .map((d) => (d.student ? String(d.student) : null))
          .filter(Boolean)
      )
    ];

    const students =
      studentIds.length > 0
        ? await Student.find({ _id: { $in: studentIds } })
        : [];

    const studentMap = new Map(students.map((s) => [String(s._id), s]));

    const enriched = requirements.map((reqItem) => {
      const plain = reqItem.toObject ? reqItem.toObject() : reqItem;
      const passedBy = approvedDocs
        .filter(
          (doc) =>
            (doc.documentType || '').toLowerCase() ===
            (plain.title || '').toLowerCase()
        )
        .map((doc) => {
          const st = doc.student ? studentMap.get(String(doc.student)) : null;
          return {
            _id: doc._id,
            fileName: doc.fileName,
            filePath: doc.filePath,
            reviewedAt: doc.reviewedAt || doc.updatedAt,
            studentName:
              st?.fullName ||
              st?.name ||
              st?.studentName ||
              st?.email ||
              'Student'
          };
        });

      return {
        ...plain,
        passedBy
      };
    });

    return res.status(200).json({
      success: true,
      requirements: enriched
    });
  } catch (error) {
    console.error('getRequiredDocuments error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load required documents.'
    });
  }
};

// Staff / Coordinator / Admin: Post a new required document / activity
exports.createRequiredDocument = async (req, res) => {
  try {
    const title = (req.body?.title || '').trim();
    const description = (req.body?.description || '').trim();
    const dueDate = req.body?.dueDate ? new Date(req.body.dueDate) : null;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Required document title is required.'
      });
    }

    if (dueDate && Number.isNaN(dueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due date.'
      });
    }

    const requirement = await RequiredDocument.create({
      title,
      description,
      dueDate,
      company: (req.user?.company || '').trim(),
      isActive: true,
      createdBy: req.user?._id || null
    });

    return res.status(201).json({
      success: true,
      message: 'Required document posted for students!',
      requirement
    });
  } catch (error) {
    console.error('createRequiredDocument error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to post required document.'
    });
  }
};

// Staff / Coordinator / Admin: Toggle active status of a required document
exports.toggleRequiredDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirement ID.'
      });
    }

    const requirement = await RequiredDocument.findById(id);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Required document not found.'
      });
    }

    requirement.isActive =
      typeof req.body?.isActive === 'boolean'
        ? req.body.isActive
        : !requirement.isActive;

    await requirement.save();

    return res.status(200).json({
      success: true,
      requirement
    });
  } catch (error) {
    console.error('toggleRequiredDocument error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update required document.'
    });
  }
};

// Student: Get active required documents
exports.getActiveRequirements = async (req, res) => {
  try {
    const activeDocs = await RequiredDocument.find({ isActive: true }).sort({
      createdAt: 1
    });

    const requirements =
      activeDocs && activeDocs.length > 0
        ? activeDocs
        : DEFAULT_REQUIREMENTS.filter((t) => t !== 'Other').map(
            (title, idx) => ({
              _id: `default-${idx}`,
              title,
              description: 'Standard OJT requirement',
              dueDate: null,
              isActive: true
            })
          );

    return res.status(200).json({
      success: true,
      requirements
    });
  } catch (error) {
    console.error('getActiveRequirements error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load required documents.'
    });
  }
};

// Student: Upload a document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please attach a file to upload.'
      });
    }

    const cleanType = (req.body?.documentType || '').trim();
    const activeDocs = await RequiredDocument.find({ isActive: true });
    const allowedTitles =
      activeDocs && activeDocs.length > 0
        ? activeDocs.map((item) => item.title)
        : DEFAULT_REQUIREMENTS;

    const matchedTitle = allowedTitles.find(
      (title) => title.toLowerCase() === cleanType.toLowerCase()
    );

    if (!cleanType || !matchedTitle) {
      return res.status(400).json({
        success: false,
        message: `Invalid document type. Allowed: ${allowedTitles.join(', ')}`
      });
    }

    const studentProfile = await findStudentRecord(req.user);

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.'
      });
    }

    const relativeFilePath = `/uploads/${path.basename(req.file.path)}`;

    const doc = await Document.create({
      student: studentProfile._id,
      documentType: matchedTitle,
      fileName: req.file.originalname,
      filePath: relativeFilePath,
      status: 'Pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully!',
      document: doc
    });
  } catch (error) {
    console.error('uploadDocument error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload document.'
    });
  }
};

// Student: Get my uploaded documents
exports.getMyDocuments = async (req, res) => {
  try {
    const studentProfile = await findStudentRecord(req.user);

    if (!studentProfile) {
      return res.status(200).json({ success: true, documents: [] });
    }

    const documents = await Document.find({ student: studentProfile._id }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('getMyDocuments error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve documents.'
    });
  }
};

// Coordinator / Admin: Get all uploaded documents
exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    const studentIds = [
      ...new Set(
        documents
          .map((d) => (d.student ? String(d.student) : null))
          .filter(Boolean)
      )
    ];
    const students =
      studentIds.length > 0
        ? await Student.find({ _id: { $in: studentIds } })
        : [];
    const studentMap = new Map(students.map((s) => [String(s._id), s]));

    const formatted = documents.map((doc) => {
      const plain = doc.toObject ? doc.toObject() : doc;
      const st = doc.student ? studentMap.get(String(doc.student)) : null;
      return {
        ...plain,
        student: st || plain.student
      };
    });

    return res.status(200).json({
      success: true,
      documents: formatted
    });
  } catch (error) {
    console.error('getAllDocuments error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load documents.'
    });
  }
};

// Coordinator / Admin: Approve or reject a student document
exports.reviewDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID.'
      });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected.'
      });
    }

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.'
      });
    }

    doc.status = status;
    doc.remarks = typeof remarks === 'string' ? remarks.trim() : doc.remarks;
    doc.reviewedBy = req.user?._id || null;
    doc.reviewedAt = new Date();

    await doc.save();

    return res.status(200).json({
      success: true,
      message: `Document ${status.toLowerCase()}.`,
      document: doc
    });
  } catch (error) {
    console.error('reviewDocument error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to review document.'
    });
  }
};