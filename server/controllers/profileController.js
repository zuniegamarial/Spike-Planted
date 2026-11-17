const User = require('../models/User');
const Student = require('../models/Student');
const Document = require('../models/Document');
const Company = require('../models/Company');
const WeeklyJournal = require('../models/WeeklyJournal'); // <-- Added for pending count
const OjtRecord = require('../models/OjtRecord'); // <-- Added for pending count
const path = require('path');
const fs = require('fs');

// GET MY PROFILE
exports.getMyProfile = async (req, res) => {
  try {
    // Get user and populate their student profile
    const user = await User.findById(req.user._id).populate('student');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let companyData = null;
    
    // If the student has a company assigned, fetch it
    if (user.student && user.student.company) {
      companyData = await Company.findOne({ name: user.student.company });
    }

    let documents = [];
    let pendingDocsCount = 0;
    let pendingJournalsCount = 0;
    let pendingAttendanceCount = 0;

    if (user.student) {
      // Get their documents
      documents = await Document.find({ student: user.student._id });
      
      // Calculate pending counts for the dashboard
      pendingDocsCount = documents.filter(d => d.status === 'Pending').length;
      
      pendingJournalsCount = await WeeklyJournal.countDocuments({ 
        student: user.student._id, 
        status: 'Submitted' 
      });

      pendingAttendanceCount = await OjtRecord.countDocuments({
        student: user.student._id,
        status: 'Pending',
        timeOut: { $ne: null }
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        company: user.company,
        department: user.department
      },
      student: user.student,
      company: companyData,
      documents,
      // Send the pending counts to the frontend
      pendingSummary: {
        documents: pendingDocsCount,
        journals: pendingJournalsCount,
        attendance: pendingAttendanceCount,
        total: pendingDocsCount + pendingJournalsCount + pendingAttendanceCount
      }
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load profile.' });
  }
};

// UPDATE MY PROFILE
exports.updateMyProfile = async (req, res) => {
  try {
    const { fullName, email, contactNumber } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Update User
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    await user.save();

    // Update Student Profile if exists
    if (user.student) {
      const student = await Student.findById(user.student);
      if (student) {
        student.firstName = fullName ? fullName.split(' ')[0] : student.firstName;
        student.lastName = fullName ? fullName.split(' ').slice(-1)[0] : student.lastName;
        student.contactNumber = contactNumber || student.contactNumber;
        await student.save();
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully!', 
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      } 
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// UPLOAD PROFILE PICTURE (AVATAR)
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Optional: Delete old avatar file if it exists to save space
    if (user.avatar) {
      // Construct the full path of the old image
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save the new path to the database
    user.avatar = `/uploads/documents/${req.file.filename}`;
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Profile picture updated!', 
      avatar: user.avatar 
    });
  } catch (error) {
    console.error('Upload avatar error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to upload picture.' });
  }
};