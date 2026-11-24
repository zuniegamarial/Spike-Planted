
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const ojtRoutes = require('./routes/ojtRoutes');
const weeklyJournalRoutes = require('./routes/weeklyJournalRoutes');
const documentRoutes = require('./routes/documentRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const companyRoutes = require('./routes/companyRoutes');
const profileRoutes = require('./routes/profileRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS CONFIGURATION
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://spike-planted-frontend.onrender.com' //Render CORS URL
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// GENERAL MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROOT & HEALTH CHECK
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SPIKE PLANTED OJT Tracker API is running!'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    database: mongoose.connection.readyState === 1
      ? 'Connected'
      : 'Disconnected'
  });
});

// API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/ojt', ojtRoutes);
app.use('/api/weekly-journals', weeklyJournalRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assignments', assignmentRoutes);

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5 MB.'
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

// START SERVER
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the .env file.');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing from the .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB Atlas connected successfully!');

    app.listen(PORT, () => {
      console.log(`SPIKE PLANTED API running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
