require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'enrollments' 
    ORDER BY ordinal_position
  `;
  console.log('enrollments columns:');
  cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

  const ucols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position
  `;
  console.log('\nusers columns:');
  ucols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
}
main().catch(e => console.error(e.message));
