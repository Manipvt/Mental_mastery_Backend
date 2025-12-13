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
    name: student.name,
    email: student.email,
    branch: student.branch,
    year: student.year,
    section: student.section,
    role: 'student',
    type: 'student',
    iat: Math.floor(Date.now() / 1000),
  });
};

const generateAdminToken = (admin) => {
  return generateToken({
    id: admin.id,
    rollNumber: admin.roll_number,
    name: admin.name,
    email: admin.email,
    username: admin.username,
    role: 'admin',
    type: 'admin',
    iat: Math.floor(Date.now() / 1000),
  });
};

module.exports = {
  generateToken,
  verifyToken,
  generateStudentToken,
  generateAdminToken,
};