const { body } = require('express-validator');

exports.loginValidator = [
  body('rollNumber')
    .if(body('username').not().exists())
    .notEmpty()
    .withMessage('Roll number is required'),
  body('username')
    .if(body('rollNumber').not().exists())
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

exports.studentLoginValidator = [
  body('rollNumber')
    .notEmpty()
    .withMessage('Roll number is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

exports.adminLoginValidator = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];