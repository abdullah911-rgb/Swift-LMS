const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const { uploadAssignment } = require('../middlewares/upload');

// ── Public / Download Route (serves DB-stored files) ──────────────────────────
router.get('/files/:fileId', assignmentController.downloadFile);
router.get('/files/:fileId/:filename', assignmentController.downloadFile);

// ── Instructor routes ─────────────────────────────────────────────────────────

// Create assignment for a course (with optional file upload)
router.post(
  '/course/:courseId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  uploadAssignment.single('file'),
  assignmentController.createAssignment
);

// Get all assignments for a course (instructor view — with submission counts)
router.get(
  '/course/:courseId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  assignmentController.getCourseAssignments
);

// Delete an assignment
router.delete(
  '/:assignmentId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  assignmentController.deleteAssignment
);

// Get all submissions for an assignment (instructor view)
router.get(
  '/:assignmentId/submissions',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  assignmentController.getSubmissions
);

// Review / grade a specific submission
router.patch(
  '/submissions/:submissionId/review',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  assignmentController.reviewSubmission
);

// ── Student routes ────────────────────────────────────────────────────────────

// Get all assignments for a course with student's own submission status
router.get(
  '/course/:courseId/student',
  requireAuth,
  requireRole('STUDENT'),
  assignmentController.getStudentCourseAssignments
);

// Submit assignment (student uploads their file)
router.post(
  '/:assignmentId/submit',
  requireAuth,
  requireRole('STUDENT'),
  uploadAssignment.single('file'),
  assignmentController.submitAssignment
);

module.exports = router;
