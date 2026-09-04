const prisma = require('../config/db');

/**
 * Checks if a student is eligible to enroll in a new course (or submit payment for it).
 * 
 * Business Rule:
 * - A student can only enroll in ONE course at a time to prevent class timing clashes.
 * - A student cannot enroll in another course until their current course is completed
 *   AND a certificate has been officially issued for it.
 * - If a student has any enrollment for which no certificate exists in the database,
 *   they cannot enroll in any other course.
 *
 * @param {string} studentId - The student's user ID
 * @param {string} [targetCourseId] - The course they want to enroll in
 * @returns {Promise<{ allowed: boolean, reason?: string, activeCourse?: object, alreadyEnrolled?: boolean }>}
 */
async function checkStudentCourseEligibility(studentId, targetCourseId = null) {
  // 1. Fetch all enrollments for this student
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: {
        select: { id: true, title: true, slug: true, status: true },
      },
    },
  });

  if (!enrollments || enrollments.length === 0) {
    return { allowed: true };
  }

  // Check if already enrolled in the target course
  if (targetCourseId) {
    const isAlreadyEnrolled = enrollments.some((e) => e.courseId === targetCourseId);
    if (isAlreadyEnrolled) {
      return {
        allowed: false,
        alreadyEnrolled: true,
        reason: 'You are already enrolled in this course.',
      };
    }
  }

  // 2. Fetch all certificates earned by this student
  const certificates = await prisma.certificate.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const certifiedCourseIds = new Set(certificates.map((c) => c.courseId));

  // 3. Find any enrollment that has NOT been certified yet
  // Even if status is COMPLETED, if no certificate is issued, they cannot take another course
  const uncertifiedEnrollment = enrollments.find(
    (e) => !certifiedCourseIds.has(e.courseId)
  );

  if (uncertifiedEnrollment) {
    const courseTitle = uncertifiedEnrollment.course?.title || 'an active course';
    return {
      allowed: false,
      alreadyEnrolled: false,
      activeCourse: uncertifiedEnrollment.course,
      reason: `You are currently enrolled in "${courseTitle}". To prevent class timing clashes, students can only enroll in one course at a time. You can enroll in another course once you complete your current course and your certificate is issued.`,
    };
  }

  return { allowed: true };
}

module.exports = {
  checkStudentCourseEligibility,
};
