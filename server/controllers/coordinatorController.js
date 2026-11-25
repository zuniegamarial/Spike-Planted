const mongoose = require('mongoose');

const Student = require('../models/Student');
const OjtRecord = require('../models/OjtRecord');
const WeeklyJournal = require('../models/WeeklyJournal');
const Document = require('../models/Document');
const Company = require('../models/Company'); // <-- Added Company import

// ─────────────────────────────────────────────
// COORDINATOR: GET ALL STUDENTS (With Assigned Company)
// ─────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ lastName: 1 });

    // Fetch the assigned company name for each student
    const studentsWithCompany = await Promise.all(students.map(async (student) => {
      let companyName = null;
      if (student.companyId) {
        const company = await Company.findById(student.companyId).select('name');
        if (company) companyName = company.name;
      }
      
      return {
        ...student.toObject(),
        company: companyName // <-- Add company name to the response
      };
    }));

    return res.status(200).json({
      success: true,
      count: studentsWithCompany.length,
      students: studentsWithCompany
    });
  } catch (error) {
    console.error('Get all students error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students.'
    });
  }
};


// ─────────────────────────────────────────────
// COORDINATOR: GET STUDENT RECORD
// ─────────────────────────────────────────────
exports.getStudentRecord = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID.'
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const [attendance, journals, documents] = await Promise.all([
      OjtRecord.find({ student: studentId }).sort({ date: -1 }),
      WeeklyJournal.find({ student: studentId }).sort({ weekNumber: 1 }),
      Document.find({ student: studentId }).sort({ createdAt: -1 })
    ]);

    const totalHours = attendance
      .filter(record => record.timeOut && record.status === 'Approved')
      .reduce((total, record) => total + (record.totalHours || 0), 0);

    return res.status(200).json({
      success: true,
      student,
      summary: {
        totalHours: Number(totalHours.toFixed(2)),
        attendanceDays: attendance.length,
        totalJournals: journals.length,
        totalDocuments: documents.length
      },
      attendance,
      journals,
      documents
    });

  } catch (error) {
    console.error('Get student record error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student record.'
    });
  }
};


// ─────────────────────────────────────────────
// COORDINATOR: REVIEW WEEKLY JOURNAL
// ─────────────────────────────────────────────
exports.reviewJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal ID.'
      });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected.'
      });
    }

    if (
      status === 'Rejected' &&
      (typeof feedback !== 'string' || !feedback.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required when rejecting a journal.'
      });
    }

    if (
      feedback !== undefined &&
      (
        typeof feedback !== 'string' ||
        feedback.trim().length > 2000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Feedback must be valid text and not exceed 2000 characters.'
      });
    }

    const updateFields = {
      status: status === 'Rejected' ? 'Draft' : 'Approved',
      feedback: (feedback || '').trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    };

    if (status === 'Rejected') {
      updateFields.supervisorStatus = 'Pending';
      updateFields.supervisorReviewedBy = null;
      updateFields.supervisorReviewedAt = null;
      updateFields.supervisorRemarks = '';
    }

    const journal = await WeeklyJournal.findOneAndUpdate(
      {
        _id: id,
        status: 'Submitted',
        supervisorStatus: 'Approved'
      },
      {
        $set: updateFields
      },
      {
        new: true,
        runValidators: true
      }
    ).populate(
      'student',
      'studentNumber firstName lastName program'
    );

    if (!journal) {
      return res.status(409).json({
        success: false,
        message: 'Journal cannot be reviewed yet. It must first be approved by the company supervisor.'
      });
    }

    return res.status(200).json({
      success: true,
      message: status === 'Approved'
        ? 'Journal approved successfully!'
        : 'Journal rejected. The student can edit and resubmit it.',
      journal
    });

  } catch (error) {
    console.error('Review journal error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to review journal.'
    });
  }
};


