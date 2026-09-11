import 'dotenv/config'; // MUST BE LINE 1
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import userSpaceRoutes from './routes/userSpace.routes';
import userRoutes from './routes/user.routes';

const app = express();

app.use(helmet());

// 2. Updated CORS to accept local mobile & Expo connections
app.use(
  cors({
    origin: true, // Allows requests from mobile app IP & local frontend
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json()); 

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many auth requests from this IP.' },
});

// Mounted Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user/spaces', userSpaceRoutes);
app.use('/api/user', userRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = Number(process.env.PORT) || 5000;

// 3. Bind to 0.0.0.0 so physical devices on your Wi-Fi can connect
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://10.46.100.131:${PORT}`);
});