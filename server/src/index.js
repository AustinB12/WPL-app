import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pico from 'picocolors';
import { init_email_transporter } from './config/email.js';
import analytics_routes from './routes/analytics.js';
import emails_routes from './routes/emails.js';
import branches_routes from './routes/library_branches.js';
import item_copies_routes from './routes/library_item_copies.js';
import library_items_routes from './routes/library_items.js';
import patrons_routes from './routes/patrons.js';
import reports_routes from './routes/reports.js';
import reservations_routes from './routes/reservations.js';
import settings_routes from './routes/settings.js';
import transactions_routes from './routes/transactions.js';
import images_routes from './routes/images.js';
import {
  start_email_worker,
  stop_email_worker,
} from './services/email_worker.js';
import {
  start_overdue_checker,
  stop_overdue_checker,
} from './services/overdue_checker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const api_base = process.env.API_BASE_URL || '/api/v1';

const is_dev =
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV !== 'production' ||
  !process.env.NODE_ENV;

const url = is_dev ? 'localhost' : '0.0.0.0';

app.use(
  cors({
    referredPolicy: 'no-referrer',
    credentials: false,
  }),
);

// Middleware
app.use(
  helmet({
    referrerPolicy: {
      policy: ['unsafe-url'],
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin image requests
  }),
); // Security headers with referrer policy
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (increased for image uploads)
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Rate limiting
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || '9000', 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '9000', 10) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Default route
app.get('/', (_req, res) => {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      library_items: `${api_base}/library-items`,
      patrons: `${api_base}/patrons`,
      transactions: `${api_base}/transactions`,
      reservations: `${api_base}/reservations`,
      branches: `${api_base}/branches`,
      emails: `${api_base}/emails`,
      item_copies: `${api_base}/item-copies`,
      settings: `${api_base}/settings`,
      analytics: `${api_base}/analytics`,
      images: `${api_base}/images`,
    },
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toLocaleString(),
  });
});

// Mount API routes
app.use(`${api_base}/analytics`, analytics_routes);
app.use(`${api_base}/library-items`, library_items_routes);
app.use(`${api_base}/patrons`, patrons_routes);
app.use(`${api_base}/transactions`, transactions_routes);
app.use(`${api_base}/reservations`, reservations_routes);
app.use(`${api_base}/branches`, branches_routes);
app.use(`${api_base}/emails`, emails_routes);
app.use(`${api_base}/item-copies`, item_copies_routes);
app.use(`${api_base}/reports`, reports_routes);
app.use(`${api_base}/settings`, settings_routes);
app.use(`${api_base}/images`, images_routes);
// 404 handler (must come after routes)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
  });
});

// Start server
const server = app.listen(PORT, url, async () => {
  console.log(
    pico.bgGreen(
      pico.bold(
        `🚀 Server running on http://${url}:${PORT} | 💻 Environment: ${!is_dev ? 'PROD' : 'DEV'}`,
      ),
    ),
  );

  // Initialize email system
  try {
    await init_email_transporter();
    // Start background email worker
    start_email_worker();
    // Start daily overdue checker
    start_overdue_checker();
  } catch (_error) {
    console.error(
      pico.red(
        '⚠️  Email system initialization failed, emails will not be sent',
      ),
    );
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(pico.yellow('SIGTERM signal received: closing HTTP server'));
  stop_email_worker();
  stop_overdue_checker();
  server.close(() => {
    console.log(pico.yellow('HTTP server closed'));
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(pico.yellow('\nSIGINT signal received: closing HTTP server'));
  stop_email_worker();
  stop_overdue_checker();
  server.close(() => {
    console.log(pico.yellow('HTTP server closed'));
    process.exit(0);
  });
});

export default app;
