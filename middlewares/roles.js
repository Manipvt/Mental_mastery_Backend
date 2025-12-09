const ErrorResponse = require('../utils/errorResponse');

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.type === 'admin') {
    return next();
  }

  return next(
    new ErrorResponse('Access denied. Admin privileges required', 403)
  );
};

// Check if user is student
exports.isStudent = (req, res, next) => {
  if (req.user && req.user.type === 'student') {
    return next();
  }

  return next(
    new ErrorResponse('Access denied. Student access only', 403)
  );
};

// Check if user is either admin or the specific student
exports.isAdminOrOwner = (req, res, next) => {
  if (req.user.type === 'admin') {
    return next();
  }

  // Check if the student is accessing their own resource
  const studentId = req.params.studentId || req.params.id;
  
  if (req.user.type === 'student' && req.user.id === parseInt(studentId)) {
    return next();
  }

  return next(
    new ErrorResponse('Access denied. You can only access your own resources', 403)
  );
};

// Flexible role checker - allows multiple roles
exports.hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }

    if (roles.includes(req.user.type)) {
      return next();
    }

    return next(
      new ErrorResponse(
        `Access denied. Required role: ${roles.join(' or ')}`,
        403
      )
    );
  };
};