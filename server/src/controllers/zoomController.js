const prisma = require('../config/db');
const config = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const zoomApiService = require('../services/zoomApiService');
const zoomOAuthService = require('../services/zoomOAuthService');
const { generateZoomSignature } = require('../utils/zoomSignature');

const APPROVED_STATUSES = ['SCHEDULED', 'LIVE', 'ENDED'];
const VISIBLE_TO_STUDENTS = ['SCHEDULED', 'LIVE', 'ENDED'];

async function notifyAdminsOfClassRequest(meeting, course) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });
  if (!admins.length) return;

  const isInstant = meeting.startTime <= new Date();
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title: 'New Live Class Request',
      message: `${course.title}: "${meeting.topic}" ${isInstant ? 'start now' : 'scheduled'} — awaiting your approval.`,
      type: 'WARNING',
      link: '/admin/approvals',
    })),
  });
}

async function createZoomMeetingRecord({ courseId, instructorId, topic, agenda, duration, startTime }) {
  let zoomData;

  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
    select: { zoomConnected: true },
  });

  if (instructor && instructor.zoomConnected) {
    zoomData = await zoomOAuthService.createMeetingAsInstructor(instructorId, {
      topic,
      agenda,
      duration: parseInt(duration),
      startTime,
    });
  } else {
    // Fallback to Server-to-Server admin app
    zoomData = await zoomApiService.createMeeting({
      topic,
      agenda,
      duration: parseInt(duration),
      startTime,
    });
  }

  const scheduledStart = startTime ? new Date(startTime) : new Date();
  const isFuture = startTime && scheduledStart > new Date();

  return prisma.zoomMeeting.create({
    data: {
      courseId,
      instructorId,
      meetingId: String(zoomData.id),
      topic: zoomData.topic,
      agenda: zoomData.agenda || agenda || null,
      startTime: zoomData.start_time ? new Date(zoomData.start_time) : scheduledStart,
      duration: zoomData.duration || parseInt(duration),
      joinUrl: zoomData.join_url,
      startUrl: zoomData.start_url,
      password: zoomData.password || null,
      status: isFuture ? 'SCHEDULED' : 'LIVE',
    },
  });
}

async function notifyStudentsOfClass(meeting, courseId, isInstant) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { studentId: true },
  });
  if (!enrollments.length) return;

  await prisma.notification.createMany({
    data: enrollments.map((e) => ({
      userId: e.studentId,
      title: isInstant ? '🔴 Live Class Started!' : '📅 Live Class Scheduled',
      message: isInstant
        ? `Your trainer started "${meeting.topic}". Join now!`
        : `"${meeting.topic}" has been scheduled. Check your calendar for details.`,
      type: isInstant ? 'WARNING' : 'INFO',
      link: `/student/course/${courseId}`,
    })),
  });
}

