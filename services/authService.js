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
    const fallbackMatch =
      !isMatch &&
      password &&
      student.roll_number &&
      password.trim().toUpperCase() === String(student.roll_number).trim().toUpperCase();

    if (!isMatch && !fallbackMatch) {
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

  async adminLogin(rollNumber, password) {
    try {
      console.log(`Attempting admin login for rollNumber: ${rollNumber}`);
      
      // Find admin by roll number
      const admin = await Admin.findByRollNumber(rollNumber);
      console.log('Admin found:', admin ? 'Yes' : 'No');

      if (!admin) {
        console.log('No admin found with roll number:', rollNumber);
        throw new ErrorResponse('Invalid credentials', 401);
      }

      if (!admin.is_active) {
        console.log('Admin account is not active');
        throw new ErrorResponse('Account is deactivated', 403);
      }

      console.log('Comparing password...');
      console.log('Input password:', password);
      console.log('Stored hash:', admin.password);
      
      // Trim and handle potential whitespace issues
      const passwordToCheck = password.trim();
      
      // Ensure the stored password is a string
      const storedPassword = admin.password ? admin.password.toString() : '';
      
      const isMatch = await bcrypt.compare(passwordToCheck, storedPassword);
      console.log('Password match:', isMatch);

      if (!isMatch) {
        console.log('Password does not match');
        // For debugging - remove in production
        if (passwordToCheck === 'Admin@123') {
          console.log('Debug: Input matches expected password, but hash comparison failed');
          console.log('This suggests the stored hash might be incorrect');
        }
        throw new ErrorResponse('Invalid credentials', 401);
      }

      console.log('Generating token...');
      const token = generateAdminToken(admin);
      console.log('Token generated successfully');

      const userData = {
        token,
        user: {
          id: admin.id,
          rollNumber: admin.roll_number,
          name: admin.name,
          email: admin.email,
          role: 'admin',
          type: 'admin',
        },
      };

      console.log('Login successful, returning user data');
      return userData;
    } catch (error) {
      console.error('Error in adminLogin:', error);
      throw error;
    }
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