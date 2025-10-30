import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import songsRouter from './routes/songs';
import playlistsRouter from './routes/playlists';
import aiRouter from './routes/ai';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'museai-server' });
});

app.use('/api/auth', authRouter);
app.use('/api/songs', songsRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/ai', aiRouter);

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
})();
