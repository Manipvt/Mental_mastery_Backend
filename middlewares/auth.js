const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { verifyToken } = require('../utils/jwt');
const Student = require('../models/student');
const Admin = require('../models/admin');

// Protect routes - authenticate user
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = verifyToken(token);
    
    if (decoded.type === 'student') {
      req.user = await Student.findById(decoded.id);
      req.user.type = 'student';
    } else if (decoded.type === 'admin') {
      req.user = await Admin.findById(decoded.id);
      req.user.type = 'admin';
    }

    if (!req.user) {
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