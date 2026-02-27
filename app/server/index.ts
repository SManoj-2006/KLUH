import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import profileRoutes from './routes/profile.js';
import jobRoutes from './routes/jobs.js';
import skillGapRoutes from './routes/skillGap.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API Routes - MUST come before static files
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/skill-gap', skillGapRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Serve static files from dist folder
const staticDir = path.join(__dirname, '../dist');
if (fs.existsSync(staticDir)) {
  console.log('Serving static files from:', staticDir);
  app.use(express.static(staticDir));
  
  // Serve index.html for all non-API routes (SPA support)
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(staticDir, 'index.html'));
    } else {
      next();
    }
  });
} else {
  console.warn('Static directory not found:', staticDir);
}

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Don't send HTML errors for API routes
  if (req.path.startsWith('/api')) {
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Internal server error' 
    });
  } else {
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
