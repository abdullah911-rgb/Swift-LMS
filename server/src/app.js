const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const zoomRoutes = require('./routes/zoomRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const quizRoutes = require('./routes/quizRoutes');

const app = express();


// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    const allowed = [
      config.clientUrl,
      'http://localhost:5173',
      'http://localhost:3000',
    ];

    // Also allow any *.vercel.app URL for preview deployments
    if (
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiter
app.use('/api', generalLimiter);

// Static uploads directory (use /tmp/uploads for serverless environments)
const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV;
const uploadDir = isServerless 
  ? '/tmp/uploads' 
  : path.join(__dirname, '../uploads');

const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', (req, res, next) => {
  if (req.path.endsWith('.jfif')) {
    res.setHeader('Content-Type', 'image/jpeg');
  }
  next();
}, express.static(uploadDir));


// Routes
app.get('/api/temp-update-db-911', async (req, res) => {
  const prisma = require('./config/db');
  try {
    console.log('🔄 Updating database records via temp endpoint...');
    const u1 = await prisma.course.updateMany({
      where: { slug: 'nebosh-international-safety-course' },
      data: { title: 'Nebosh International Safety Course' }
    });
    const u2 = await prisma.course.updateMany({
      where: { slug: 'fire-safety-first-aid-training' },
      data: { thumbnail: '/uploads/fire-safety-first-aid-training.jfif' }
    });
    const u3 = await prisma.course.updateMany({
      where: { slug: 'hse-officer-training' },
      data: { thumbnail: '/uploads/hse-officer-training.jfif' }
    });
    const u4 = await prisma.course.updateMany({
      where: { slug: 'risk-assessment-permit-to-work-training' },
      data: { thumbnail: '/uploads/risk-assessment-permit-to-work-training.jfif' }
    });
    res.json({
      success: true,
      message: 'Database updated successfully!',
      updates: {
        neboshCourseTitle: u1.count,
        fireSafetyThumbnail: u2.count,
        hseOfficerThumbnail: u3.count,
        riskAssessmentThumbnail: u4.count,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quiz', quizRoutes);


// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy.', timestamp: new Date() });
});

// 404 Route handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
