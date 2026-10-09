import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import flagsRoutes from './routes/flagsRoutes.js';
import { initDb } from './db/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Feature Flag Lifecycle API'
  });
});

// API Routes
app.use('/api', flagsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

/**
 * Connect to DB with retries for container startup readiness
 */
async function startServerWithDbRetry(maxRetries = 15, delayMs = 3000) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      attempts++;
      console.log(`[DB] Attempting database initialization (attempt ${attempts}/${maxRetries})...`);
      await initDb();
      console.log('[DB] Database connection & schema verified successfully.');
      break;
    } catch (err) {
      console.warn(`[DB] Connection attempt ${attempts} failed: ${err.message}`);
      if (attempts >= maxRetries) {
        console.error('[DB] Maximum database connection attempts reached.');
        // Still allow app to listen so healthcheck or retry endpoint works
      } else {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Feature Flag API Server running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

// Only start listener if run directly (not in test runner)
if (process.env.NODE_ENV !== 'test') {
  startServerWithDbRetry();
}

export default app;
