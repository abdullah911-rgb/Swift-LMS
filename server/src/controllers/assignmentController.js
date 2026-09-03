const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { recalculateEnrollmentProgress } = require('./enrollmentController');
const path = require('path');
const fs = require('fs');

const assignmentController = {
  // ── Instructor: POST /api/assignments/course/:courseId ──────────────────────
  // Create an assignment (with optional file upload) and notify enrolled students
  createAssignment: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description, dueDate } = req.body;

    if (!title) return sendError(res, 'Assignment title is required.', 400);

    // Ensure the instructor owns this course
    const course = await prisma.course.findFirst({
      where: { id: courseId, instructorId: req.user.id },
    });
    if (!course) return sendError(res, 'Course not found or not authorized.', 404);

    // Build file info if a file was uploaded — save directly into database (FileStore)
    let fileUrl = null;
    let fileType = null;
    let fileName = null;
    if (req.file) {
      const fileBuffer = req.file.buffer || (req.file.path && fs.existsSync(req.file.path) ? fs.readFileSync(req.file.path) : null);
      if (fileBuffer) {
        fileName = req.file.originalname;
        fileType = path.extname(req.file.originalname).replace('.', '').toLowerCase();
        const mimeType = req.file.mimetype || 'application/octet-stream';
        const stored = await prisma.fileStore.create({
          data: {
            data: fileBuffer,
            mimeType,
            fileName,
            fileSize: fileBuffer.length,
          },
        });
        fileUrl = `/api/assignments/files/${stored.id}/${encodeURIComponent(fileName)}`;
        if (req.file.path && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (_) {}
        }
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        instructorId: req.user.id,
        title,
        description: description || null,
        fileUrl,
        fileType,
        fileName,
        dueDate: dueDate ? new Date(dueDate) : null,
        isPublished: true,
      },
    });

    // Notify all active enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      select: { studentId: true },
    });

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((e) => ({
          userId: e.studentId,
          title: '📝 New Assignment Posted',
          message: `A new assignment "${title}" has been posted in "${course.title}". Please check the Assignments tab.`,
          type: 'INFO',
          link: `/student/course/${courseId}`,
        })),
      });
    }

    sendSuccess(res, 'Assignment created and students notified.', { assignment }, 201);
  }),

  // ── Instructor/Admin: GET /api/assignments/course/:courseId ─────────────────
  // Get all assignments for a course (instructor view — includes submission counts)
  getCourseAssignments: asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    // Admin can see any course; Instructor can only see their own courses
    if (req.user.role === 'INSTRUCTOR') {
      const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId: req.user.id },
      });
      if (!course) return sendError(res, 'Course not found or not authorized.', 404);
    } else {
      // Admin: verify course exists
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return sendError(res, 'Course not found.', 404);
    }

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { submissions: true } },
      },
    });

    sendSuccess(res, 'Assignments fetched.', { assignments });
  }),


  // ── Student: GET /api/assignments/course/:courseId/student ──────────────────
  // Get all assignments for a course with the student's own submission status
  getStudentCourseAssignments: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Verify student is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) return sendError(res, 'You are not enrolled in this course.', 403);

    const assignments = await prisma.assignment.findMany({
      where: { courseId, isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: {
          where: { studentId },
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            fileType: true,
            note: true,
            status: true,
            grade: true,
            feedback: true,
            submittedAt: true,
            reviewedAt: true,
          },
        },
      },
    });

    sendSuccess(res, 'Assignments fetched.', { assignments });
  }),

  // ── Instructor: DELETE /api/assignments/:assignmentId ───────────────────────
  deleteAssignment: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) return sendError(res, 'Assignment not found.', 404);
    if (assignment.instructorId !== req.user.id)
      return sendError(res, 'Not authorized.', 403);

    await prisma.assignment.delete({ where: { id: assignmentId } });
    sendSuccess(res, 'Assignment deleted.');
  }),

  // ── Student: POST /api/assignments/:assignmentId/submit ─────────────────────
  // Student submits their work (file upload required)
  submitAssignment: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const { note } = req.body;

    if (!req.file) return sendError(res, 'Please upload your assignment file.', 400);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: { select: { title: true } } },
    });
    if (!assignment || !assignment.isPublished)
      return sendError(res, 'Assignment not found.', 404);

    // Verify student is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: assignment.courseId } },
    });
    if (!enrollment) return sendError(res, 'You are not enrolled in this course.', 403);
    if (enrollment.status === 'DROPPED') return sendError(res, 'Your enrollment is inactive.', 403);

    // Check if course is completed or certificate already claimed
    const certificate = await prisma.certificate.findUnique({
      where: { studentId_courseId: { studentId, courseId: assignment.courseId } },
    });
    if (enrollment.status === 'COMPLETED' || certificate) {
      return sendError(res, 'You have already completed this course and earned your certificate. Assignment submissions are closed.', 403);
    }

    const fileBuffer = req.file.buffer || (req.file.path && fs.existsSync(req.file.path) ? fs.readFileSync(req.file.path) : null);
    if (!fileBuffer) return sendError(res, 'Failed to read submitted file for database storage.', 400);

    const fileName = req.file.originalname;
    const fileType = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    const mimeType = req.file.mimetype || 'application/octet-stream';

    const stored = await prisma.fileStore.create({
      data: {
        data: fileBuffer,
        mimeType,
        fileName,
        fileSize: fileBuffer.length,
      },
    });

    const fileUrl = `/api/assignments/files/${stored.id}/${encodeURIComponent(fileName)}`;
    const now = new Date();

    if (req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }

    // Detect existing submission (resubmit vs first submit)
    const existing = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      select: { id: true, status: true, reviewedAt: true },
    });
    const isResubmission = Boolean(existing);
    const wasPreviouslyReviewed = Boolean(
      existing && (existing.status === 'GRADED' || existing.status === 'REVIEWED' || existing.reviewedAt)
    );

    // Upsert: first submit creates; later submits replace file and clear grade.
    // Keep reviewedAt when previously reviewed so instructors can see it was a resubmission.
    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      create: {
        assignmentId,
        studentId,
        fileUrl,
        fileType,
        fileName,
        note: note || null,
        status: 'SUBMITTED',
        submittedAt: now,
      },
      update: {
        fileUrl,
        fileType,
        fileName,
        note: note || null,
        status: 'SUBMITTED',
        grade: null,
        feedback: null,
        submittedAt: now,
        // Preserve prior reviewedAt so instructor UI can flag "resubmitted after review"
        ...(wasPreviouslyReviewed ? {} : { reviewedAt: null }),
      },
    });

    // Recalculate student enrollment progress in this course
    try { await recalculateEnrollmentProgress(studentId, assignment.courseId); } catch (_) {}

    // Notify the instructor — call out resubmissions so they re-review
    await prisma.notification.create({
      data: {
        userId: assignment.instructorId,
        title: isResubmission ? '🔄 Assignment Resubmitted' : '📬 Assignment Submitted',
        message: isResubmission
          ? `A student has resubmitted "${assignment.title}" in "${assignment.course.title}".${wasPreviouslyReviewed ? ' Previous grade was cleared — please review and grade again.' : ' Please review the updated work.'}`
          : `A student has submitted their work for "${assignment.title}" in "${assignment.course.title}".`,
        type: 'SUCCESS',
        link: `/instructor/courses/${assignment.courseId}/edit`,
      },
    });

    sendSuccess(
      res,
      isResubmission ? 'Assignment resubmitted successfully. Your instructor will need to review it again.' : 'Assignment submitted successfully.',
      { submission, isResubmission },
      201
    );
  }),

  // ── Instructor: GET /api/assignments/:assignmentId/submissions ──────────────
  // Get all student submissions for a given assignment
  getSubmissions: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) return sendError(res, 'Assignment not found.', 404);
    if (assignment.instructorId !== req.user.id)
      return sendError(res, 'Not authorized.', 403);

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Enrich with late / resubmission flags for instructor UI
    // Resubmission after review: status is SUBMITTED again but reviewedAt is still set
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const enriched = submissions.map((sub) => {
      const submittedAt = new Date(sub.submittedAt);
      const isLate = Boolean(dueDate && submittedAt > dueDate);
      const isResubmission = sub.status === 'SUBMITTED' && Boolean(sub.reviewedAt);
      return {
        ...sub,
        isLate,
        isResubmission,
        dueDate: assignment.dueDate,
      };
    });

    sendSuccess(res, 'Submissions fetched.', { submissions: enriched, dueDate: assignment.dueDate });
  }),

  // ── Instructor: PATCH /api/assignments/submissions/:submissionId/review ──────
  // Instructor grades/provides feedback on a submission
  reviewSubmission: asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: { instructorId: true, title: true, courseId: true },
        },
        student: { select: { name: true } },
      },
    });
    if (!submission) return sendError(res, 'Submission not found.', 404);
    if (submission.assignment.instructorId !== req.user.id)
      return sendError(res, 'Not authorized.', 403);

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: grade || null,
        feedback: feedback || null,
        status: grade ? 'GRADED' : 'REVIEWED',
        reviewedAt: new Date(),
      },
    });

    // Recalculate certificate eligibility & enrollment progress if graded
    try {
      await recalculateEnrollmentProgress(submission.studentId, submission.assignment.courseId);
      if (grade) {
        const { computeFinalScore, issueCertificateWithMarks } = require('../utils/evaluationUtils');
        const evaluation = await computeFinalScore(submission.studentId, submission.assignment.courseId);
        if (evaluation.eligible) {
          await issueCertificateWithMarks(submission.studentId, submission.assignment.courseId, evaluation.breakdown);
        }
      }
    } catch (err) {
      console.error('[Assignment review] Evaluation check error:', err.message);
    }

    // Notify the student that their work has been reviewed
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        title: '✅ Assignment Reviewed',
        message: `Your submission for "${submission.assignment.title}" has been reviewed by your instructor.${grade ? ` Grade: ${grade}.` : ''}`,
        type: 'SUCCESS',
        link: `/student/course/${submission.assignment.courseId}`,
      },
    });

    sendSuccess(res, 'Submission reviewed.', { submission: updated });
  }),

  // ── GET /api/assignments/files/:fileId (and /:fileId/:filename) ───────────
  // Download an assignment file or submission file directly from the database (PostgreSQL BYTEA)
  downloadFile: asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    if (!fileId) return sendError(res, 'File ID is required.', 400);

    const fileRecord = await prisma.fileStore.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord || !fileRecord.data) {
      return sendError(res, 'The requested file was not found in the database.', 404);
    }

    res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fileRecord.fileSize || fileRecord.data.length);
    const safeName = (fileRecord.fileName || 'file').replace(/["\r\n]/g, '_');
    const encodedName = encodeURIComponent(fileRecord.fileName || 'file').replace(/['()]/g, escape);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.end(fileRecord.data);
  }),
};

module.exports = assignmentController;