// ─────────────────────────────────────────────
// COORDINATOR: REVIEW ATTENDANCE
// ─────────────────────────────────────────────
exports.reviewAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID.'
      });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected.'
      });
    }

    if (
      status === 'Rejected' &&
      (typeof remarks !== 'string' || !remarks.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Remarks are required when rejecting attendance.'
      });
    }

    if (
      remarks !== undefined &&
      (
        typeof remarks !== 'string' ||
        remarks.trim().length > 2000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Remarks must be valid text and not exceed 2000 characters.'
      });
    }

    const attendance = await OjtRecord.findOneAndUpdate(
      {
        _id: id,
        status: 'Pending',
        supervisorStatus: 'Approved',
        timeOut: { $ne: null }
      },
      {
        $set: {
          status,
          remarks: (remarks || '').trim(),
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate(
      'student',
      'studentNumber firstName lastName program'
    );

    if (!attendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance cannot be reviewed yet. It must first be approved by the company supervisor.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Attendance ${status.toLowerCase()} successfully!`,
      attendance
    });

  } catch (error) {
    console.error('Review attendance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to review attendance.'
    });
  }
};


// ─────────────────────────────────────────────
// COORDINATOR: GET DASHBOARD SUMMARY
// ─────────────────────────────────────────────
exports.getDashboardSummary = async (req, res) => {
  try {
    const [
      totalStudents,
      pendingJournals,
      pendingAttendance,
      pendingDocuments,
      approvedHours
    ] = await Promise.all([
      Student.countDocuments(),

      WeeklyJournal.countDocuments({
        status: 'Submitted',
        supervisorStatus: 'Approved'
      }),

      OjtRecord.countDocuments({
        status: 'Pending',
        supervisorStatus: 'Approved',
        timeOut: { $ne: null }
      }),

      Document.countDocuments({
        status: 'Pending'
      }),

      OjtRecord.aggregate([
        {
          $match: {
            status: 'Approved',
            timeOut: { $ne: null }
          }
        },
        {
          $group: {
            _id: '$student',
            totalHours: { $sum: '$totalHours' }
          }
        }
      ])
    ]);

    const completedOjt = approvedHours.filter(
      record => record.totalHours >= 486
    ).length;

    return res.status(200).json({
      success: true,
      summary: {
        totalStudents,
        pendingJournals,
        pendingAttendance,
        pendingDocuments,
        pendingApprovals:
          pendingJournals + pendingAttendance + pendingDocuments,
        completedOjt
      }
    });

  } catch (error) {
    console.error('Dashboard summary error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard summary.'
    });
  }
};


// ─────────────────────────────────────────────
// COORDINATOR: GET SUPERVISOR-APPROVED JOURNALS
// ─────────────────────────────────────────────
exports.getAllJournals = async (req, res) => {
  try {
    const journals = await WeeklyJournal.find({
      status: 'Submitted',
      supervisorStatus: 'Approved'
    })
      .populate(
        'student',
        'studentNumber firstName lastName program'
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: journals.length,
      journals
    });

  } catch (error) {
    console.error('Get all journals error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve submitted journals.'
    });
  }
};


// ─────────────────────────────────────────────
// COORDINATOR: GET SUPERVISOR-APPROVED ATTENDANCE
// ─────────────────────────────────────────────
exports.getPendingAttendance = async (req, res) => {
  try {
    const attendance = await OjtRecord.find({
      status: 'Pending',
      supervisorStatus: 'Approved',
      timeOut: { $ne: null }
    })
      .populate(
        'student',
        'studentNumber firstName lastName program'
      )
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance
    });

  } catch (error) {
    console.error('Get pending attendance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending attendance.'
    });
  }
};


// ─────────────────────────────────────────────
// COORDINATOR: UPDATE STUDENT ACCOUNT STATUS
// ─────────────────────────────────────────────
exports.updateStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID.'
      });
    }

    const allowedStatuses = ['Active', 'Inactive'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Active or Inactive.'
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    student.status = status;
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student account ${status.toLowerCase()} successfully.`,
      student
    });

  } catch (error) {
    console.error('Update student status error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to update student account status.'
    });
  }
};