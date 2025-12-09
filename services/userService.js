const bcrypt = require('bcryptjs');
const Student = require('../models/student');
const Admin = require('../models/admin');
const ErrorResponse = require('../utils/errorResponse');

class UserService {
  // Student methods
  async getAllStudents(filters = {}) {
    return await Student.findAll(filters);
  }

  async getStudentById(id) {
    const student = await Student.findById(id);
    if (!student) {
      throw new ErrorResponse('Student not found', 404);
    }
    return student;
  }

  async getStudentByRollNumber(rollNumber) {
    const student = await Student.findByRollNumber(rollNumber);
    if (!student) {
      throw new ErrorResponse('Student not found', 404);
    }
    return student;
  }

  async createStudent(studentData) {
    // Check if student already exists
    const existingStudent = await Student.findByRollNumber(studentData.rollNumber);
    if (existingStudent) {
      throw new ErrorResponse('Student with this roll number already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(studentData.password, 10);
    studentData.password = hashedPassword;

    return await Student.create(studentData);
  }

  async updateStudent(id, studentData) {
    const student = await Student.findById(id);
    if (!student) {
      throw new ErrorResponse('Student not found', 404);
    }

    // Hash password if provided
    if (studentData.password) {
      studentData.password = await bcrypt.hash(studentData.password, 10);
    }

    return await Student.update(id, studentData);
  }

  async deleteStudent(id) {
    const student = await Student.findById(id);
    if (!student) {
      throw new ErrorResponse('Student not found', 404);
    }

    return await Student.delete(id);
  }

  async bulkCreateStudents(studentsData) {
    // Hash all passwords
    for (let student of studentsData) {
      student.password = await bcrypt.hash(student.password, 10);
    }

    return await Student.bulkCreate(studentsData);
  }

  async getStudentStats() {
    const totalStudents = await Student.count();
    const activeStudents = await Student.count({ isActive: true });
    
    return {
      total: totalStudents,
      active: activeStudents,
      inactive: totalStudents - activeStudents,
    };
  }

  // Admin methods
  async getAllAdmins() {
    return await Admin.findAll();
  }

  async getAdminById(id) {
    const admin = await Admin.findById(id);
    if (!admin) {
      throw new ErrorResponse('Admin not found', 404);
    }
    return admin;
  }

  async createAdmin(adminData) {
    // Check if admin already exists
    const existingAdmin = await Admin.findByUsername(adminData.username);
    if (existingAdmin) {
      throw new ErrorResponse('Admin with this username already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    adminData.password = hashedPassword;

    return await Admin.create(adminData);
  }

  async updateAdmin(id, adminData) {
    const admin = await Admin.findById(id);
    if (!admin) {
      throw new ErrorResponse('Admin not found', 404);
    }

    // Hash password if provided
    if (adminData.password) {
      adminData.password = await bcrypt.hash(adminData.password, 10);
    }

    return await Admin.update(id, adminData);
  }

  async deleteAdmin(id) {
    const admin = await Admin.findById(id);
    if (!admin) {
      throw new ErrorResponse('Admin not found', 404);
    }

    return await Admin.delete(id);
  }

  async toggleStudentStatus(id, isActive) {
    const student = await Student.findById(id);
    if (!student) {
      throw new ErrorResponse('Student not found', 404);
    }

    return await Student.update(id, { isActive });
  }
}

module.exports = new UserService();