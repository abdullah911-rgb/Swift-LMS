if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL
    .replace(/&channel_binding=[^&]*/g, '')
    .replace(/\?channel_binding=[^&]*&/g, '?')
    .replace(/\?channel_binding=[^&]*/g, '');
}

const url = require('url');
const app = require('../server/src/app');
const prisma = require('../server/src/config/db');

module.exports = async (req, res) => {
  try {
    // Ensure DB connection is open
    await prisma.$connect();
  } catch (err) {
    console.error('Prisma connection error in serverless handler:', err);
  }

  // Restore the original URL rewritten by Vercel
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.query && parsedUrl.query._path) {
    const originalPath = '/api/' + parsedUrl.query._path;
    
    // Retain any other query parameters from the original request
    const queryParams = { ...parsedUrl.query };
    delete queryParams._path;
    
    const queryString = new URLSearchParams(queryParams).toString();
    req.url = originalPath + (queryString ? '?' + queryString : '');
  } else if (parsedUrl.query && parsedUrl.query._uploadPath) {
    const originalPath = '/uploads/' + parsedUrl.query._uploadPath;
    
    const queryParams = { ...parsedUrl.query };
    delete queryParams._uploadPath;
    
    const queryString = new URLSearchParams(queryParams).toString();
    req.url = originalPath + (queryString ? '?' + queryString : '');
  }

  return app(req, res);
};
