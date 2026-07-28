const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllCourses() {
  try {
    console.log('Deleting all courses...');
    
    // Delete all enrollments first (due to foreign key constraint)
    await prisma.enrollment.deleteMany({});
    console.log('✅ Deleted all enrollments');
    
    // Delete all courses
    const result = await prisma.course.deleteMany({});
    console.log(`✅ Deleted ${result.count} courses`);
    
    // Delete all categories
    const categoryResult = await prisma.category.deleteMany({});
    console.log(`✅ Deleted ${categoryResult.count} categories`);
    
    console.log('🎉 All courses and categories deleted successfully!');
  } catch (error) {
    console.error('Error deleting courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllCourses();
