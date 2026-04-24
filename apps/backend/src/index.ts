import path from 'path';
import dotenv from 'dotenv';

// Load env from apps/backend/.env (ts-node-dev does not automatically load it)
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { Server } from 'socket.io';

import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

// Initialize auth service (this sets up OAuth strategies)
import './services/auth.service';

// Routes
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import projectRoutes from './routes/project.routes';
import diagramRoutes from './routes/diagram.routes';
import notesRoutes from './routes/notes.routes';
import commentRoutes from './routes/comment.routes';
import aiRoutes from './routes/ai.routes';
import exportRoutes from './routes/export.routes';
import templateRoutes from './routes/template.routes';
import billingRoutes from './routes/billing.routes';
import notificationRoutes from './routes/notification.routes';
import searchRoutes from './routes/search.routes';

// Socket handlers
import { initSocketHandlers } from './sockets';

const app = express();
const httpServer = http.createServer(app);

// CORS configuration for multiple origins
const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://skemly-ai-frontend-fbyj74lpq-hemanshutalas-projects.vercel.app',
  'https://skemly.vercel.app',
];
if (process.env.FRONTEND_URL) {
  corsOrigins.push(process.env.FRONTEND_URL);
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
});
initSocketHandlers(io);

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cookieParser());

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(passport.initialize());
app.use(rateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/workspaces`, workspaceRoutes);
app.use(`${API}/workspaces`, projectRoutes);
app.use(`${API}/diagrams`, diagramRoutes);
app.use(`${API}/notes`, notesRoutes);
app.use(`${API}/diagrams`, commentRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/export`, exportRoutes);
app.use(`${API}/templates`, templateRoutes);
app.use(`${API}/billing`, billingRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/search`, searchRoutes);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    await connectRedis();
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

export { io };
