const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

async function recalculateEnrollmentProgress(studentId, courseId) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment) return null;

  // 1. Lessons
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({
      where: { module: { courseId }, isPublished: true },
    }),
    prisma.lessonProgress.count({
      where: { enrollmentId: enrollment.id, isCompleted: true },
    }),
  ]);

  // 2. Assignments
  const allAssignments = await prisma.assignment.findMany({
    where: { courseId, isPublished: true },
    select: { id: true },
  });
  const totalAssignments = allAssignments.length;
  let completedAssignments = 0;
  if (totalAssignments > 0) {
    const assignmentIds = allAssignments.map((a) => a.id);
    completedAssignments = await prisma.assignmentSubmission.count({
      where: {
        assignmentId: { in: assignmentIds },
        studentId,
        status: { in: ['SUBMITTED', 'GRADED'] },
      },
    });
  }

  // 3. Quiz
  const quiz = await prisma.quiz.findUnique({
    where: { courseId, isPublished: true },
    select: { id: true },
  });
  const hasQuiz = Boolean(quiz);
  let quizCompleted = 0;
  if (hasQuiz) {
    const passedAttempt = await prisma.quizAttempt.findFirst({
      where: { quizId: quiz.id, userId: studentId, passed: true },
    });
    if (passedAttempt) quizCompleted = 1;
  }

  const totalItems = totalLessons + totalAssignments + (hasQuiz ? 1 : 0);
  const completedItems = completedLessons + completedAssignments + quizCompleted;

  let progressPercent = 0;
  if (totalItems > 0) {
    progressPercent = Math.round((completedItems / totalItems) * 100);
  } else {
    progressPercent = enrollment.progress || 0;
  }

  progressPercent = Math.min(100, Math.max(0, progressPercent));

  return prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progress: progressPercent,
      status: progressPercent === 100 ? 'COMPLETED' : enrollment.status,
      completedAt: progressPercent === 100 ? (enrollment.completedAt || new Date()) : enrollment.completedAt,
    },
  });
}

