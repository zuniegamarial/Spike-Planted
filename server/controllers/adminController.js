const mongoose = require('mongoose');

const User = require('../models/User');
const Student = require('../models/Student');
const OjtRecord = require('../models/OjtRecord');
const WeeklyJournal = require('../models/WeeklyJournal');
const Document = require('../models/Document');
const Company = require('../models/Company'); // <-- Added Company model

// ============================================
// ADMIN: GET DASHBOARD SUMMARY
// ============================================
exports.getDashboardSummary = async (req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalUsers,
      pendingUsers,
      pendingCompanies,
      pendingJournals,
      pendingAttendance,
      pendingDocuments,
      approvedHours
    ] = await Promise.all([
      Student.countDocuments(),

      Student.countDocuments({ status: 'Active' }),

      Student.countDocuments({ status: 'Inactive' }),

      User.countDocuments(),

      // FETCH PENDING USERS (Coordinator / Admin)
      User.find({
        isActive: false,
        role: { $in: ['coordinator', 'admin'] }
      })
        .select('fullName email role department createdAt')
        .sort({ createdAt: -1 }),

      // FETCH PENDING COMPANIES (Staff)
      Company.find({ status: 'Pending' }),

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
            _id: null,
            totalHours: { $sum: '$totalHours' }
          }
        }
      ])
    ]);

    const totalOjtHours = approvedHours[0]?.totalHours || 0;

    // Combine pending users and pending companies into one list for the frontend
    const formattedPendingUsers = pendingUsers.map(u => ({ ...u._doc, type: 'User' }));
    const formattedPendingCompanies = pendingCompanies.map(c => ({
      _id: c._id,
      fullName: c.contactPerson,
      email: c.email,
      role: 'staff',
      company: c.name,
      type: 'Company'
    }));

    const allPendingAccounts = [...formattedPendingUsers, ...formattedPendingCompanies];

    return res.status(200).json({
      success: true,

      summary: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        totalUsers,
        totalOjtHours: Number(totalOjtHours.toFixed(2)),
        pendingAccounts: allPendingAccounts.length,
        pendingJournals,
        pendingAttendance,
        pendingDocuments,
        pendingApprovals:
          pendingJournals + pendingAttendance + pendingDocuments
      },

      pendingAccounts: allPendingAccounts
    });

  } catch (error) {
    console.error('Admin dashboard error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard.'
    });
  }
};

// ============================================
// ADMIN: APPROVE USER OR COMPANY ACCOUNT
// ============================================
exports.approveUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID.'
      });
    }

    // 1. Check if the ID belongs to a Company first
    const company = await Company.findById(userId);
    
    if (company) {
      // Approve the company
      company.status = 'Approved';
      await company.save();

      // Also activate the Supervisor's user account
      await User.findOneAndUpdate({ email: company.email }, { isActive: true });

      return res.status(200).json({
        success: true,
        message: 'Company and Supervisor approved successfully.'
      });
    }

    // 2. If not a company, it must be a User (Coordinator/Admin)
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        isActive: false,
        role: { $in: ['coordinator', 'admin'] }
      },
      {
        $set: { isActive: true }
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pending account not found or already approved.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User account approved successfully.',
      user
    });

  } catch (error) {
    console.error('Approve error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to approve account.'
    });
  }
};

// ============================================
// ADMIN: GET SYSTEM REPORTS
// ============================================
exports.getSystemReports = async (req, res) => {
  try {
    const [
      students,
      approvedHours
    ] = await Promise.all([
      Student.find()
        .select(
          'firstName lastName studentNumber email program status'
        )
        .sort({ lastName: 1 }),

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
            totalHours: {
              $sum: '$totalHours'
            }
          }
        }
      ])
    ]);

    // Map approved hours to each student.
    const hoursMap = new Map(
      approvedHours.map(record => [
        String(record._id),
        Number(record.totalHours || 0)
      ])
    );

    const requiredHours = 486;

    const studentReports = students.map(student => {
      const totalHours = Number(
        (hoursMap.get(String(student._id)) || 0).toFixed(2)
      );

      const progress = Math.min(
        (totalHours / requiredHours) * 100,
        100
      );

      return {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentNumber: student.studentNumber,
        email: student.email,
        program: student.program,
        status: student.status,
        totalHours,
        progress: Number(progress.toFixed(2)),
        completed: totalHours >= requiredHours
      };
    });

    // Calculate system statistics.
    const totalStudents = studentReports.length;

    const activeStudents = studentReports.filter(
      student => student.status === 'Active'
    ).length;

    const inactiveStudents = studentReports.filter(
      student => student.status === 'Inactive'
    ).length;

    const completedStudents = studentReports.filter(
      student => student.completed
    ).length;

    const totalOjtHours = Number(
      studentReports.reduce(
        (total, student) => total + student.totalHours,
        0
      ).toFixed(2)
    );

    return res.status(200).json({
      success: true,

      summary: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        completedStudents,
        totalOjtHours,
        requiredHours
      },

      students: studentReports
    });

  } catch (error) {
    console.error('System reports error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to generate system reports.'
    });
  }
};