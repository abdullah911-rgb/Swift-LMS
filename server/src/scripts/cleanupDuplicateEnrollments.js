const prisma = require('../config/db');

async function main() {
  console.log('--- Cleaning Up Duplicate Enrollments for Currently Enrolled Students ---');

  // Find all students who have multiple enrollments without a certificate
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, email: true },
  });

  for (const student of students) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: [
        { progress: 'desc' },
        { enrolledAt: 'asc' },
      ],
    });

    if (enrollments.length <= 1) continue;

    // Check certificates
    const certs = await prisma.certificate.findMany({
      where: { studentId: student.id },
      select: { courseId: true },
    });
    const certifiedCourseIds = new Set(certs.map((c) => c.courseId));

    // Filter enrollments that don't have a certificate
    const activeUncertified = enrollments.filter((e) => !certifiedCourseIds.has(e.courseId));

    if (activeUncertified.length > 1) {
      console.log(`\nStudent ${student.name} (${student.email}) has ${activeUncertified.length} concurrent active courses:`);
      activeUncertified.forEach((e, i) => {
        console.log(`  [${i + 1}] "${e.course.title}" - Progress: ${e.progress}%, Enrolled: ${e.enrolledAt}`);
      });

      // Keep the primary one (highest progress)
      const [primary, ...duplicates] = activeUncertified;
      console.log(`  => KEEPING PRIMARY: "${primary.course.title}" (Progress: ${primary.progress}%)`);

      for (const dup of duplicates) {
        console.log(`  => REMOVING DUPLICATE: "${dup.course.title}" (Enrollment ID: ${dup.id})`);
        
        // Delete lesson progress for duplicate enrollment first
        await prisma.lessonProgress.deleteMany({
          where: { enrollmentId: dup.id },
        });

        // Delete enrollment
        await prisma.enrollment.delete({
          where: { id: dup.id },
        });
      }
    }
  }

  console.log('\nCleanup completed! Verifying database state:');
  const allEnrollments = await prisma.enrollment.findMany({
    include: {
      student: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  });

  const remainingStudentMap = {};
  for (const e of allEnrollments) {
    remainingStudentMap[e.studentId] = remainingStudentMap[e.studentId] || [];
    remainingStudentMap[e.studentId].push(`${e.course.title} (${e.status}, ${e.progress}%)`);
  }

  for (const [sId, courseList] of Object.entries(remainingStudentMap)) {
    const sName = allEnrollments.find((e) => e.studentId === sId)?.student?.name;
    console.log(`- ${sName}: [${courseList.join(', ')}]`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
