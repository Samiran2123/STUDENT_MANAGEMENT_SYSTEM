require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./routes/index');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// =============================================
// Initialize Express App
// =============================================
const app = express();

// =============================================
// CORS Configuration
// =============================================
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// =============================================
// Body Parsers
// =============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// Static Files — Serve uploaded photos
// =============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================================
// Health Check
// =============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Management System API is running.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// =============================================
// API Routes  →  /api/...
// =============================================
app.use('/api', routes);

// =============================================
// 404 Handler — must be after all routes
// =============================================
app.use(notFoundHandler);

// =============================================
// Centralized Error Handler — must be last
// =============================================
app.use(errorHandler);

// =============================================
// Start Server
// =============================================
const PORT = parseInt(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log('==============================================');
  console.log('  🎓 Student Management System API');
  console.log('==============================================');
  console.log(`  🚀 Server running on port ${PORT}`);
  console.log(`  🌍 Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`  📚 API base URL: http://localhost:${PORT}/api`);
  console.log('==============================================');
});

// =============================================
// Graceful Shutdown
// =============================================
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
