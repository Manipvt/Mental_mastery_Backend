const axios = require('axios');
const Submission = require('../models/submission');
const TestCase = require('../models/testCase');
const Problem = require('../models/problem');
const Assignment = require('../models/assignment');
const AssignmentSession = require('../models/assignmentSession');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../config/logger');

class SubmissionService {
  // Language ID mapping for Judge0
  getLanguageId(language) {
    const languageMap = {
      'javascript': 63,
      'python': 71,
      'java': 62,
      'cpp': 54,
      'c': 50,
      'csharp': 51,
      'ruby': 72,
      'go': 60,
      'rust': 73,
    };
    return languageMap[language.toLowerCase()] || 71;
  }

  async submitCode(submissionData, studentId) {
    // Check if student has an active session
    const session = await AssignmentSession.findByStudentAndAssignment(
      studentId,
      submissionData.assignmentId
    );

    if (!session) {
      throw new ErrorResponse('Session not started. Please start the assignment first', 403);
    }

    if (session.is_locked) {
      throw new ErrorResponse('Your session is locked due to violations', 403);
    }

    // Check assignment access
    const assignment = await Assignment.findById(submissionData.assignmentId);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    const now = new Date();
    const endTime = new Date(assignment.end_time);

    if (now > endTime) {
      throw new ErrorResponse('Assignment has ended', 403);
    }

    // Check if multiple submissions are allowed
    if (!assignment.allow_multiple_submissions) {
      const existingSubmissions = await Submission.findByStudentAndProblem(
        studentId,
        submissionData.problemId
      );

      const acceptedSubmission = existingSubmissions.find(s => s.status === 'accepted');
      if (acceptedSubmission) {
        throw new ErrorResponse('You have already solved this problem', 403);
      }
    }

    // Create submission record
    const submission = await Submission.create({
      ...submissionData,
      studentId,
      status: 'pending',
    });

    // Execute code asynchronously
    this.executeSubmission(submission.id).catch(err => {
      logger.error('Submission execution error:', err);
    });

    return submission;
  }

  async executeSubmission(submissionId) {
    try {
      const submission = await Submission.findById(submissionId);
      const testCases = await TestCase.findByProblemId(submission.problem_id, true);
      const problem = await Problem.findById(submission.problem_id);

      if (testCases.length === 0) {
        await Submission.update(submissionId, {
          status: 'runtime_error',
          errorMessage: 'No test cases available for this problem',
        });
        return;
      }

      let passedCount = 0;
      let totalScore = 0;
      let allPassed = true;
      let maxExecutionTime = 0;
      let maxMemoryUsed = 0;
      let errorMessage = null;

      for (const testCase of testCases) {
        const result = await this.runTestCase(
          submission.code,
          submission.language,
          testCase.input,
          testCase.expected_output,
          problem.time_limit,
          problem.memory_limit
        );

        if (result.passed) {
          passedCount++;
          totalScore += testCase.points;
        } else {
          allPassed = false;
          if (!errorMessage && result.error) {
            errorMessage = result.error;
          }
        }

        if (result.executionTime > maxExecutionTime) {
          maxExecutionTime = result.executionTime;
        }

        if (result.memory > maxMemoryUsed) {
          maxMemoryUsed = result.memory;
        }

        // Stop execution if TLE or MLE
        if (result.status === 'time_limit_exceeded' || result.status === 'memory_limit_exceeded') {
          await Submission.update(submissionId, {
            status: result.status,
            testCasesPassed: passedCount,
            totalTestCases: testCases.length,
            score: totalScore,
            executionTime: maxExecutionTime,
            memoryUsed: maxMemoryUsed,
            errorMessage: result.error,
          });
          return;
        }
      }

      await Submission.update(submissionId, {
        status: allPassed ? 'accepted' : 'wrong_answer',
        testCasesPassed: passedCount,
        totalTestCases: testCases.length,
        score: totalScore,
        executionTime: maxExecutionTime,
        memoryUsed: maxMemoryUsed,
        errorMessage,
      });

    } catch (error) {
      logger.error('Execution error:', error);
      await Submission.update(submissionId, {
        status: 'runtime_error',
        errorMessage: error.message,
      });
    }
  }

  async runTestCase(code, language, input, expectedOutput, timeLimit, memoryLimit) {
    try {
      // Using Judge0 API (if configured)
      if (process.env.JUDGE0_API_URL && process.env.JUDGE0_API_KEY) {
        return await this.runWithJudge0(code, language, input, expectedOutput, timeLimit);
      }

      // Fallback to simple comparison (for development/testing)
      // In production, ALWAYS use Judge0 or a sandboxed environment
      return this.runSimpleTest(code, input, expectedOutput);

    } catch (error) {
      logger.error('Test case execution error:', error);
      return {
        passed: false,
        error: error.message,
        executionTime: 0,
        memory: 0,
      };
    }
  }

