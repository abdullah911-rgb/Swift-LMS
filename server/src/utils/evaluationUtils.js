const prisma = require('../config/db');

/**
 * Calculate attendance marks (out of 20) for a student in a course.
 * Attendance % is based on Zoom meetings attended vs total ENDED/LIVE meetings.
 */
async function calculateAttendanceMarks(studentId, courseId) {
  const meetings = await prisma.zoomMeeting.findMany({
    where: { courseId, status: { in: ['ENDED', 'LIVE'] } },
    select: { id: true },
  });

  const totalMeetings = meetings.length;
  if (totalMeetings === 0) {
    return { totalMeetings: 0, attendedMeetings: 0, percentage: 100, marks20: 20 };
  }

  const meetingIds = meetings.map((m) => m.id);
  const attendedMeetings = await prisma.attendance.count({
    where: { studentId, meetingId: { in: meetingIds } },
  });

  const percentage = (attendedMeetings / totalMeetings) * 100;
  const marks20 = (percentage / 100) * 20;

  return {
    totalMeetings,
    attendedMeetings,
    percentage: Math.round(percentage * 100) / 100,
    marks20: Math.round(marks20 * 100) / 100,
  };
}

/**
 * Calculate assignment marks (out of 20) for a student in a course.
 * All published assignments must be submitted AND graded.
 * Marks = average numeric grade, scaled to 20.
 */
async function calculateAssignmentMarks(studentId, courseId) {
  const allAssignments = await prisma.assignment.findMany({
    where: { courseId, isPublished: true },
    select: { id: true },
  });

  const total = allAssignments.length;
  if (total === 0) {
    return { total: 0, submitted: 0, graded: 0, allSubmitted: true, allGraded: true, marks20: 20 };
  }

  const assignmentIds = allAssignments.map((a) => a.id);

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: { in: assignmentIds }, studentId },
    select: { id: true, status: true, grade: true },
  });

  const submitted = submissions.length;
  const gradedSubmissions = submissions.filter((s) => s.status === 'GRADED');
  const graded = gradedSubmissions.length;

  const allSubmitted = submitted >= total;
  const allGraded = graded >= total;

  // Calculate marks from numeric grades (always numeric strings per spec)
  let marks20 = 0;
  if (graded > 0) {
    const grades = gradedSubmissions.map((s) => {
      const n = parseFloat(s.grade);
      return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
    });
    const avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
    marks20 = (avgGrade / 100) * 20;
  }

  return {
    total,
    submitted,
    graded,
    allSubmitted,
    allGraded,
    marks20: Math.round(marks20 * 100) / 100,
  };
}

/**
 * Get the best completed quiz attempt for a student.
 * Returns { passed, mcqMarks, percentage } or null if never attempted.
 */
async function getBestQuizAttempt(studentId, courseId) {
  const quiz = await prisma.quiz.findUnique({ where: { courseId } });
  if (!quiz) return null;

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id, userId: studentId, completedAt: { not: null } },
    orderBy: { score: 'desc' },
    take: 1,
  });

  if (attempts.length === 0) return null;
  const best = attempts[0];
  return {
    quizId: quiz.id,
    passed: best.passed,
    mcqMarks: best.mcqMarks,
    percentage: best.score,
    passMark: quiz.passMark,
    attemptNumber: best.attemptNumber,
  };
}

/**
 * Compute the full final score and certificate eligibility for a student.
 * Returns a comprehensive breakdown object.
 */
