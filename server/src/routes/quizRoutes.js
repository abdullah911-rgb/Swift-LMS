const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const { computeFinalScore } = require('../utils/evaluationUtils');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ── Instructor/Admin Quiz Management Routes ────────────────────────────

// Create/Update quiz for a course
router.post(
  '/course/:courseId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  quizController.upsertQuiz
);

// Get quiz info (student view is sanitized inside controller; instructor/admin gets all details)
router.get(
  '/course/:courseId',
  requireAuth,
  quizController.getQuiz
);

// Update quiz settings directly
router.put(
  '/:quizId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  quizController.updateQuiz
);

// Delete a quiz
router.delete(
  '/:quizId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  quizController.deleteQuiz
);

// Toggle publish status
router.patch(
  '/:quizId/publish',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  quizController.togglePublish
);

// Bulk import questions
router.post(
  '/:quizId/import',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  quizController.importQuestions
);

// Preview parsed questions (bulk import)
router.post(
  '/:quizId/preview-import',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  quizController.previewImport
);

// Get all questions with answers for edit view
router.get(
  '/:quizId/questions',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  quizController.getQuestions
);

// Delete single question
router.delete(
  '/question/:questionId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  quizController.deleteQuestion
);

// Get statistics for instructor/admin
router.get(
  '/course/:courseId/stats',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  quizController.getStats
);

// Admin-only route to get all quizzes
router.get(
  '/admin/all',
  requireAuth,
  requireRole('ADMIN'),
  quizController.getAllQuizzes
);

// ── Student Quiz Flow Routes ───────────────────────────────────────────

// Check student eligibility for a course quiz
router.get(
  '/course/:courseId/eligibility',
  requireAuth,
  requireRole('STUDENT'),
  quizController.checkEligibility
);

// Start quiz (creates attempt and session)
router.post(
  '/course/:courseId/start',
  requireAuth,
  requireRole('STUDENT'),
  quizController.startQuiz
);

// Save/submit answer for current question and get next
router.post(
  '/attempt/:attemptId/answer',
  requireAuth,
  requireRole('STUDENT'),
  quizController.submitAnswer
);

// Final submit quiz
router.post(
  '/attempt/:attemptId/submit',
  requireAuth,
  requireRole('STUDENT'),
  quizController.submitQuiz
);

// Get my attempt history
router.get(
  '/course/:courseId/attempts',
  requireAuth,
  requireRole('STUDENT'),
  quizController.getAttemptHistory
);

// Evaluate current student status (composite final score)
router.get(
  '/course/:courseId/evaluate',
  requireAuth,
  requireRole('STUDENT', 'INSTRUCTOR', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    // If student, check own. If instructor/admin, allow passing target userId in query
    let targetUserId = req.user.id;
    if (req.user.role !== 'STUDENT' && req.query.userId) {
      targetUserId = req.query.userId;
    }
    const evaluation = await computeFinalScore(targetUserId, courseId);
    sendSuccess(res, 'Evaluation calculated.', { evaluation });
  })
);

module.exports = router;
