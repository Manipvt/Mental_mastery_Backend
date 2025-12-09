const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { verifyToken } = require('../utils/jwt');
const Student = require('../models/student');
const Admin = require('../models/admin');
const logger = require('../config/logger');

// Protect routes - authenticate user
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.toLowerCase().startsWith('bearer')) {
    token = authHeader.split(' ')[1];
  }

  // Fallback to cookie-based token if header missing
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  logger.debug('auth: token presence', {
    hasHeader: !!authHeader,
    hasCookie: !!(req.cookies && req.cookies.token),
    tokenPreview: token ? `${token.slice(0, 10)}...` : null,
  });

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = verifyToken(token);
    logger.debug('auth: decoded token', {
      type: decoded.type || decoded.role,
      id: decoded.id,
      rollNumber: decoded.rollNumber,
    });
    
    const userType = decoded.type || decoded.role;

    if (userType === 'student') {
      // Prefer ID lookup, fall back to roll number if missing
      if (decoded.id) {
        req.user = await Student.findById(decoded.id);
      }
      logger.debug('auth: student lookup by id', { id: decoded.id, found: !!req.user });

      if (!req.user && decoded.rollNumber) {
        req.user = await Student.findByRollNumber(decoded.rollNumber);
        logger.debug('auth: student lookup by rollNumber', {
          rollNumber: decoded.rollNumber,
          found: !!req.user,
        });
      }
      if (req.user) {
        req.user.type = 'student';
      }
    } else if (userType === 'admin') {
      if (decoded.id) {
        req.user = await Admin.findById(decoded.id);
      }
      if (req.user) {
        req.user.type = 'admin';
      }
    }

    if (!req.user) {
      logger.warn('auth: user not found after lookup', {
        type: userType,
        idTried: decoded.id,
        rollNumberTried: decoded.rollNumber,
      });
      return next(new ErrorResponse('User not found', 404));
    }

    if (!req.user.is_active) {
      return next(new ErrorResponse('Account is deactivated', 403));
    }

    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Restrict to specific user types
exports.authorize = (...types) => {
  return (req, res, next) => {
    if (!types.includes(req.user.type)) {
      return next(
        new ErrorResponse(
          `User type ${req.user.type} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};