const enrollmentController = {
  // POST /api/enrollments/:courseId — Enroll in a course
  enroll: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId, status: 'PUBLISHED' },
    });
    if (!course) return sendError(res, 'Course not found or not published.', 404);

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) return sendError(res, 'Already enrolled in this course.', 409);

    // Generate sequential Roll Number (SST-YYYY-NNNNNNNN)
    const year = new Date().getFullYear();
    const prefix = `SST-${year}-`;
    const lastEnrollment = await prisma.enrollment.findFirst({
      where: { rollNumber: { startsWith: prefix } },
      orderBy: { rollNumber: 'desc' },
      select: { rollNumber: true },
    });
    let nextNum = 1;
    if (lastEnrollment?.rollNumber) {
      const parts = lastEnrollment.rollNumber.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    const rollNumber = `${prefix}${String(nextNum).padStart(8, '0')}`;

    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId, rollNumber },
      include: {
        course: { select: { id: true, title: true, slug: true, thumbnail: true } },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'Enrollment Successful',
        message: `You have been enrolled in "${course.title}". Your Roll # is ${rollNumber}.`,
        type: 'SUCCESS',
      },
    });

    sendSuccess(res, 'Enrolled successfully.', { enrollment }, 201);
  }),

  // GET /api/enrollments/my — Student's enrolled courses
  getMyEnrollments: asyncHandler(async (req, res) => {
    const studentId = req.user.id;

    const rawEnrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            level: true,
            totalLessons: true,
            duration: true,
            category: { select: { name: true } },
            instructor: { select: { name: true, avatar: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Recalculate progress for each enrollment dynamically
    const enrollments = await Promise.all(
      rawEnrollments.map(async (e) => {
        try {
          const updated = await recalculateEnrollmentProgress(studentId, e.courseId);
          return { ...e, progress: updated ? updated.progress : e.progress };
        } catch {
          return e;
        }
      })
    );

    sendSuccess(res, 'Enrollments fetched.', { enrollments });
  }),

  // GET /api/enrollments/:courseId — Single enrollment with full course content
  getCourseAccess: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true, avatar: true, bio: true } },
            category: { select: { name: true } },
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true, title: true, type: true, duration: true,
                    isFree: true, order: true, videoUrl: true, content: true,
                    resources: { select: { id: true, name: true, fileUrl: true, fileType: true, fileSize: true } },
                  },
                },
              },
            },
            zoomMeetings: {
              // Fetch SCHEDULED + LIVE; auto-end logic below handles edge cases
              where: { meetingId: { not: null }, status: { in: ['SCHEDULED', 'LIVE', 'ENDED'] } },
              orderBy: { startTime: 'asc' },
              take: 10,
              select: {
                id: true, meetingId: true, topic: true, startTime: true,
                duration: true, joinUrl: true, status: true, agenda: true,
              },
            },
            announcements: {
              where: { isPublished: true },
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: { id: true, title: true, body: true, createdAt: true },
            },
          },
        },
        lessonProgress: {
          select: { lessonId: true, isCompleted: true, watchedSeconds: true },
        },
      },
    });

    if (!enrollment) return sendError(res, 'You are not enrolled in this course.', 403);

    // ── Auto-adjust meeting statuses server-side ────────────────────────────
    const now = new Date();
    const adjustedMeetings = await Promise.all(
      (enrollment.course.zoomMeetings || []).map(async (m) => {
        const start = new Date(m.startTime);
        const end = new Date(start.getTime() + (m.duration || 60) * 60 * 1000);

        // SCHEDULED → LIVE: start time has arrived but class isn't ended yet
        if (m.status === 'SCHEDULED' && now >= start && now < end) {
          try {
            await prisma.zoomMeeting.update({ where: { id: m.id }, data: { status: 'LIVE' } });
          } catch (_) {}
          return { ...m, status: 'LIVE' };
        }

        // LIVE or SCHEDULED → ENDED: end time has passed
        if ((m.status === 'LIVE' || m.status === 'SCHEDULED') && now >= end) {
          try {
            await prisma.zoomMeeting.update({ where: { id: m.id }, data: { status: 'ENDED' } });
          } catch (_) {}
          return { ...m, status: 'ENDED' };
        }

        return m;
      })
    );

    enrollment.course.zoomMeetings = adjustedMeetings;

    sendSuccess(res, 'Course access granted.', { enrollment });
  }),

  // POST /api/enrollments/:courseId/lessons/:lessonId/complete — Mark lesson complete
  completeLesson: asyncHandler(async (req, res) => {
    const { courseId, lessonId } = req.params;
    const studentId = req.user.id;
    const { watchedSeconds = 0 } = req.body;

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) return sendError(res, 'Not enrolled in this course.', 403);

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) return sendError(res, 'Lesson not found.', 404);

    const progress = await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        userId: studentId,
        isCompleted: true,
        watchedSeconds,
        completedAt: new Date(),
      },
      update: {
        isCompleted: true,
        watchedSeconds,
        completedAt: new Date(),
      },
    });

    // Recalculate overall enrollment progress across lessons, assignments, and quizzes
    const updatedEnrollment = await recalculateEnrollmentProgress(studentId, courseId);
    const progressPercent = updatedEnrollment ? updatedEnrollment.progress : 0;

    // Notify student that they completed lessons and can take the final quiz
    if (progressPercent === 100) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      await prisma.notification.create({
        data: {
          userId: studentId,
          title: '📝 Course Lessons Completed!',
          message: `You've completed all lessons for "${course.title}". You are now eligible to attempt the Final MCQ Assessment.`,
          type: 'SUCCESS',
          link: `/student/course/${courseId}`,
        },
      });
    }

    sendSuccess(res, 'Lesson marked as complete.', {
      lessonProgress: progress,
      enrollmentProgress: progressPercent,
    });
  }),

  // GET /api/enrollments/:courseId/students — Instructor: view enrolled students
  getCourseStudents: asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    // Verify instructor owns this course (or is admin)
    if (req.user.role === 'INSTRUCTOR') {
      const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId: req.user.id },
      });
      if (!course) return sendError(res, 'Not authorized.', 403);
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true, createdAt: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // ── Attendance data for the course ────────────────────────────────────
    // Get all meetings that count (ENDED or LIVE)
    const meetings = await prisma.zoomMeeting.findMany({
      where: { courseId, status: { in: ['ENDED', 'LIVE'] } },
      select: { id: true },
    });
    const totalMeetings = meetings.length;
    const meetingIds = meetings.map((m) => m.id);

    // For each student, count attended meetings
    const studentIds = enrollments.map((e) => e.studentId);

    let attendanceCounts = [];
    if (totalMeetings > 0 && studentIds.length > 0) {
      attendanceCounts = await prisma.attendance.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds }, meetingId: { in: meetingIds } },
        _count: { meetingId: true },
      });
    }

    // Build a map: studentId → attended count
    const attendanceMap = {};
    attendanceCounts.forEach((a) => {
      attendanceMap[a.studentId] = a._count.meetingId;
    });

    // Attach attendance info to each enrollment
    const enrichedEnrollments = enrollments.map((enrollment) => {
      const attended = attendanceMap[enrollment.studentId] || 0;
      const percentage = totalMeetings > 0 ? Math.round((attended / totalMeetings) * 100) : null;
      return {
        ...enrollment,
        attendance: {
          attended,
          total: totalMeetings,
          percentage,  // null means no sessions held yet
        },
      };
    });

    sendSuccess(res, 'Students fetched.', { enrollments: enrichedEnrollments, totalMeetings });
  }),

};

module.exports = {
  ...enrollmentController,
  recalculateEnrollmentProgress,
};
