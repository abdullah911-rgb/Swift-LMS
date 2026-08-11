const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { neonConfig, Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Use WebSocket for Neon serverless driver — routes over HTTPS (port 443) not raw TCP 5432
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prisma;
