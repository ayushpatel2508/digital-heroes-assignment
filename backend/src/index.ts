import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import stripeRoutes from './routes/stripe';
import scoreRoutes from './routes/scoreRoutes';
import charityRoutes from './routes/charityRoutes';
import drawRoutes from './routes/drawRoutes';
import adminRoutes from './routes/admin';
import winnerRoutes from './routes/winnerRoutes';
import { stripeController } from './controllers/stripeController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-stripe-signature', 'x-user-id']
}));

// Webhook endpoint MUST be defined BEFORE express.json() to get the raw body
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/winners', winnerRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`⛳ Backend server running at http://localhost:${PORT}`);
  console.log(`📦 Mode: ${process.env.NODE_ENV || 'development'}`);
});
