const { PrismaClient } = require('@prisma/client');

let prisma;

const connectionString = (process.env.DATABASE_URL || '')
  .replace(/&channel_binding=[^&]*/g, '')
  .replace(/\?channel_binding=[^&]*&/g, '?')
  .replace(/\?channel_binding=[^&]*/g, '');

if (connectionString && connectionString.includes('neon.tech')) {
  try {
    const { Pool, neonConfig } = require('@neondatabase/serverless');
    const { PrismaNeon } = require('@prisma/adapter-neon');
    const ws = require('ws');
    neonConfig.webSocketConstructor = ws;

    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch (err) {
    console.warn('Neon adapter init fallback to standard client:', err.message);
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
} else {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

module.exports = prisma;
