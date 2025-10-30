import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { connectDB } from './config/db';
import authRouter from './routes/auth';
import songsRouter from './routes/songs';
import playlistsRouter from './routes/playlists';
import aiRouter from './routes/ai';
import spotifyRouter from './routes/spotify';
dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const MEDIA_DIR = process.env.MEDIA_DIR || path.resolve(__dirname, '..', 'media');

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));


// Static media serving (drop audio files into server/media or set MEDIA_DIR)
if (fs.existsSync(MEDIA_DIR)) {
  app.use('/media', express.static(MEDIA_DIR));
}
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'museai-server' });
});

app.use('/api/auth', authRouter);
app.use('/api/songs', songsRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/spotify', spotifyRouter);

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
})();
