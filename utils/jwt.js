const jwt = require('jsonwebtoken');

const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const generateStudentToken = (student) => {
  return generateToken({
    id: student.id,
    rollNumber: student.roll_number,
    type: 'student',
  });
};

const generateAdminToken = (admin) => {
  return generateToken({
    id: admin.id,
    username: admin.username,
    type: 'admin',
  });
};

module.exports = {
  generateToken,
  verifyToken,
  generateStudentToken,
  generateAdminToken,
};