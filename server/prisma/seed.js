const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Seed Admin ──────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@lms.com',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // ── Seed Instructor ─────────────────────────────────────────────────────
  const instructorPassword = await bcrypt.hash('Instructor@123', 12);
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@lms.com' },
    update: {},
    create: {
      name: 'John Smith',
      email: 'instructor@lms.com',
      password: instructorPassword,
      role: 'INSTRUCTOR',
      bio: 'Senior Software Engineer with 10+ years of experience in web development.',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Instructor created: ${instructor.email}`);

  // ── Seed Student ────────────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('Student@123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@lms.com' },
    update: {},
    create: {
      name: 'Jane Doe',
      email: 'student@lms.com',
      password: studentPassword,
      role: 'STUDENT',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Student created: ${student.email}`);

  // ── Seed Categories ─────────────────────────────────────────────────────
  const categories = [
    { name: 'Web Development', slug: 'web-development', description: 'Frontend and backend web technologies', icon: '🌐' },
    { name: 'Mobile Development', slug: 'mobile-development', description: 'iOS and Android app development', icon: '📱' },
    { name: 'Data Science', slug: 'data-science', description: 'Data analysis, ML and AI', icon: '📊' },
    { name: 'UI/UX Design', slug: 'ui-ux-design', description: 'User interface and experience design', icon: '🎨' },
    { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Network and application security', icon: '🔒' },
    { name: 'Cloud Computing', slug: 'cloud-computing', description: 'AWS, Azure and GCP', icon: '☁️' },
    { name: 'DevOps', slug: 'devops', description: 'CI/CD, Docker and Kubernetes', icon: '⚙️' },
    { name: 'Digital Marketing', slug: 'digital-marketing', description: 'SEO, SEM and social media', icon: '📣' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories seeded`);

  // ── Seed Sample Courses ─────────────────────────────────────────────────
  const webDevCategory = await prisma.category.findUnique({ where: { slug: 'web-development' } });
  const dsCategory = await prisma.category.findUnique({ where: { slug: 'data-science' } });

  const course1 = await prisma.course.upsert({
    where: { slug: 'complete-react-developer-2024' },
    update: {},
    create: {
      title: 'Complete React Developer 2024',
      slug: 'complete-react-developer-2024',
      description: 'Master React from beginner to advanced. Build real-world projects with hooks, context, Redux, and more.',
      shortDescription: 'Build modern React applications from scratch to production.',
      categoryId: webDevCategory.id,
      instructorId: instructor.id,
      status: 'PUBLISHED',
      level: 'INTERMEDIATE',
      isFree: false,
      price: 49.99,
      duration: 1200,
      totalLessons: 80,
      language: 'English',
      certificate: true,
      learningOutcomes: [
        'Build production-grade React applications',
        'Master React Hooks and Context API',
        'State management with Redux Toolkit',
        'Testing with React Testing Library',
        'Deploy React apps to production',
      ],
      prerequisites: [
        'Basic JavaScript knowledge',
        'HTML & CSS fundamentals',
        'Understanding of web browsers',
      ],
    },
  });

  const course2 = await prisma.course.upsert({
    where: { slug: 'python-for-data-science-beginners' },
    update: {},
    create: {
      title: 'Python for Data Science Beginners',
      slug: 'python-for-data-science-beginners',
      description: 'Start your data science journey with Python. Learn pandas, numpy, matplotlib and machine learning basics.',
      shortDescription: 'Learn Python, data analysis, and machine learning from scratch.',
      categoryId: dsCategory.id,
      instructorId: instructor.id,
      status: 'PUBLISHED',
      level: 'BEGINNER',
      isFree: true,
      price: 0,
      duration: 900,
      totalLessons: 60,
      language: 'English',
      certificate: true,
      learningOutcomes: [
        'Python programming fundamentals',
        'Data manipulation with Pandas',
        'Data visualization with Matplotlib',
        'Introduction to Machine Learning',
        'Real-world data projects',
      ],
      prerequisites: [
        'No prior programming experience needed',
        'Basic math knowledge',
      ],
    },
  });

  // ── Seed Modules for Course 1 ───────────────────────────────────────────
  const modules = [
    { title: 'Getting Started with React', courseId: course1.id, order: 1, isPublished: true },
    { title: 'React Hooks Deep Dive', courseId: course1.id, order: 2, isPublished: true },
    { title: 'State Management', courseId: course1.id, order: 3, isPublished: true },
  ];

  for (const mod of modules) {
    await prisma.module.create({ data: mod }).catch(() => {});
  }
  console.log(`✅ Modules seeded for course 1`);

  // ── Seed Enrollment ─────────────────────────────────────────────────────
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course2.id } },
    update: {},
    create: {
      studentId: student.id,
      courseId: course2.id,
      status: 'ACTIVE',
      progress: 25,
    },
  });
  console.log(`✅ Sample enrollment seeded`);

  // ── Seed Announcements ──────────────────────────────────────────────────
  await prisma.announcement.create({
    data: {
      title: 'Welcome to the LMS Platform!',
      body: 'We are excited to launch our new learning management system. Start exploring courses and begin your learning journey today!',
      authorId: admin.id,
      targetRole: 'ALL',
      isPublished: true,
    },
  });
  console.log(`✅ Announcement seeded`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Admin:      admin@lms.com / Admin@123');
  console.log('   Instructor: instructor@lms.com / Instructor@123');
  console.log('   Student:    student@lms.com / Student@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
