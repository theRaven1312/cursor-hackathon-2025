import express from 'express';
import cors from 'cors';
import { initDB } from './database.js';
import { config } from './config.js';

// Routes
import authRoutes from './routes/auth.js';
import photosRoutes from './routes/photos.js';
import commentsRoutes from './routes/comments.js';
import aiRoutes from './routes/ai.js';

const app = express();

// Initialize database
initDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173', 
    'http://0.0.0.0:5173', 
    'http://100.101.196.116:5173',
    'https://localhost:5173',
    'https://127.0.0.1:5173',
    'https://0.0.0.0:5173',
    'https://100.101.196.116:5173'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GeoSnap API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.PORT,'0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🌍 GeoSnap API Server                          ║
  ║                                                   ║
  ║   Server running on port ${config.PORT}                   ║
  ║   http://localhost:${config.PORT}                         ║
  ║                                                   ║
  ║   Database: JSON File (./data)                    ║
  ║                                                   ║
  ║   API Endpoints:                                  ║
  ║   • POST   /api/auth/register                     ║
  ║   • POST   /api/auth/login                        ║
  ║   • GET    /api/auth/me                           ║
  ║   • GET    /api/photos                            ║
  ║   • POST   /api/photos                            ║
  ║   • GET    /api/photos/:id                        ║
  ║   • PUT    /api/photos/:id                        ║
  ║   • DELETE /api/photos/:id                        ║
  ║   • POST   /api/photos/:id/like                   ║
  ║   • GET    /api/comments/photo/:photoId           ║
  ║   • POST   /api/comments/photo/:photoId           ║
  ║   • PUT    /api/comments/:id                      ║
  ║   • DELETE /api/comments/:id                      ║
  ║   • POST   /api/ai/suggest     (Gemini 2.0 Flash) ║
  ║   • POST   /api/ai/chat       (Gemini 2.0 Flash) ║
  ║   • GET    /api/ai/categories                     ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});