async function computeFinalScore(studentId, courseId) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });

  const [attendanceData, assignmentData, quizData] = await Promise.all([
    calculateAttendanceMarks(studentId, courseId),
    calculateAssignmentMarks(studentId, courseId),
    getBestQuizAttempt(studentId, courseId),
  ]);

  const attendanceMarks = attendanceData.marks20;
  const assignmentMarks = assignmentData.marks20;
  const mcqMarks = quizData ? (quizData.mcqMarks ?? 0) : 60;
  const finalMarks = Math.round((attendanceMarks + assignmentMarks + mcqMarks) * 100) / 100;

  // Eligibility checks
  const attendanceOk = attendanceData.percentage >= 80;
  const assignmentSubmittedOk = assignmentData.allSubmitted;
  const assignmentGradedOk = assignmentData.allGraded;
  const quizPassedOk = quizData === null || quizData.passed === true;
  const finalMarksOk = finalMarks >= 60;

  const dynamicEligible = attendanceOk && assignmentSubmittedOk && assignmentGradedOk && quizPassedOk && finalMarksOk;

  let eligible = dynamicEligible;
  let reason = null;

  // Handle admin override
  if (enrollment?.certificateEligible === true) {
    // Admin explicitly granted certificate eligibility
    eligible = true;
  } else if (enrollment?.certificateEligible === false) {
    // Admin explicitly revoked certificate eligibility
    eligible = false;
    reason = 'Certificate eligibility has been placed on hold by the administrator.';
  } else if (!eligible) {
    if (!attendanceOk) {
      reason = `Attendance too low: ${attendanceData.percentage.toFixed(1)}% (minimum 80% required).`;
    } else if (!assignmentSubmittedOk) {
      reason = `Not all assignments submitted: ${assignmentData.submitted}/${assignmentData.total} submitted.`;
    } else if (!assignmentGradedOk) {
      reason = `Not all assignments graded: ${assignmentData.graded}/${assignmentData.total} graded.`;
    } else if (!quizPassedOk) {
      reason = quizData
        ? `Final quiz not passed: ${quizData.percentage.toFixed(1)}% (minimum ${quizData.passMark}% required).`
        : 'Final quiz not attempted.';
    } else if (!finalMarksOk) {
      reason = `Overall marks too low: ${finalMarks}/100 (minimum 60 required).`;
    }
  }

  return {
    eligible,
    reason,
    breakdown: {
      attendanceMarks: Math.round(attendanceMarks * 100) / 100,
      assignmentMarks: Math.round(assignmentMarks * 100) / 100,
      mcqMarks: Math.round(mcqMarks * 100) / 100,
      finalMarks,
      attendancePercentage: attendanceData.percentage,
      totalMeetings: attendanceData.totalMeetings,
      attendedMeetings: attendanceData.attendedMeetings,
      assignmentsTotal: assignmentData.total,
      assignmentsSubmitted: assignmentData.submitted,
      assignmentsGraded: assignmentData.graded,
      quizPassed: quizData?.passed ?? false,
      quizPercentage: quizData?.percentage ?? 0,
    },
  };
}


/**
 * Issue (or update) a certificate with full marks breakdown.
 */
async function issueCertificateWithMarks(studentId, courseId, breakdown) {
  const existing = await prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });

  const marksData = {
    attendanceMarks: breakdown.attendanceMarks,
    assignmentMarks: breakdown.assignmentMarks,
    mcqMarks: breakdown.mcqMarks,
    finalMarks: breakdown.finalMarks,
  };

  if (existing) {
    // Update marks if already issued
    return prisma.certificate.update({
      where: { id: existing.id },
      data: marksData,
    });
  }

  // Generate unique certificate ID
  const year = new Date().getFullYear();
  const prefix = `SST-${year}-`;
  const last = await prisma.certificate.findFirst({
    where: { certificateId: { startsWith: prefix } },
    orderBy: { certificateId: 'desc' },
    select: { certificateId: true },
  });

  let next = 1;
  if (last?.certificateId) {
    const parts = last.certificateId.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) next = num + 1;
  }

  const cert = await prisma.certificate.create({
    data: { studentId, courseId, certificateId, ...marksData },
  });

  // Mark student enrollment as COMPLETED
  await prisma.enrollment.updateMany({
    where: { studentId, courseId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      progress: 100,
    },
  }).catch(() => {});

  return cert;
}

module.exports = {
  calculateAttendanceMarks,
  calculateAssignmentMarks,
  getBestQuizAttempt,
  computeFinalScore,
  issueCertificateWithMarks,
};
