const prisma = require('./src/config/db');

const mappings = [
  { keywords: ['nebosh', 'safety officer'], file: '/uploads/nebosh.jfif' },
  { keywords: ['iosh'], file: '/uploads/iosh-safety-training.jfif' },
  { keywords: ['confined space', 'height'], file: '/uploads/confined-space-safety-work-at-height.jfif' },
  { keywords: ['basic computer', 'ms office'], file: '/uploads/basic-computer-ms-office.jfif' },
  { keywords: ['digital marketing'], file: '/uploads/digital-marketing-professional.jfif' },
  { keywords: ['graphic design', 'media'], file: '/uploads/graphic-design-media.jfif' },
  { keywords: ['english speaking', 'english language'], file: '/uploads/english-speaking-course.jfif' },
  { keywords: ['business', 'management'], file: '/uploads/business-management-training.jfif' },
  { keywords: ['css interview', 'css preparation'], file: '/uploads/css-interview-training.jfif' },
  { keywords: ['finance', 'accounting'], file: '/uploads/finance-accounting-professional.jfif' },
  { keywords: ['website design', 'web design', 'web dev', 'web development'], file: '/uploads/website-design-course.jfif' }
];

async function main() {
  console.log('Fetching all courses from database...');
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, status: true }
  });

  console.log(`Found ${courses.length} courses. Updating thumbnails...`);

  let updatedCount = 0;
  for (const course of courses) {
    const titleLower = course.title.toLowerCase();
    const match = mappings.find(m => 
      m.keywords.some(k => titleLower.includes(k))
    );

    if (match) {
      console.log(`Updating "${course.title}" thumbnail to ${match.file}`);
      await prisma.course.update({
        where: { id: course.id },
        data: { thumbnail: match.file }
      });
      updatedCount++;
    } else {
      console.log(`No thumbnail match found for course: "${course.title}"`);
    }
  }

  console.log(`Done! Updated ${updatedCount} courses.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error updating course thumbnails:', err);
  process.exit(1);
});
