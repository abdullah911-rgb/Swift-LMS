const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking courses in the database...');

  const allCourses = await prisma.course.findMany({
    select: { id: true, title: true, slug: true },
  });

  console.log('Available courses:');
  allCourses.forEach(c => console.log(` - [${c.id}] ${c.title} (${c.slug})`));

  // Find target courses
  const fireSafetyCourse = allCourses.find(c =>
    c.title.toLowerCase().includes('fire safety') ||
    c.slug.toLowerCase().includes('fire-safety')
  );

  const riskAssessmentCourse = allCourses.find(c =>
    c.title.toLowerCase().includes('risk assessment') ||
    c.slug.toLowerCase().includes('risk-assessment')
  );

  const confinedSpaceCourse = allCourses.find(c =>
    c.title.toLowerCase().includes('confined space') ||
    c.slug.toLowerCase().includes('confined-space')
  );

  console.log('\nTarget courses matched:');
  console.log('1. Fire Safety & First Aid Training:', fireSafetyCourse ? fireSafetyCourse.title : 'NOT FOUND');
  console.log('2. Risk Assessment & Permit To Work Training:', riskAssessmentCourse ? riskAssessmentCourse.title : 'NOT FOUND');
  console.log('3. Confined Space Safety & Work At Height Training:', confinedSpaceCourse ? confinedSpaceCourse.title : 'NOT FOUND');

  if (!fireSafetyCourse || !riskAssessmentCourse || !confinedSpaceCourse) {
    console.error('⚠️ Could not match all 3 courses directly, check titles above.');
  }

  // Common password for test students
  const passwordHash = await bcrypt.hash('Student@123', 12);

  const studentsData = [
    {
      name: 'Abdullah',
      email: 'abdullah@lms.com',
      password: passwordHash,
      role: 'STUDENT',
      isVerified: true,
      isActive: true,
      courses: [fireSafetyCourse].filter(Boolean),
    },
    {
      name: 'Ali',
      email: 'ali@lms.com',
      password: passwordHash,
      role: 'STUDENT',
      isVerified: true,
      isActive: true,
      courses: [fireSafetyCourse, riskAssessmentCourse].filter(Boolean),
    },
    {
      name: 'Usman',
      email: 'usman@lms.com',
      password: passwordHash,
      role: 'STUDENT',
      isVerified: true,
      isActive: true,
      courses: [fireSafetyCourse, riskAssessmentCourse, confinedSpaceCourse].filter(Boolean),
    },
  ];

  console.log('\n👤 Creating/Updating test student accounts & enrollments:');

  for (const s of studentsData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        password: s.password,
        role: 'STUDENT',
        isVerified: true,
        isActive: true,
      },
      create: {
        name: s.name,
        email: s.email,
        password: s.password,
        role: 'STUDENT',
        isVerified: true,
        isActive: true,
      },
    });

    console.log(`\n✅ Student: ${user.name} (${user.email}) [ID: ${user.id}]`);

    for (const course of s.courses) {
      const enrollment = await prisma.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: user.id,
            courseId: course.id,
          },
        },
        update: {
          status: 'ACTIVE',
        },
        create: {
          studentId: user.id,
          courseId: course.id,
          status: 'ACTIVE',
          enrolledAt: new Date(),
          progress: 0,
        },
      });
      console.log(`   📚 Enrolled in: "${course.title}" (Status: ${enrollment.status})`);
    }
  }

  console.log('\n🎉 Done creating students and enrollments!');
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
