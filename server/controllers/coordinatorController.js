const mongoose = require('mongoose');

const Student = require('../models/Student');
const OjtRecord = require('../models/OjtRecord');
const WeeklyJournal = require('../models/WeeklyJournal');
const Document = require('../models/Document');
const User = require('../models/User');

// ─────────────────────────────────────────────
// COORDINATOR: GET ALL STUDENTS (With Avatars)
// ─────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ lastName: 1 });

    // Fetch the avatar for each student from the User collection
    const studentsWithAvatars = await Promise.all(students.map(async (student) => {
      const user = await User.findOne({ email: student.email }).select('avatar');
      return {
        ...student.toObject(),
        avatar: user ? user.avatar : ""
      };
    }));

    return res.status(200).json({
      success: true,
      count: studentsWithAvatars.length,
      students: studentsWithAvatars
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
    const { status, feedback } = req.body;

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

    if (status === 'Rejected' && (!feedback || !feedback.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required when rejecting a journal.'
      });
    }

    const journal = await WeeklyJournal.findOneAndUpdate(
      {
        _id: id,
        status: 'Submitted'
      },
      {
        $set: {
          status,
          feedback: (feedback || '').trim(),
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('student', 'studentNumber firstName lastName program');

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Submitted journal not found. It may already have been reviewed.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Journal ${status.toLowerCase()} successfully!`,
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
    const { status, remarks } = req.body;

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

    if (status === 'Rejected' && (!remarks || !remarks.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Remarks are required when rejecting attendance.'
      });
    }

    const attendance = await OjtRecord.findOneAndUpdate(
      {
        _id: id,
        status: 'Pending',
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
    ).populate('student', 'studentNumber firstName lastName program');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Pending completed attendance record not found. It may already have been reviewed.'
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
        status: 'Submitted'
      }),

      OjtRecord.countDocuments({
        status: 'Pending',
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
// COORDINATOR: GET ALL SUBMITTED JOURNALS
// ─────────────────────────────────────────────
exports.getAllJournals = async (req, res) => {
  try {
    const journals = await WeeklyJournal.find({
      status: 'Submitted'
    })
      .populate('student', 'studentNumber firstName lastName program')
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
// COORDINATOR: GET ALL PENDING COMPLETED ATTENDANCE
// ─────────────────────────────────────────────
exports.getPendingAttendance = async (req, res) => {
  try {
    const attendance = await OjtRecord.find({
      status: 'Pending',
      timeOut: { $ne: null }
    })
      .populate('student', 'studentNumber firstName lastName program')
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

// COORDINATOR: UPDATE STUDENT ACCOUNT STATUS
exports.updateStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.body;

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

// ─────────────────────────────────────────────
// ADMIN: GET PENDING ACCOUNTS (For Approvals)
// ─────────────────────────────────────────────
exports.getPendingAccounts = async (req, res) => {
  try {
    const pendingUsers = await User.find({ isActive: false }).select('-password');
    
    return res.status(200).json({
      success: true,
      count: pendingUsers.length,
      accounts: pendingUsers
    });
  } catch (error) {
    console.error('Get pending accounts error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve pending accounts.' 
    });
  }
};

// ─────────────────────────────────────────────
// ADMIN: APPROVE ACCOUNT
// ─────────────────────────────────────────────
exports.approveAccount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndUpdate(
      id, 
      { $set: { isActive: true } }, 
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Account approved successfully!',
      user
    });
  } catch (error) {
    console.error('Approve account error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to approve account.' 
    });
  }
};