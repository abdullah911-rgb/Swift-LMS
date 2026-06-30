const app = require('./src/app');
const config = require('./src/config/env');
const prisma = require('./src/config/db');

const PORT = config.port || 5000;

async function startServer() {
  try {
    // Test Database connection
    await prisma.$connect();
    console.log('🔌 Connected to PostgreSQL Database via Prisma.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${config.env} mode on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
