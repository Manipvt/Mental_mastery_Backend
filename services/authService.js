const bcrypt = require('bcryptjs');
const Student = require('../models/student');
const Admin = require('../models/admin');
const { generateStudentToken, generateAdminToken } = require('../utils/jwt');
const ErrorResponse = require('../utils/errorResponse');

class AuthService {
  async studentLogin(rollNumber, password) {
    const student = await Student.findByRollNumber(rollNumber);

    if (!student) {
      throw new ErrorResponse('Invalid credentials', 401);
    }

    if (!student.is_active) {
      throw new ErrorResponse('Account is deactivated', 403);
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      throw new ErrorResponse('Invalid credentials', 401);
    }

    const token = generateStudentToken(student);

    return {
      token,
      user: {
        id: student.id,
        rollNumber: student.roll_number,
        name: student.name,
        email: student.email,
        branch: student.branch,
        year: student.year,
        section: student.section,
        type: 'student',
      },
    };
  }

  async adminLogin(username, password) {
    const admin = await Admin.findByUsername(username);

    if (!admin) {
      throw new ErrorResponse('Invalid credentials', 401);
    }

    if (!admin.is_active) {
      throw new ErrorResponse('Account is deactivated', 403);
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      throw new ErrorResponse('Invalid credentials', 401);
    }

    const token = generateAdminToken(admin);

    return {
      token,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        type: 'admin',
      },
    };
  }

  async getProfile(userId, userType) {
    let user;
    
    if (userType === 'student') {
      user = await Student.findById(userId);
    } else if (userType === 'admin') {
      user = await Admin.findById(userId);
    }

    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    return user;
  }
}

module.exports = new AuthService();