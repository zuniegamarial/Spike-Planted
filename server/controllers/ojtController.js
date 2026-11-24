const OjtRecord = require('../models/OjtRecord');

// Get today's date in Philippine time (YYYY-MM-DD)
const getPhilippineDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const values = {};

  parts.forEach(({ type, value }) => {
    values[type] = value;
  });

  return `${values.year}-${values.month}-${values.day}`;
};

// STUDENT: GET MY ATTENDANCE HISTORY
exports.getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.student;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    const records = await OjtRecord.find({
      student: studentId
    }).sort({ date: -1 });

    const validHourRecords = records.filter(
      (record) => record.timeOut != null && record.status !== 'Rejected'
    );

    const totalHours = validHourRecords.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0
    );

    return res.status(200).json({
      success: true,
      count: records.length,
      summary: {
        totalDays: records.length,
        completedDays: validHourRecords.length,
        totalHours: Number(totalHours.toFixed(2))
      },
      attendance: records
    });
  } catch (error) {
    console.error('Get attendance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance records.'
    });
  }
};

// STUDENT TIME-IN
exports.timeIn = async (req, res) => {
  try {
    const studentId = req.user.student;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    const attendanceDate = getPhilippineDate();

    // Prevent another time-in while an earlier record is unfinished
    const unfinishedRecord = await OjtRecord.findOne({
      student: studentId,
      timeOut: null
    }).sort({ timeIn: 1 });

    if (unfinishedRecord) {
      if (unfinishedRecord.attendanceDate === attendanceDate) {
        return res.status(409).json({
          success: false,
          message: 'You have already timed in today.'
        });
      }

      return res.status(409).json({
        success: false,
        message: 'You have an unfinished attendance record from a previous day. Please contact your OJT coordinator.'
      });
    }

    const now = new Date();

    const record = await OjtRecord.create({
      student: studentId,
      date: now,
      attendanceDate,
      timeIn: now,
      timeOut: null,
      totalHours: 0,
      status: 'Pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Time-in recorded successfully!',
      attendance: record
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have an attendance record for today.'
      });
    }

    console.error('Time-in error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to record time-in.'
    });
  }
};

// STUDENT TIME-OUT
exports.timeOut = async (req, res) => {
  try {
    const studentId = req.user.student;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    // Find the student's unfinished record, regardless of its date.
    // This allows time-out even when midnight has already passed.
    const record = await OjtRecord.findOne({
      student: studentId,
      timeOut: null
    }).sort({ timeIn: 1 });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'No active time-in record found.'
      });
    }

    const now = new Date();

    if (now <= record.timeIn) {
      return res.status(400).json({
        success: false,
        message: 'Time-out must be later than time-in.'
      });
    }

    const elapsedMilliseconds = now - record.timeIn;
    const totalHours = elapsedMilliseconds / (1000 * 60 * 60);

    // Atomically update only if the record is still unfinished
    const updatedRecord = await OjtRecord.findOneAndUpdate(
      {
        _id: record._id,
        student: studentId,
        timeOut: null
      },
      {
        $set: {
          timeOut: now,
          totalHours: Number(totalHours.toFixed(2))
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedRecord) {
      return res.status(409).json({
        success: false,
        message: 'This attendance record has already been timed out.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Time-out recorded successfully!',
      attendance: updatedRecord
    });
  } catch (error) {
    console.error('Time-out error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to record time-out.'
    });
  }
};