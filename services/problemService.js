const Problem = require('../models/problem');
const TestCase = require('../models/testCase');
const Assignment = require('../models/assignment');
const Submission = require('../models/submission');
const ErrorResponse = require('../utils/errorResponse');

class ProblemService {
  async getProblemsByAssignment(assignmentId, studentId = null) {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    const problems = await Problem.findByAssignmentId(assignmentId);

    if (!studentId) {
      return problems;
    }

    const acceptedIds = await Submission.findAcceptedProblemsByStudent(
      studentId,
      assignmentId
    );
    const solvedSet = new Set(acceptedIds.map(String));

    return problems.map((p) => ({
      ...p,
      solved: solvedSet.has(String(p.id)),
    }));
  }

  async getProblemById(id, includeTestCases = false, includeHidden = false) {
    const problem = await Problem.findById(id);
    if (!problem) {
      throw new ErrorResponse('Problem not found', 404);
    }

    if (includeTestCases) {
      problem.testCases = await TestCase.findByProblemId(id, includeHidden);
      problem.sampleTestCases = await TestCase.getSampleTestCases(id);
    }

    return problem;
  }

  async createProblem(problemData) {
    const assignment = await Assignment.findById(problemData.assignmentId);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    return await Problem.create(problemData);
  }

  async updateProblem(id, problemData) {
    const problem = await Problem.findById(id);
    if (!problem) {
      throw new ErrorResponse('Problem not found', 404);
    }

    return await Problem.update(id, problemData);
  }

  async deleteProblem(id) {
    const problem = await Problem.findById(id);
    if (!problem) {
      throw new ErrorResponse('Problem not found', 404);
    }

    return await Problem.delete(id);
  }

  // Test case methods
  async getTestCases(problemId, includeHidden = false) {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new ErrorResponse('Problem not found', 404);
    }

    return await TestCase.findByProblemId(problemId, includeHidden);
  }

  async getSampleTestCases(problemId) {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new ErrorResponse('Problem not found', 404);
    }

    return await TestCase.getSampleTestCases(problemId);
  }

  async createTestCase(testCaseData) {
    const problem = await Problem.findById(testCaseData.problemId);
    if (!problem) {
      throw new ErrorResponse('Problem not found', 404);
    }

    return await TestCase.create(testCaseData);
  }

  async bulkCreateTestCases(testCasesData) {
    // Validate that all problems exist
    const problemIds = [...new Set(testCasesData.map(tc => tc.problemId))];
    
    for (const problemId of problemIds) {
      const problem = await Problem.findById(problemId);
      if (!problem) {
        throw new ErrorResponse(`Problem with ID ${problemId} not found`, 404);
      }
    }

    return await TestCase.bulkCreate(testCasesData);
  }

  async updateTestCase(id, testCaseData) {
    const testCase = await TestCase.findById(id);
    if (!testCase) {
      throw new ErrorResponse('Test case not found', 404);
    }

    return await TestCase.update(id, testCaseData);
  }

  async deleteTestCase(id) {
    const testCase = await TestCase.findById(id);
    if (!testCase) {
      throw new ErrorResponse('Test case not found', 404);
    }

    return await TestCase.delete(id);
  }

  async getProblemWithSamples(problemId) {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new ErrorResponse('Problem not found', 404);
    }

    // Only return sample test cases (not hidden ones)
    problem.sampleTestCases = await TestCase.getSampleTestCases(problemId);
    
    return problem;
  }

  async validateTestCases(problemId) {
    const testCases = await TestCase.findByProblemId(problemId, true);
    
    if (testCases.length === 0) {
      throw new ErrorResponse('Problem must have at least one test case', 400);
    }

    const sampleTestCases = testCases.filter(tc => tc.is_sample);
    if (sampleTestCases.length === 0) {
      throw new ErrorResponse('Problem must have at least one sample test case', 400);
    }

    return {
      valid: true,
      totalTestCases: testCases.length,
      sampleTestCases: sampleTestCases.length,
      hiddenTestCases: testCases.filter(tc => tc.is_hidden).length,
    };
  }
}

module.exports = new ProblemService();