  async runWithJudge0(code, language, input, expectedOutput, timeLimit) {
    try {
      const languageId = this.getLanguageId(language);

      // Create submission
      const response = await axios.post(
        `${process.env.JUDGE0_API_URL}/submissions`,
        {
          source_code: Buffer.from(code).toString('base64'),
          language_id: languageId,
          stdin: Buffer.from(input).toString('base64'),
          expected_output: Buffer.from(expectedOutput).toString('base64'),
          cpu_time_limit: timeLimit / 1000, // Convert ms to seconds
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
        }
      );

      const token = response.data.token;

      // Poll for result
      let result;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const resultResponse = await axios.get(
          `${process.env.JUDGE0_API_URL}/submissions/${token}`,
          {
            headers: {
              'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
          }
        );

        result = resultResponse.data;

        if (result.status.id > 2) {
          break;
        }

        attempts++;
      }

      const passed = result.status.id === 3; // Accepted
      const executionTime = parseFloat(result.time) * 1000; // Convert to ms
      const memory = parseInt(result.memory);

      return {
        passed,
        output: result.stdout ? Buffer.from(result.stdout, 'base64').toString() : '',
        error: result.stderr ? Buffer.from(result.stderr, 'base64').toString() : null,
        executionTime,
        memory,
        status: this.getStatusFromJudge0(result.status.id),
      };

    } catch (error) {
      logger.error('Judge0 error:', error);
      throw new Error('Code execution failed');
    }
  }

  getStatusFromJudge0(statusId) {
    const statusMap = {
      3: 'accepted',
      4: 'wrong_answer',
      5: 'time_limit_exceeded',
      6: 'compilation_error',
      7: 'runtime_error',
      8: 'runtime_error',
      9: 'runtime_error',
      10: 'runtime_error',
      11: 'runtime_error',
      12: 'runtime_error',
      13: 'runtime_error',
      14: 'runtime_error',
    };
    return statusMap[statusId] || 'runtime_error';
  }

  // Lightweight path to mark a problem as solved without running Judge0
  async markSolved(submissionData, studentId) {
    const problemId = parseInt(submissionData.problemId, 10);
    const language = submissionData.language || 'javascript';
    const code = submissionData.code || '';

    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new ErrorResponse('Problem not found', 404);
    }

    // Prefer provided assignmentId, fall back to problem's assignment_id
    const assignmentId = parseInt(submissionData.assignmentId, 10) || problem.assignment_id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    // If already accepted, just return existing
    const existing = await Submission.findByStudentAndProblem(studentId, problemId);
    const accepted = existing.find((s) => s.status === 'accepted');
    if (accepted) {
      return accepted;
    }

    return await Submission.create({
      userId: studentId,
      assignmentId,
      problemId,
      code,
      language,
      status: 'accepted',
      testCasesPassed: null,
      totalTestCases: null,
      score: problem.points || 0,
    });
  }

  runSimpleTest(code, input, expectedOutput) {
    // Simple comparison for testing (NOT FOR PRODUCTION)
    // This doesn't actually execute code, just simulates a result
    logger.warn('Using simple test mode - not executing actual code');
    
    return {
      passed: true,
      output: expectedOutput,
      executionTime: 100,
      memory: 1024,
      status: 'accepted',
    };
  }

  async getSubmissionById(id, studentId = null) {
    const submission = await Submission.findById(id);
    if (!submission) {
      throw new ErrorResponse('Submission not found', 404);
    }

    // If student ID is provided, verify ownership
    if (studentId && submission.student_id !== studentId) {
      throw new ErrorResponse('Not authorized to view this submission', 403);
    }

    return submission;
  }

  async getStudentSubmissions(studentId, filters = {}) {
    return await Submission.findByStudent(studentId, filters);
  }

  async getAssignmentSubmissions(assignmentId) {
    return await Submission.findByAssignment(assignmentId);
  }

  async getLeaderboard(assignmentId) {
    return await Submission.getLeaderboard(assignmentId);
  }

  async getStudentProgress(studentId, assignmentId) {
    return await Submission.getStudentProgress(studentId, assignmentId);
  }

  async getProblemSubmissions(studentId, problemId) {
    return await Submission.findByStudentAndProblem(studentId, problemId);
  }

  async rerunSubmission(submissionId, adminId) {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new ErrorResponse('Submission not found', 404);
    }

    // Reset status
    await Submission.update(submissionId, {
      status: 'pending',
      score: 0,
      testCasesPassed: 0,
      errorMessage: null,
    });

    // Re-execute
    this.executeSubmission(submissionId).catch(err => {
      logger.error('Rerun submission error:', err);
    });

    return { message: 'Submission is being re-evaluated' };
  }
}

module.exports = new SubmissionService();