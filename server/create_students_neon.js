/**
 * Creates 3 test students and enrolls them in courses
 * Uses @neondatabase/serverless which connects over WebSocket (port 443)
 * bypassing the local port 5432 firewall block.
 *
 * Run: node create_students_neon.js
 */

require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('🔍 Connecting to NeonDB via WebSocket (port 443)...');

  // List tables to verify connection
  const tables = await sql`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
  `;
  console.log(`✅ Connected! Found ${tables.length} tables.`);
  if (tables.length === 0) {
    console.error('❌ Database has no tables. Run migrations first: npx prisma migrate deploy');
    process.exit(1);
  }
  tables.forEach(t => console.log('  -', t.tablename));

  // Get all courses
  const courses = await sql`SELECT id, title, slug FROM courses ORDER BY title`;
  console.log(`\n📚 Found ${courses.length} courses:`);
  courses.forEach(c => console.log(`  [${c.id}] ${c.title}`));

  // Match target courses
  const fireSafety = courses.find(c =>
    c.title.toLowerCase().includes('fire safety') || c.slug?.toLowerCase().includes('fire-safety'));
  const riskAssessment = courses.find(c =>
    c.title.toLowerCase().includes('risk assessment') || c.slug?.toLowerCase().includes('risk-assessment') ||
    c.title.toLowerCase().includes('permit to work') || c.slug?.toLowerCase().includes('permit-to-work'));
  const confinedSpace = courses.find(c =>
    c.title.toLowerCase().includes('confined space') || c.slug?.toLowerCase().includes('confined-space'));

  console.log('\n🎯 Matched courses:');
  console.log('  1. Fire Safety & First Aid:', fireSafety ? `✅ ${fireSafety.title}` : '❌ NOT FOUND');
  console.log('  2. Risk Assessment & Permit To Work:', riskAssessment ? `✅ ${riskAssessment.title}` : '❌ NOT FOUND');
  console.log('  3. Confined Space & Work At Height:', confinedSpace ? `✅ ${confinedSpace.title}` : '❌ NOT FOUND');

  if (!fireSafety) {
    console.error('\n❌ Fire Safety course not found. Check course titles above.');
    process.exit(1);
  }

  const password = await bcrypt.hash('Student@123', 12);
  const now = new Date().toISOString();

  const studentsConfig = [
    { name: 'Abdullah', email: 'abdullah@lms.com', courses: [fireSafety].filter(Boolean) },
    { name: 'Ali',      email: 'ali@lms.com',      courses: [fireSafety, riskAssessment].filter(Boolean) },
    { name: 'Usman',   email: 'usman@lms.com',    courses: [fireSafety, riskAssessment, confinedSpace].filter(Boolean) },
  ];

  console.log('\n👤 Creating students and enrollments...\n');

  for (const s of studentsConfig) {
    // Upsert user
    const [user] = await sql`
      INSERT INTO users (id, name, email, password, role, "isVerified", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${s.name}, ${s.email}, ${password}, 'STUDENT', true, true, ${now}, ${now})
      ON CONFLICT (email) DO UPDATE SET
        name       = EXCLUDED.name,
        password   = EXCLUDED.password,
        role       = 'STUDENT',
        "isVerified" = true,
        "isActive" = true,
        "updatedAt" = ${now}
      RETURNING id, name, email
    `;

    console.log(`✅ Student: ${user.name} <${user.email}> [ID: ${user.id}]`);

    for (const course of s.courses) {
      const enrollId = require('crypto').randomUUID();
      await sql`
        INSERT INTO enrollments (id, "studentId", "courseId", status, "enrolledAt", progress, "updatedAt")
        VALUES (${enrollId}, ${user.id}, ${course.id}, 'ACTIVE', ${now}, 0, ${now})
        ON CONFLICT ("studentId", "courseId") DO UPDATE SET
          status     = 'ACTIVE',
          "updatedAt" = ${now}
      `;
      console.log(`   📚 Enrolled in: "${course.title}"`);
    }
    console.log();
  }

  console.log('🎉 Done! All 3 students created and enrolled.');
  console.log('\n─────────────────────────────────────────');
  console.log('LOGIN DETAILS:');
  console.log('  Abdullah  │ abdullah@lms.com  │ Student@123');
  console.log('  Ali       │ ali@lms.com       │ Student@123');
  console.log('  Usman     │ usman@lms.com     │ Student@123');
  console.log('─────────────────────────────────────────');
}

main().catch(e => {
  console.error('\n❌ Error:', e.message);
  if (e.message.includes('relation') && e.message.includes('does not exist')) {
    console.error('→ Table not found. Make sure the database is migrated. Run: npx prisma migrate deploy');
  }
  process.exit(1);
});
