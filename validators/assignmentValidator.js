const { body, param } = require('express-validator');

exports.createAssignmentValidator = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('durationMinutes')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number'),
  body('allowMultipleSubmissions')
    .optional()
    .isBoolean()
    .withMessage('allowMultipleSubmissions must be a boolean'),
  body('maxViolations')
    .optional()
    .isInt({ min: 1 })
    .withMessage('maxViolations must be a positive number'),
];

exports.updateAssignmentValidator = [
  param('id')
    .isInt()
    .withMessage('Invalid assignment ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number'),
];