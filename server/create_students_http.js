/**
 * Creates 3 test students and enrolls them via Neon HTTP API
 * Run: node create_students_http.js
 */
const https = require('https');
const bcrypt = require('bcryptjs');

const NEON_CONNECTION = 'postgresql://neondb_owner:npg_CGaAps9zMDw4@ep-small-bar-awdltk01-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Neon HTTP endpoint (serverless driver over HTTPS port 443)
const NEON_HOST = 'ep-small-bar-awdltk01-pooler.c-12.us-east-1.aws.neon.tech';
const NEON_USER = 'neondb_owner';
const NEON_PASS = 'npg_CGaAps9zMDw4';
const NEON_DB   = 'neondb';

function sqlQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql, params });
    const auth = Buffer.from(`${NEON_USER}:${NEON_PASS}`).toString('base64');

    const options = {
      hostname: NEON_HOST,
      port: 443,
      path: '/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Basic ${auth}`,
        'Neon-Connection-String': NEON_CONNECTION,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error));
          else resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🔍 Fetching courses from database via Neon HTTP API...');

  const coursesResult = await sqlQuery('SELECT id, title, slug FROM courses ORDER BY title');
  const courses = coursesResult.rows || [];
  
  console.log(`Found ${courses.length} courses:`);
  courses.forEach(c => console.log(`  - ${c.title} [${c.id}]`));

  // Find target courses
  const fireSafety = courses.find(c =>
    c.title.toLowerCase().includes('fire safety') || c.slug?.toLowerCase().includes('fire-safety'));
  const riskAssessment = courses.find(c =>
    c.title.toLowerCase().includes('risk assessment') || c.slug?.toLowerCase().includes('risk-assessment'));
  const confinedSpace = courses.find(c =>
    c.title.toLowerCase().includes('confined space') || c.slug?.toLowerCase().includes('confined-space'));

  console.log('\nMatched courses:');
  console.log('1. Fire Safety & First Aid:', fireSafety ? fireSafety.title : '❌ NOT FOUND');
  console.log('2. Risk Assessment & Permit To Work:', riskAssessment ? riskAssessment.title : '❌ NOT FOUND');
  console.log('3. Confined Space & Work At Height:', confinedSpace ? confinedSpace.title : '❌ NOT FOUND');

  if (!fireSafety) {
    console.error('\n❌ Could not find Fire Safety course. Aborting.');
    return;
  }

  const password = await bcrypt.hash('Student@123', 12);
  const now = new Date().toISOString();

  const students = [
    {
      name: 'Abdullah',
      email: 'abdullah@lms.com',
      courses: [fireSafety].filter(Boolean),
    },
    {
      name: 'Ali',
      email: 'ali@lms.com',
      courses: [fireSafety, riskAssessment].filter(Boolean),
    },
    {
      name: 'Usman',
      email: 'usman@lms.com',
      courses: [fireSafety, riskAssessment, confinedSpace].filter(Boolean),
    },
  ];

  console.log('\n👤 Creating students...');

  for (const s of students) {
    // Upsert user
    const userResult = await sqlQuery(
      `INSERT INTO users (name, email, password, role, "isVerified", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'STUDENT', true, true, $4, $4)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password,
         role = 'STUDENT',
         "isVerified" = true,
         "isActive" = true,
         "updatedAt" = $4
       RETURNING id, name, email`,
      [s.name, s.email, password, now]
    );

    const user = userResult.rows[0];
    console.log(`\n✅ Student: ${user.name} (${user.email}) [ID: ${user.id}]`);

    for (const course of s.courses) {
      await sqlQuery(
        `INSERT INTO enrollments ("studentId", "courseId", status, "enrolledAt", progress, "createdAt", "updatedAt")
         VALUES ($1, $2, 'ACTIVE', $3, 0, $3, $3)
         ON CONFLICT ("studentId", "courseId") DO UPDATE SET
           status = 'ACTIVE',
           "updatedAt" = $3`,
        [user.id, course.id, now]
      );
      console.log(`   📚 Enrolled in: "${course.title}"`);
    }
  }

  console.log('\n🎉 All students created and enrolled!');
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
