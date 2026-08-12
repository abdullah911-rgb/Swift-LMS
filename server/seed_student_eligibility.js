/**
 * ONE-TIME SCRIPT: Make test student (student@lms.com) fully eligible
 * for certificates across all enrolled courses.
 *
 * Run with: node seed_student_eligibility.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Find the student
  const student = await prisma.user.findUnique({
    where: { email: 'student@lms.com' },
    select: { id: true, name: true },
  });

  if (!student) {
    console.error('❌  student@lms.com not found in the database');
    process.exit(1);
  }
  console.log(`✅  Found student: ${student.name} (${student.id})`);

  // 2. Get all active enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id, status: { not: 'DROPPED' } },
    select: { courseId: true },
  });

  console.log(`📚  Enrolled in ${enrollments.length} course(s)`);

  for (const { courseId } of enrollments) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    });
    console.log(`\n── Processing: "${course?.title}" (${courseId})`);

    // ── A. Attendance: insert records for all ENDED/LIVE meetings ──────────
    const meetings = await prisma.zoomMeeting.findMany({
      where: { courseId, status: { in: ['ENDED', 'LIVE'] } },
      select: { id: true, startTime: true, duration: true },
    });

    console.log(`   🎥  ${meetings.length} meeting(s) found`);
    for (const meeting of meetings) {
      const joinedAt = meeting.startTime;
      const leftAt = new Date(
        new Date(meeting.startTime).getTime() + (meeting.duration || 60) * 60 * 1000
      );
      const durationMins = meeting.duration || 60;

      await prisma.attendance.upsert({
        where: { meetingId_studentId: { meetingId: meeting.id, studentId: student.id } },
        update: { joinedAt, leftAt, duration: durationMins },
        create: { meetingId: meeting.id, studentId: student.id, joinedAt, leftAt, duration: durationMins },
      });
      console.log(`      ✔  Attendance seeded for meeting ${meeting.id}`);
    }

    // ── B. Assignments: submit + grade all unsubmitted assignments ─────────
    const assignments = await prisma.assignment.findMany({
      where: { courseId, isPublished: true },
      select: { id: true, title: true },
    });

    console.log(`   📋  ${assignments.length} assignment(s) found`);
    for (const assignment of assignments) {
      const existing = await prisma.assignmentSubmission.findFirst({
        where: { assignmentId: assignment.id, studentId: student.id },
      });

      if (!existing) {
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            studentId: student.id,
            fileUrl: '/uploads/test_submission.pdf',
            fileName: 'test_submission.pdf',
            status: 'GRADED',
            grade: '90',
            feedback: 'Excellent work! (Auto-seeded for testing)',
          },
        });
        console.log(`      ✔  Submission created & graded for: "${assignment.title}"`);
      } else if (existing.status !== 'GRADED') {
        await prisma.assignmentSubmission.update({
          where: { id: existing.id },
          data: { status: 'GRADED', grade: '90', feedback: 'Excellent work! (Auto-graded for testing)' },
        });
        console.log(`      ✔  Submission graded for: "${assignment.title}"`);
      } else {
        console.log(`      ⏭  Already graded: "${assignment.title}"`);
      }
    }

    // ── C. Quiz: create a passed attempt if quiz exists ────────────────────
    const quiz = await prisma.quiz.findUnique({
      where: { courseId },
      select: { id: true, passMark: true, timePerQuestion: true },
    });

    if (quiz) {
      const existingPass = await prisma.quizAttempt.findFirst({
        where: { quizId: quiz.id, userId: student.id, passed: true, completedAt: { not: null } },
      });

      if (!existingPass) {
        const questionCount = await prisma.question.count({ where: { quizId: quiz.id } });
        const mcqMarks = 60; // full marks

        await prisma.quizAttempt.create({
          data: {
            quizId: quiz.id,
            userId: student.id,
            attemptNumber: 1,
            rawScore: questionCount,
            score: 100,
            mcqMarks,
            passed: true,
            timeTaken: questionCount * (quiz.timePerQuestion || 60),
            startedAt: new Date(Date.now() - 3600000),
            completedAt: new Date(),
          },
        });
        console.log(`   🧠  Quiz attempt (passed) created`);
      } else {
        console.log(`   🧠  Already has a passing quiz attempt`);
      }
    } else {
      console.log(`   🧠  No quiz configured — attendance bypass will apply`);
    }

    // ── D. Ensure enrollment progress is 100% ──────────────────────────────
    await prisma.enrollment.update({
      where: { studentId_courseId: { studentId: student.id, courseId } },
      data: { progress: 100 },
    });
    console.log(`   📈  Progress set to 100%`);
  }

  console.log('\n🎉  Done! Student is now fully eligible for all certificates.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
