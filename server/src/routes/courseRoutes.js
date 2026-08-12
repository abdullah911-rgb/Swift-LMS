const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { requireAuth } = require('../middlewares/auth');
const { optionalAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const { uploadImage } = require('../middlewares/upload');

// Public routes
router.get('/stats', courseController.getStats);
router.get('/featured', courseController.getFeatured);

// Admin routes (before /:id to avoid slug conflicts)
router.get('/admin/pending', requireAuth, requireRole('ADMIN'), courseController.getPendingApproval);
router.patch('/:id/approve', requireAuth, requireRole('ADMIN'), courseController.approveCourse);
router.patch('/:id/reject', requireAuth, requireRole('ADMIN'), courseController.rejectCourse);
router.patch('/:id/publish', requireAuth, requireRole('ADMIN'), courseController.togglePublish);

// Instructor routes — instructors can view their assigned courses but cannot create/delete
router.get('/instructor/my-courses', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.getInstructorCourses);
// Only admin can create, update, delete courses
router.post('/', requireAuth, requireRole('ADMIN'), uploadImage.single('thumbnail'), courseController.create);
router.put('/:id', requireAuth, requireRole('ADMIN'), uploadImage.single('thumbnail'), courseController.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), courseController.delete);

// Public listing and detail (must come AFTER specific named routes)
router.get('/', optionalAuth, courseController.getAll);
router.get('/:slug', optionalAuth, courseController.getOne);

// Instructor — Course Announcements
router.get('/:id/announcements', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.getCourseAnnouncements);
router.post('/:id/announcements', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.createCourseAnnouncement);
router.delete('/:courseId/announcements/:announcementId', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.deleteCourseAnnouncement);


// ── TEMP: Seed test student eligibility (REMOVE AFTER TESTING) ────────────
router.post('/admin/seed-test-eligibility', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const prisma = require('../config/db');
  try {
    const student = await prisma.user.findUnique({
      where: { email: 'student@lms.com' },
      select: { id: true, name: true },
    });
    if (!student) return res.status(404).json({ error: 'student@lms.com not found' });

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id, status: { not: 'DROPPED' } },
      select: { courseId: true },
    });

    const results = [];

    for (const { courseId } of enrollments) {
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
      const log = { course: course?.title, courseId, attendance: 0, assignments: 0, quiz: null };

      // A. Seed attendance for all ENDED/LIVE meetings
      const meetings = await prisma.zoomMeeting.findMany({
        where: { courseId, status: { in: ['ENDED', 'LIVE'] } },
        select: { id: true, startTime: true, duration: true },
      });
      for (const m of meetings) {
        const joinedAt = new Date(m.startTime);
        const leftAt = new Date(joinedAt.getTime() + (m.duration || 60) * 60 * 1000);
        await prisma.attendance.upsert({
          where: { meetingId_studentId: { meetingId: m.id, studentId: student.id } },
          update: { joinedAt, leftAt, duration: m.duration || 60 },
          create: { meetingId: m.id, studentId: student.id, joinedAt, leftAt, duration: m.duration || 60 },
        });
        log.attendance++;
      }

      // B. Seed assignment submissions + grades
      const assignments = await prisma.assignment.findMany({
        where: { courseId, isPublished: true },
        select: { id: true, title: true },
      });
      for (const a of assignments) {
        const existing = await prisma.assignmentSubmission.findFirst({
          where: { assignmentId: a.id, studentId: student.id },
        });
        if (!existing) {
          await prisma.assignmentSubmission.create({
            data: {
              assignmentId: a.id, studentId: student.id,
              fileUrl: '/uploads/test_submission.pdf', fileName: 'test_submission.pdf',
              status: 'GRADED', grade: '90', feedback: 'Auto-graded for testing',
            },
          });
          log.assignments++;
        } else if (existing.status !== 'GRADED') {
          await prisma.assignmentSubmission.update({
            where: { id: existing.id },
            data: { status: 'GRADED', grade: '90', feedback: 'Auto-graded for testing' },
          });
          log.assignments++;
        }
      }

      // C. Seed passing quiz attempt
      const quiz = await prisma.quiz.findUnique({ where: { courseId }, select: { id: true, timePerQuestion: true } });
      if (quiz) {
        const existingPass = await prisma.quizAttempt.findFirst({
          where: { quizId: quiz.id, userId: student.id, passed: true, completedAt: { not: null } },
        });
        if (!existingPass) {
          const qCount = await prisma.question.count({ where: { quizId: quiz.id } });
          await prisma.quizAttempt.create({
            data: {
              quizId: quiz.id, userId: student.id, attemptNumber: 1,
              rawScore: qCount, score: 100, mcqMarks: 60, passed: true,
              timeTaken: qCount * (quiz.timePerQuestion || 60),
              startedAt: new Date(Date.now() - 3600000), completedAt: new Date(),
            },
          });
          log.quiz = 'created passing attempt';
        } else {
          log.quiz = 'already passed';
        }
      } else {
        log.quiz = 'no quiz configured';
      }

      // D. Set progress to 100%
      await prisma.enrollment.update({
        where: { studentId_courseId: { studentId: student.id, courseId } },
        data: { progress: 100 },
      });

      results.push(log);
    }

    res.json({ success: true, student: student.name, courses: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// ── END TEMP ───────────────────────────────────────────────────────────────

module.exports = router;
