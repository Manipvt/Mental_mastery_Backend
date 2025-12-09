const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

// Load env vars FIRST
dotenv.config({ path: './config/config.env' });

const { pool } = require('./config/db');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/error');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/v1/assignments', require('./routes/assignmentRoutes'));
app.use('/api/v1/problems', require('./routes/problemRoutes'));
app.use('/api/v1/submissions', require('./routes/submissionRoutes'));
app.use('/api/v1/proctor', require('./routes/proctorRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Test database connection
const testDbConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    logger.error('Full error:', error);
    console.error('Database connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

const server = app.listen(PORT, async () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  await testDbConnection();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});