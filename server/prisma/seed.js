const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');


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
    { name: 'Safety Courses', slug: 'safety-courses', description: 'Occupational health and safety training programs', icon: '⚠️' },
    { name: 'Finance & Accounting', slug: 'finance-accounting', description: 'Financial management and accounting courses', icon: '�' },
    { name: 'Business & Management', slug: 'business-management', description: 'Business administration and management skills', icon: '�' },
    { name: 'Graphic Design & Media', slug: 'graphic-design-media', description: 'Design and multimedia content creation', icon: '🎨' },
    { name: 'Digital Marketing', slug: 'digital-marketing', description: 'Online marketing and social media strategies', icon: '�' },
    { name: 'Computer & IT', slug: 'computer-it', description: 'Computer fundamentals and IT skills', icon: '💻' },
    { name: 'English Language', slug: 'english-language', description: 'English language and communication skills', icon: '🗣️' },
    { name: 'Website & Web Development', slug: 'website-web-development', description: 'Web design and development courses', icon: '🌐' },
    { name: 'CSS Interview Training', slug: 'css-interview-training', description: 'CSS exam preparation and interview skills', icon: '�' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories seeded`);

  // ── Seed Categories for Courses ───────────────────────────────────────────
  const safetyCategory = await prisma.category.findUnique({ where: { slug: 'safety-courses' } });
  const financeCategory = await prisma.category.findUnique({ where: { slug: 'finance-accounting' } });
  const businessCategory = await prisma.category.findUnique({ where: { slug: 'business-management' } });
  const graphicDesignCategory = await prisma.category.findUnique({ where: { slug: 'graphic-design-media' } });
  const digitalMarketingCategory = await prisma.category.findUnique({ where: { slug: 'digital-marketing' } });
  const computerITCategory = await prisma.category.findUnique({ where: { slug: 'computer-it' } });
  const englishCategory = await prisma.category.findUnique({ where: { slug: 'english-language' } });
  const webDevCategory = await prisma.category.findUnique({ where: { slug: 'website-web-development' } });
  const cssCategory = await prisma.category.findUnique({ where: { slug: 'css-interview-training' } });

  // ── Seed All 15 Courses ───────────────────────────────────────────────────
  const courses = [
    {
      title: 'NEBOSH International Safety Course',
      slug: 'nebosh-international-safety-course',
      thumbnail: '/uploads/nebosh.jfif',
      description: 'Comprehensive health and safety management training covering international standards and best practices.\n\nCourse Contents:\n• Health & Safety Management System\n• Risk Assessment\n• Hazard Identification\n• Workplace Safety\n• Incident Investigation\n• Occupational Health & Safety\n• Fire Safety\n• Emergency Management',
      shortDescription: 'International health and safety management certification course',
      categoryId: safetyCategory.id,
      level: 'INTERMEDIATE',
      isFree: false,
      price: 160000,
      durationInMonths: 2,
      learningOutcomes: [
        'Master international health and safety standards',
        'Conduct comprehensive risk assessments',
        'Implement effective safety management systems',
        'Handle workplace incidents and investigations',
        'Apply occupational health principles',
        'Manage fire safety and emergency procedures',
      ],
      prerequisites: ['Basic understanding of workplace safety', 'Good communication skills'],
    },
    {
      title: 'IOSH Safety Training',
      slug: 'iosh-safety-training',
      thumbnail: '/uploads/iosh-safety-training.jfif',
      description: 'Institution of Occupational Safety and Health (IOSH) accredited training program covering essential health and safety principles for the workplace.\n\nCourse Contents:\n• Introduction to Health & Safety\n• Workplace Hazards\n• Risk Control\n• Accident Prevention\n• Safety Responsibilities',
      shortDescription: 'IOSH accredited workplace safety training',
      categoryId: safetyCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 30000,
      duration: 1800,
      learningOutcomes: [
        'Understand fundamental health and safety principles',
        'Identify and control workplace hazards',
        'Implement accident prevention measures',
        'Fulfill safety responsibilities effectively',
      ],
      prerequisites: ['No prior safety knowledge required'],
    },
    {
      title: 'OSHA Safety Training',
      slug: 'osha-safety-training',
      thumbnail: '/uploads/iosh-safety-training.jfif',
      description: 'Workers Safety and Health Administration (OSHA) compliant training covering workplace safety standards, hazard control, and personal protective equipment.\n\nCourse Contents:\n• OSHA Standards\n• Workplace Safety Rules\n• Hazard Control\n• Personal Protective Equipment (PPE)\n• Construction Safety\n• Industrial Safety',
      shortDescription: 'OSHA standards and workplace safety training',
      categoryId: safetyCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 30000,
      duration: 1800,
      learningOutcomes: [
        'Comply with OSHA standards and regulations',
        'Apply workplace safety rules effectively',
        'Control hazards in various work environments',
        'Properly use personal protective equipment',
        'Ensure construction and industrial safety',
      ],
      prerequisites: ['Basic workplace awareness'],
    },
    {
      title: 'Fire Safety & First Aid Training',
      slug: 'fire-safety-first-aid-training',
      thumbnail: '/uploads/confined-space-safety-work-at-height.jfif',
      description: 'Essential fire safety and first aid training covering fire prevention, extinguisher handling, emergency response, basic first aid, and CPR awareness.\n\nCourse Contents:\n• Fire Prevention\n• Fire Extinguisher Handling\n• Emergency Response\n• Basic First Aid\n• CPR Awareness',
      shortDescription: 'Fire safety and basic first aid certification',
      categoryId: safetyCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 5000,
      duration: 600,
      learningOutcomes: [
        'Prevent fire incidents effectively',
        'Handle fire extinguishers safely',
        'Respond appropriately to emergencies',
        'Provide basic first aid assistance',
        'Perform CPR when needed',
      ],
      prerequisites: ['No prior experience required'],
    },
    {
      title: 'HSE Officer Training',
      slug: 'hse-officer-training',
      thumbnail: '/uploads/iosh-safety-training.jfif',
      description: 'Comprehensive Health, Safety, and Environment (HSE) officer training covering safety inspection, risk assessment, documentation, toolbox talks, and incident reporting.\n\nCourse Contents:\n• HSE Officer Responsibilities\n• Safety Inspection\n• Risk Assessment\n• Safety Documentation\n• Toolbox Talks\n• Incident Reporting',
      shortDescription: 'Professional HSE officer certification course',
      categoryId: safetyCategory.id,
      level: 'INTERMEDIATE',
      isFree: false,
      price: 15000,
      durationInMonths: 2,
      learningOutcomes: [
        'Execute HSE officer responsibilities professionally',
        'Conduct thorough safety inspections',
        'Perform comprehensive risk assessments',
        'Maintain proper safety documentation',
        'Deliver effective toolbox talks',
        'Report incidents accurately and timely',
      ],
      prerequisites: ['Basic safety knowledge', 'Good communication skills'],
    },
    {
      title: 'Risk Assessment & Permit To Work Training',
      slug: 'risk-assessment-permit-to-work-training',
      thumbnail: '/uploads/confined-space-safety-work-at-height.jfif',
      description: 'Specialized training in risk identification, evaluation, control measures, and permit to work systems including hot work and confined space permits.\n\nCourse Contents:\n• Risk Identification\n• Risk Evaluation\n• Control Measures\n• Permit To Work System\n• Hot Work Permit\n• Confined Space Permit',
      shortDescription: 'Risk assessment and permit to work systems training',
      categoryId: safetyCategory.id,
      level: 'INTERMEDIATE',
      isFree: false,
      price: 5000,
      duration: 600,
      learningOutcomes: [
        'Identify workplace risks systematically',
        'Evaluate risk levels accurately',
        'Implement effective control measures',
        'Manage permit to work systems',
        'Handle hot work permits safely',
        'Manage confined space entry permits',
      ],
      prerequisites: ['Basic workplace safety knowledge'],
    },
    {
      title: 'Confined Space Safety & Work At Height Training',
      slug: 'confined-space-safety-work-at-height-training',
      thumbnail: '/uploads/confined-space-safety-work-at-height.jfif',
      description: 'Specialized safety training for confined space entry procedures, rescue planning, work at height safety, and fall protection systems.\n\nCourse Contents:\n• Confined Space Hazards\n• Entry Procedures\n• Rescue Planning\n• Work At Height Safety\n• Fall Protection Systems',
      shortDescription: 'Confined space and work at height safety certification',
      categoryId: safetyCategory.id,
      level: 'INTERMEDIATE',
      isFree: false,
      price: 5000,
      duration: 600,
      learningOutcomes: [
        'Recognize confined space hazards',
        'Follow proper entry procedures',
        'Plan effective rescue operations',
        'Work safely at heights',
        'Implement fall protection systems',
      ],
      prerequisites: ['Basic safety awareness'],
    },
    {
      title: 'Finance & Accounting Professional Course',
      slug: 'finance-accounting-professional-course',
      thumbnail: '/uploads/finance-accounting-professional.jfif',
      description: 'Comprehensive finance and accounting training covering basic accounting, financial management, supplier management, QuickBooks, payroll, taxation, and financial analysis.\n\nCourse Contents:\n• Basic Accounting\n• Financial Management\n• Supplier Management\n• QuickBooks\n• Payroll Management\n• Taxation Basics\n• Financial Analysis',
      shortDescription: 'Professional finance and accounting certification',
      categoryId: financeCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 10000,
      durationInMonths: 1,
      learningOutcomes: [
        'Master basic accounting principles',
        'Manage finances effectively',
        'Handle supplier relationships',
        'Use QuickBooks proficiently',
        'Manage payroll operations',
        'Understand taxation basics',
        'Perform financial analysis',
      ],
      prerequisites: ['Basic math skills', 'Computer literacy'],
    },
    {
      title: 'Business & Management Training',
      slug: 'business-management-training',
      thumbnail: '/uploads/business-management-training.jfif',
      description: 'Comprehensive business and management training covering project management, HR management, supply chain, operations, leadership, customer service, and business communication.\n\nCourse Contents:\n• Project Management\n• HR Management\n• Supply Chain Management\n• Operations Management\n• Leadership Skills\n• Customer Service\n• Business Communication',
      shortDescription: 'Business administration and management skills course',
      categoryId: businessCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 15000,
      duration: 1800,
      learningOutcomes: [
        'Manage projects effectively',
        'Handle HR responsibilities',
        'Optimize supply chain operations',
        'Improve operational efficiency',
        'Develop leadership skills',
        'Deliver excellent customer service',
        'Communicate professionally in business settings',
      ],
      prerequisites: ['Basic business awareness', 'Good communication skills'],
    },
    {
      title: 'Graphic Design & Media Course',
      slug: 'graphic-design-media-course',
      thumbnail: '/uploads/graphic-design-media.jfif',
      description: 'Complete graphic design and media training covering Adobe Photoshop, Canva design, graphic design basics, video editing, and social media design.\n\nCourse Contents:\n• Adobe Photoshop\n• Canva Design\n• Graphic Designing Basics\n• Video Editing\n• Social Media Design',
      shortDescription: 'Graphic design and multimedia content creation course',
      categoryId: graphicDesignCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 15000,
      durationInMonths: 1,
      learningOutcomes: [
        'Use Adobe Photoshop professionally',
        'Create designs with Canva',
        'Apply graphic design principles',
        'Edit videos effectively',
        'Design for social media platforms',
      ],
      prerequisites: ['Computer literacy', 'Creative mindset'],
    },
    {
      title: 'Digital Marketing Professional Course',
      slug: 'digital-marketing-professional-course',
      thumbnail: '/uploads/digital-marketing-professional.jfif',
      description: 'Comprehensive digital marketing training covering Google Ads, Facebook Ads, Instagram Ads, TikTok marketing, YouTube marketing, email marketing, content marketing, and affiliate marketing.\n\nCourse Contents:\n• Google Ads\n• Facebook Ads\n• Instagram Ads\n• TikTok Marketing\n• YouTube Marketing\n• Email Marketing\n• Content Marketing\n• Affiliate Marketing',
      shortDescription: 'Professional digital marketing certification course',
      categoryId: digitalMarketingCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 15000,
      durationInMonths: 1,
      learningOutcomes: [
        'Run effective Google Ads campaigns',
        'Master Facebook and Instagram advertising',
        'Leverage TikTok for marketing',
        'Utilize YouTube marketing strategies',
        'Execute email marketing campaigns',
        'Create compelling content marketing',
        'Implement affiliate marketing programs',
      ],
      prerequisites: ['Basic internet knowledge', 'Social media awareness'],
    },
    {
      title: 'CSS Interview Training (Weekend Program)',
      slug: 'css-interview-training-weekend-program',
      thumbnail: '/uploads/css-interview-training.jfif',
      description: 'Comprehensive CSS exam preparation covering personality development, communication skills, confidence building, current affairs, Pakistan affairs, general knowledge, international affairs, psychological preparation, mock interviews, and expert guidance.\n\nCourse Contents:\n• Introduction to CSS Interview\n• Personality Development\n• Communication Skills\n• Confidence Building\n• Current Affairs\n• Pakistan Affairs\n• General Knowledge\n• International Affairs\n• Psychological Preparation\n• Mock Interviews\n• Expert Guidance',
      shortDescription: 'CSS exam preparation and interview skills training',
      categoryId: cssCategory.id,
      level: 'INTERMEDIATE',
      isFree: false,
      price: 10000,
      durationInMonths: 2,
      learningOutcomes: [
        'Understand CSS interview process',
        'Develop strong personality traits',
        'Improve communication skills',
        'Build confidence for interviews',
        'Stay updated on current affairs',
        'Master Pakistan and international affairs',
        'Enhance general knowledge',
        'Prepare psychologically for interviews',
        'Practice with mock interviews',
        'Receive expert guidance and feedback',
      ],
      prerequisites: ['Bachelor\'s degree', 'Good English comprehension'],
    },
    {
      title: 'Basic Computer & MS Office Course',
      slug: 'basic-computer-ms-office-course',
      thumbnail: '/uploads/basic-computer-ms-office.jfif',
      description: 'Fundamental computer training covering basic computer skills, Windows operating system, MS Word, MS Excel, MS PowerPoint, and internet & email skills.\n\nCourse Contents:\n• Basic Computer Skills\n• Windows Operating System\n• MS Word\n• MS Excel\n• MS PowerPoint\n• Internet & Email Skills',
      shortDescription: 'Basic computer literacy and MS Office training',
      categoryId: computerITCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 10000,
      durationInMonths: 2,
      learningOutcomes: [
        'Use computers confidently',
        'Navigate Windows operating system',
        'Create documents in MS Word',
        'Manage spreadsheets in MS Excel',
        'Design presentations in MS PowerPoint',
        'Use internet and email effectively',
      ],
      prerequisites: ['No prior computer experience required'],
    },
    {
      title: 'English Speaking Course',
      slug: 'english-speaking-course',
      thumbnail: '/uploads/english-speaking-course.jfif',
      description: 'Comprehensive English language training covering basic English grammar, speaking practice, vocabulary development, communication skills, and professional English.\n\nCourse Contents:\n• Basic English Grammar\n• Speaking Practice\n• Vocabulary Development\n• Communication Skills\n• Professional English',
      shortDescription: 'English language and communication skills course',
      categoryId: englishCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 15000,
      durationInMonths: 2,
      learningOutcomes: [
        'Understand English grammar fundamentals',
        'Speak English fluently',
        'Build vocabulary effectively',
        'Communicate confidently',
        'Use professional English in workplace',
      ],
      prerequisites: ['Basic English understanding'],
    },
    {
      title: 'Website Design Course',
      slug: 'website-design-course',
      thumbnail: '/uploads/website-design-course.jfif',
      description: 'Complete website design training covering HTML, CSS, JavaScript basics, responsive website design, website layout design, hosting & domain basics, and a complete website project.\n\nCourse Contents:\n• Introduction to Web Design\n• HTML\n• CSS\n• JavaScript Basics\n• Responsive Website Design\n• Website Layout Design\n• Hosting & Domain Basics\n• Complete Website Project',
      shortDescription: 'Web design and development fundamentals course',
      categoryId: webDevCategory.id,
      level: 'BEGINNER',
      isFree: false,
      price: 15000,
      durationInMonths: 2,
      learningOutcomes: [
        'Understand web design principles',
        'Code with HTML effectively',
        'Style websites with CSS',
        'Add interactivity with JavaScript',
        'Create responsive designs',
        'Design professional website layouts',
        'Manage hosting and domains',
        'Build complete website projects',
      ],
      prerequisites: ['Basic computer skills', 'Internet familiarity'],
    },
  ];

  for (const courseData of courses) {
    await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: { thumbnail: courseData.thumbnail ?? null },
      create: {
        ...courseData,
        instructorId: instructor.id,
        status: 'PUBLISHED',
        language: 'English',
        certificate: true,
      },
    });
  }
  console.log(`✅ ${courses.length} courses seeded`);

  // ── Seed Enrollment ─────────────────────────────────────────────────────
  const firstCourse = await prisma.course.findFirst({ where: { slug: 'nebosh-international-safety-course' } });
  if (firstCourse) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: firstCourse.id } },
      update: {},
      create: {
        studentId: student.id,
        courseId: firstCourse.id,
        status: 'ACTIVE',
        progress: 25,
      },
    });
    console.log(`✅ Sample enrollment seeded`);
  }

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
