const https = require('https');

const NEON_CONNECTION = 'postgresql://neondb_owner:npg_CGaAps9zMDw4@ep-small-bar-awdltk01-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const NEON_HOST = 'ep-small-bar-awdltk01-pooler.c-12.us-east-1.aws.neon.tech';
const NEON_USER = 'neondb_owner';
const NEON_PASS = 'npg_CGaAps9zMDw4';

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
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Parse error: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // List all schemas and tables including non-public
  const r1 = await sqlQuery(`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`);
  console.log('Schemas:', (r1.rows||[]).map(r=>r.schema_name).join(', '));

  const r2 = await sqlQuery(
    `SELECT table_schema, table_name FROM information_schema.tables 
     WHERE table_schema NOT IN ('pg_catalog','information_schema') 
     ORDER BY table_schema, table_name`
  );
  console.log('\nAll user tables:');
  (r2.rows||[]).forEach(r => console.log(` - ${r.table_schema}.${r.table_name}`));

  if ((r2.rows||[]).length === 0) {
    console.log('\n⚠️  No tables found. Database appears to be empty / unmigrated.');
  }
}

main().catch(e => console.error(e.message));