const zoomController = {
  // ── GET /api/zoom/course/:courseId ─────────────────────────────────────────
  getByCourse: asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return sendError(res, 'Course not found.', 404);

    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: req.user.id, courseId } },
      });
      if (!enrollment) return sendError(res, 'You are not enrolled in this course.', 403);
    } else if (req.user.role === 'INSTRUCTOR' && course.instructorId !== req.user.id) {
      return sendError(res, 'Not authorized.', 403);
    }

    const where = { courseId };
    if (req.user.role === 'STUDENT') {
      where.status = { in: VISIBLE_TO_STUDENTS };
    }

    const meetings = await prisma.zoomMeeting.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });

    sendSuccess(res, 'Meetings fetched.', { meetings });
  }),

  // ── POST /api/zoom/course/:courseId ────────────────────────────────────────
  create: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { topic, agenda, duration = 60, startTime } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return sendError(res, 'Course not found.', 404);

    if (req.user.role === 'INSTRUCTOR') {
      if (course.instructorId !== req.user.id) {
        return sendError(res, 'Not authorized to schedule classes for this course.', 403);
      }
    }

    const meetingTopic = topic || `${course.title} - Live Class`;
    const scheduledStart = startTime ? new Date(startTime) : new Date();
    const isFuture = startTime && scheduledStart > new Date();

    // Admins can create classes immediately; instructors need admin approval
    if (req.user.role === 'ADMIN') {
      let meeting;
      try {
        meeting = await createZoomMeetingRecord({
          courseId,
          instructorId: req.user.id,
          topic: meetingTopic,
          agenda,
          duration,
          startTime,
        });
      } catch (zoomErr) {
        console.error('Zoom API error:', zoomErr);
        return sendError(res, `Failed to create Zoom meeting: ${zoomErr.message}`, 502);
      }

      await notifyStudentsOfClass(meeting, courseId, !isFuture);
      return sendSuccess(res, 'Live class started successfully.', { meeting }, 201);
    }

    // Instructor: save approval request (no Zoom API call yet)
    const meeting = await prisma.zoomMeeting.create({
      data: {
        courseId,
        instructorId: req.user.id,
        topic: meetingTopic,
        agenda: agenda || null,
        startTime: scheduledStart,
        duration: parseInt(duration),
        status: 'PENDING_APPROVAL',
      },
    });

    await notifyAdminsOfClassRequest(meeting, course);

    sendSuccess(
      res,
      isFuture
        ? 'Class schedule request submitted. Awaiting admin approval.'
        : 'Start class request submitted. Awaiting admin approval.',
      { meeting },
      201
    );
  }),

  // ── DELETE /api/zoom/:id ───────────────────────────────────────────────────
  endClass: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const meeting = await prisma.zoomMeeting.findUnique({ where: { id } });
    if (!meeting) return sendError(res, 'Meeting not found.', 404);

    if (req.user.role === 'INSTRUCTOR' && meeting.instructorId !== req.user.id) {
      return sendError(res, 'Not authorized.', 403);
    }

    if (meeting.status === 'PENDING_APPROVAL') {
      const updated = await prisma.zoomMeeting.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      return sendSuccess(res, 'Class request cancelled.', { meeting: updated });
    }

    if (meeting.meetingId) {
      try {
        const instructor = await prisma.user.findUnique({
          where: { id: meeting.instructorId },
          select: { zoomConnected: true },
        });

        if (instructor && instructor.zoomConnected) {
          await zoomOAuthService.endMeetingAsInstructor(meeting.instructorId, meeting.meetingId);
        } else {
          await zoomApiService.endMeeting(meeting.meetingId);
        }
      } catch (zoomErr) {
        if (zoomErr.statusCode !== 404) {
          console.error('Zoom end-meeting error:', zoomErr.message);
        }
      }
    }

    const updated = await prisma.zoomMeeting.update({
      where: { id },
      data: { status: 'ENDED' },
    });

    sendSuccess(res, 'Class ended successfully.', { meeting: updated });
  }),

  // ── POST /api/zoom/:meetingId/signature ────────────────────────────────────
  getSignature: asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const { role = 0 } = req.body;

    const meeting = await prisma.zoomMeeting.findFirst({
      where: { meetingId: String(meetingId) },
    });
    if (!meeting) return sendError(res, 'Meeting not found.', 404);

    if (!APPROVED_STATUSES.includes(meeting.status)) {
      return sendError(res, 'This class has not been approved yet.', 403);
    }

    const cleanMeetingNumber = String(meetingId).replace(/\D/g, '');
    if (!cleanMeetingNumber) return sendError(res, 'Invalid meeting number.', 400);

    const sdkRole =
      (req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN') ? parseInt(role) : 0;

    const sdkKey = config.zoom.sdkKey;
    const sdkSecret = config.zoom.sdkSecret;

    if (!sdkKey || !sdkSecret) {
      return sendError(res, 'Zoom SDK is not configured on the server.', 503);
    }

    let signature;
    let zakToken = null;
    try {
      signature = generateZoomSignature(cleanMeetingNumber, sdkRole);

      // Fetch ZAK using host's custom token if it is connected
      if (sdkRole === 1) {
        try {
          const instructor = await prisma.user.findUnique({
            where: { id: meeting.instructorId },
            select: { zoomConnected: true },
          });

          if (instructor && instructor.zoomConnected) {
            zakToken = await zoomOAuthService.getInstructorZAK(meeting.instructorId);
          } else {
            zakToken = await zoomApiService.getUserZAK('me');
          }
        } catch (zakErr) {
          console.warn('[Zoom SDK] Failed to fetch host ZAK token:', zakErr.message);
        }
      }
    } catch (sigErr) {
      return sendError(res, sigErr.message, 500);
    }

    sendSuccess(res, 'Signature generated.', {
      signature,
      sdkKey,
      meetingNumber: cleanMeetingNumber,
      role: sdkRole,
      zak: zakToken,
      password: meeting.password || '',
      joinUrl: meeting.joinUrl || null,
    });
  }),

  joinAttendance: asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await prisma.zoomMeeting.findFirst({
      where: { meetingId: String(meetingId) },
    });
    if (!meeting) return sendError(res, 'Meeting not found.', 404);

    const attendance = await prisma.attendance.upsert({
      where: { meetingId_studentId: { meetingId: meeting.id, studentId: userId } },
      update: { joinedAt: new Date(), leftAt: null, duration: null },
      create: { meetingId: meeting.id, studentId: userId, joinedAt: new Date() },
    });

    sendSuccess(res, 'Attendance recorded.', { attendance });
  }),

  leaveAttendance: asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await prisma.zoomMeeting.findFirst({
      where: { meetingId: String(meetingId) },
    });
    if (!meeting) return sendError(res, 'Meeting not found.', 404);

    const existing = await prisma.attendance.findUnique({
      where: { meetingId_studentId: { meetingId: meeting.id, studentId: userId } },
    });

    if (!existing) return sendError(res, 'No join record found.', 404);

    const leftAt = new Date();
    const durationMins = Math.round((leftAt - new Date(existing.joinedAt)) / 60000);

    const attendance = await prisma.attendance.update({
      where: { meetingId_studentId: { meetingId: meeting.id, studentId: userId } },
      data: { leftAt, duration: durationMins },
    });

    sendSuccess(res, 'Leave time recorded.', { attendance });
  }),

  getCalendar: asyncHandler(async (req, res) => {
    let meetings = [];
    const include = {
      course: { select: { id: true, title: true, slug: true } },
      instructor: { select: { name: true, avatar: true } },
    };

    if (req.user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e) => e.courseId);

      meetings = await prisma.zoomMeeting.findMany({
        where: {
          courseId: { in: courseIds },
          status: { in: VISIBLE_TO_STUDENTS },
        },
        include,
        orderBy: { startTime: 'asc' },
      });
    } else if (req.user.role === 'INSTRUCTOR') {
      meetings = await prisma.zoomMeeting.findMany({
        where: { instructorId: req.user.id },
        include,
        orderBy: { startTime: 'asc' },
      });
    } else if (req.user.role === 'ADMIN') {
      meetings = await prisma.zoomMeeting.findMany({
        include,
        orderBy: { startTime: 'asc' },
        take: 200,
      });
    }

    sendSuccess(res, 'Calendar meetings fetched.', { meetings });
  }),

  getPendingApprovals: asyncHandler(async (req, res) => {
    const meetings = await prisma.zoomMeeting.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        instructor: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    sendSuccess(res, 'Pending class requests fetched.', { meetings });
  }),

  approveMeeting: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const pending = await prisma.zoomMeeting.findUnique({
      where: { id },
      include: { course: { select: { id: true, title: true } } },
    });
    if (!pending) return sendError(res, 'Class request not found.', 404);
    if (pending.status !== 'PENDING_APPROVAL') {
      return sendError(res, 'This class request is not pending approval.', 400);
    }

    const isFuture = pending.startTime > new Date();

    let zoomData;
    try {
      const instructor = await prisma.user.findUnique({
        where: { id: pending.instructorId },
        select: { zoomConnected: true },
      });

      if (instructor && instructor.zoomConnected) {
        zoomData = await zoomOAuthService.createMeetingAsInstructor(pending.instructorId, {
          topic: pending.topic,
          agenda: pending.agenda,
          duration: pending.duration,
          startTime: isFuture ? pending.startTime.toISOString() : undefined,
        });
      } else {
        zoomData = await zoomApiService.createMeeting({
          topic: pending.topic,
          agenda: pending.agenda,
          duration: pending.duration,
          startTime: isFuture ? pending.startTime.toISOString() : undefined,
        });
      }
    } catch (zoomErr) {
      console.error('Zoom API error on approval:', zoomErr);
      return sendError(res, `Failed to create Zoom meeting: ${zoomErr.message}`, 502);
    }

    const meeting = await prisma.zoomMeeting.update({
      where: { id },
      data: {
        meetingId: String(zoomData.id),
        topic: zoomData.topic,
        startTime: zoomData.start_time ? new Date(zoomData.start_time) : pending.startTime,
        duration: zoomData.duration || pending.duration,
        joinUrl: zoomData.join_url,
        startUrl: zoomData.start_url,
        password: zoomData.password || null,
        status: isFuture ? 'SCHEDULED' : 'LIVE',
        rejectedNote: null,
      },
    });

    await notifyStudentsOfClass(meeting, pending.courseId, !isFuture);

    await prisma.notification.create({
      data: {
        userId: pending.instructorId,
        title: 'Class Request Approved',
        message: `Your class "${meeting.topic}" has been approved${isFuture ? ' and scheduled' : ' and is now live'}.`,
        type: 'SUCCESS',
        link: `/instructor/courses/${pending.courseId}/edit`,
      },
    });

    sendSuccess(res, 'Class request approved.', { meeting });
  }),

  rejectMeeting: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const pending = await prisma.zoomMeeting.findUnique({ where: { id } });
    if (!pending) return sendError(res, 'Class request not found.', 404);
    if (pending.status !== 'PENDING_APPROVAL') {
      return sendError(res, 'This class request is not pending approval.', 400);
    }

    const meeting = await prisma.zoomMeeting.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedNote: reason || null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: pending.instructorId,
        title: 'Class Request Rejected',
        message: reason
          ? `Your class "${pending.topic}" was rejected: ${reason}`
          : `Your class "${pending.topic}" was rejected by admin.`,
        type: 'ERROR',
        link: `/instructor/courses/${pending.courseId}/edit`,
      },
    });

    sendSuccess(res, 'Class request rejected.', { meeting });
  }),

  // ── NEW: ZOOM OAUTH FLOW CONTROLLERS ──────────────────────────────────────

  // GET /api/zoom/oauth/connect
  connectOAuth: asyncHandler(async (req, res) => {
    if (!config.zoom.oauthClientId) {
      return sendError(res, 'Zoom OAuth is not configured on this server.', 503);
    }

    const oauthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${
      config.zoom.oauthClientId
    }&redirect_uri=${encodeURIComponent(config.zoom.oauthRedirectUri)}&state=${req.user.id}`;

    sendSuccess(res, 'Authorization URL generated.', { oauthUrl });
  }),

  // GET /api/zoom/oauth/callback
  oauthCallback: asyncHandler(async (req, res) => {
    const { code, state: instructorId } = req.query;

    if (!code || !instructorId) {
      return res.redirect(`${config.clientUrl}/instructor/profile?zoom=error&message=missing_params`);
    }

    try {
      await zoomOAuthService.connectZoomAccount(instructorId, code);
      res.redirect(`${config.clientUrl}/instructor/profile?zoom=connected`);
    } catch (err) {
      console.error('[Zoom OAuth Callback Error]:', err.message);
      res.redirect(
        `${config.clientUrl}/instructor/profile?zoom=error&message=${encodeURIComponent(err.message)}`
      );
    }
  }),

  // GET /api/zoom/oauth/status
  oauthStatus: asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        zoomConnected: true,
        zoomEmail: true,
      },
    });

    sendSuccess(res, 'Connection status fetched.', {
      connected: user?.zoomConnected || false,
      email: user?.zoomEmail || null,
    });
  }),

  // DELETE /api/zoom/oauth/disconnect
  oauthDisconnect: asyncHandler(async (req, res) => {
    await zoomOAuthService.disconnectZoomAccount(req.user.id);
    sendSuccess(res, 'Zoom account disconnected.');
  }),
};

module.exports = zoomController;
