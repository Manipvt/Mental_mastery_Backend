const { body, param } = require('express-validator');

exports.createProblemValidator = [
  body('assignmentId')
    .optional()
    .isInt()
    .withMessage('Invalid assignment ID'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim(),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('points')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Points must be a positive number'),
  body('timeLimit')
    .optional()
    .isInt({ min: 100 })
    .withMessage('Time limit must be at least 100ms'),
  body('memoryLimit')
    .optional()
    .isInt({ min: 1000 })
    .withMessage('Memory limit must be at least 1000 KB'),
  body('constraints')
    .optional()
    .trim(),
  body('inputFormat')
    .optional()
    .trim(),
  body('outputFormat')
    .optional()
    .trim(),
];

exports.updateProblemValidator = [
  param('id')
    .isInt()
    .withMessage('Invalid problem ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('points')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Points must be a positive number'),
  body('constraints')
    .optional()
    .trim(),
  body('inputFormat')
    .optional()
    .trim(),
  body('outputFormat')
    .optional()
    .trim(),
];