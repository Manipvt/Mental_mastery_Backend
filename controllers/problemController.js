const asyncHandler = require('../utils/asyncHandler');
const problemService = require('../services/problemService');

// @desc    Get problems by assignment
// @route   GET /api/v1/problems/assignment/:assignmentId
// @access  Private
exports.getProblemsByAssignment = asyncHandler(async (req, res) => {
  const problems = await problemService.getProblemsByAssignment(req.params.assignmentId);

  res.status(200).json({
    success: true,
    count: problems.length,
    data: problems,
  });
});

// @desc    Get single problem
// @route   GET /api/v1/problems/:id
// @access  Private
exports.getProblem = asyncHandler(async (req, res) => {
  const includeTestCases = req.query.includeTestCases === 'true';
  const includeHidden = req.user.type === 'admin' && req.query.includeHidden === 'true';

  const problem = await problemService.getProblemById(
    req.params.id,
    includeTestCases,
    includeHidden
  );

  res.status(200).json({
    success: true,
    data: problem,
  });
});

// @desc    Get problem with sample test cases only (for students)
// @route   GET /api/v1/problems/:id/samples
// @access  Private/Student
exports.getProblemWithSamples = asyncHandler(async (req, res) => {
  const problem = await problemService.getProblemWithSamples(req.params.id);

  res.status(200).json({
    success: true,
    data: problem,
  });
});

// @desc    Create problem
// @route   POST /api/v1/problems
// @access  Private/Admin
exports.createProblem = asyncHandler(async (req, res) => {
  const problemData = {
    assignmentId: req.body.assignmentId,
    title: req.body.title,
    description: req.body.description,
    difficulty: req.body.difficulty,
    points: req.body.points,
    timeLimit: req.body.timeLimit,
    memoryLimit: req.body.memoryLimit,
    orderIndex: req.body.orderIndex,
    constraints: req.body.constraints,
    inputFormat: req.body.inputFormat,
    outputFormat: req.body.outputFormat,
  };

  const problem = await problemService.createProblem(problemData);

  res.status(201).json({
    success: true,
    data: problem,
  });
});

// @desc    Update problem
// @route   PUT /api/v1/problems/:id
// @access  Private/Admin
exports.updateProblem = asyncHandler(async (req, res) => {
  const problemData = {
    title: req.body.title,
    description: req.body.description,
    difficulty: req.body.difficulty,
    points: req.body.points,
    timeLimit: req.body.timeLimit,
    memoryLimit: req.body.memoryLimit,
    orderIndex: req.body.orderIndex,
    constraints: req.body.constraints,
    inputFormat: req.body.inputFormat,
    outputFormat: req.body.outputFormat,
  };

  const problem = await problemService.updateProblem(req.params.id, problemData);

  res.status(200).json({
    success: true,
    data: problem,
  });
});

// @desc    Delete problem
// @route   DELETE /api/v1/problems/:id
// @access  Private/Admin
exports.deleteProblem = asyncHandler(async (req, res) => {
  await problemService.deleteProblem(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Problem deleted successfully',
  });
});

// @desc    Get test cases for a problem
// @route   GET /api/v1/problems/:id/testcases
// @access  Private/Admin
exports.getTestCases = asyncHandler(async (req, res) => {
  const includeHidden = req.query.includeHidden === 'true';
  const testCases = await problemService.getTestCases(req.params.id, includeHidden);

  res.status(200).json({
    success: true,
    count: testCases.length,
    data: testCases,
  });
});

// @desc    Get sample test cases
// @route   GET /api/v1/problems/:id/samples
// @access  Private/Student
exports.getSampleTestCases = asyncHandler(async (req, res) => {
  const testCases = await problemService.getSampleTestCases(req.params.id);

  res.status(200).json({
    success: true,
    count: testCases.length,
    data: testCases,
  });
});

// @desc    Create test case
// @route   POST /api/v1/problems/:id/testcases
// @access  Private/Admin
exports.createTestCase = asyncHandler(async (req, res) => {
  const testCaseData = {
    problemId: req.params.id,
    input: req.body.input,
    expectedOutput: req.body.expectedOutput,
    isSample: req.body.isSample,
    isHidden: req.body.isHidden,
    points: req.body.points,
    orderIndex: req.body.orderIndex,
  };

  const testCase = await problemService.createTestCase(testCaseData);

  res.status(201).json({
    success: true,
    data: testCase,
  });
});

// @desc    Bulk create test cases
// @route   POST /api/v1/problems/:id/testcases/bulk
// @access  Private/Admin
exports.bulkCreateTestCases = asyncHandler(async (req, res) => {
  const testCasesData = req.body.testCases.map(tc => ({
    ...tc,
    problemId: req.params.id,
  }));

  const testCases = await problemService.bulkCreateTestCases(testCasesData);

  res.status(201).json({
    success: true,
    count: testCases.length,
    data: testCases,
  });
});

// @desc    Update test case
// @route   PUT /api/v1/problems/testcases/:testCaseId
// @access  Private/Admin
exports.updateTestCase = asyncHandler(async (req, res) => {
  const testCaseData = {
    input: req.body.input,
    expectedOutput: req.body.expectedOutput,
    isSample: req.body.isSample,
    isHidden: req.body.isHidden,
    points: req.body.points,
    orderIndex: req.body.orderIndex,
  };

  const testCase = await problemService.updateTestCase(
    req.params.testCaseId,
    testCaseData
  );

  res.status(200).json({
    success: true,
    data: testCase,
  });
});

// @desc    Delete test case
// @route   DELETE /api/v1/problems/testcases/:testCaseId
// @access  Private/Admin
exports.deleteTestCase = asyncHandler(async (req, res) => {
  await problemService.deleteTestCase(req.params.testCaseId);

  res.status(200).json({
    success: true,
    message: 'Test case deleted successfully',
  });
});

// @desc    Validate problem test cases
// @route   GET /api/v1/problems/:id/validate
// @access  Private/Admin
exports.validateTestCases = asyncHandler(async (req, res) => {
  const validation = await problemService.validateTestCases(req.params.id);

  res.status(200).json({
    success: true,
    data: validation,
  });
});