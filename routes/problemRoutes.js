const express = require('express');
const {
  getAllProblems,
  getAvailableProblemsForStudent,
  getProblemsByAssignment,
  getProblem,
  getProblemWithSamples,
  createProblem,
  updateProblem,
  deleteProblem,
  getTestCases,
  getSampleTestCases,
  createTestCase,
  bulkCreateTestCases,
  updateTestCase,
  deleteTestCase,
  validateTestCases,
} = require('../controllers/problemController');
const { protect } = require('../middlewares/auth');
const { isAdmin, isStudent } = require('../middlewares/roles');
const {
  createProblemValidator,
  updateProblemValidator,
} = require('../validators/problemValidator');
const { validate } = require('../utils/validator');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Problem routes
router.get('/available', isStudent, getAvailableProblemsForStudent);
router.get('/assignment/:assignmentId', getProblemsByAssignment);

router
  .route('/')
  .get(isAdmin, getAllProblems)
  .post(isAdmin, createProblemValidator, validate, createProblem);

router
  .route('/:id')
  .get(getProblem)
  .put(isAdmin, updateProblemValidator, validate, updateProblem)
  .delete(isAdmin, deleteProblem);

// Route to get problem with only sample test cases (for students and admins viewing assignments)
router.get('/:id/samples', getProblemWithSamples);

// Admin route to validate test cases
router.get('/:id/validate', isAdmin, validateTestCases);

// Test case routes
router
  .route('/:id/testcases')
  .get(isAdmin, getTestCases)
  .post(isAdmin, createTestCase);

router.post('/:id/testcases/bulk', isAdmin, bulkCreateTestCases);

router
  .route('/testcases/:testCaseId')
  .put(isAdmin, updateTestCase)
  .delete(isAdmin, deleteTestCase);

module.exports = router;