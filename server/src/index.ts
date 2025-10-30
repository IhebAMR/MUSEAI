import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
import { getAutoCert, getManualCert, getSelfSigned } from './utils/localHttps';
import { connectDB } from './config/db';
import authRouter from './routes/auth';
import songsRouter from './routes/songs';
import playlistsRouter from './routes/playlists';
import aiRouter from './routes/ai';
import spotifyRouter from './routes/spotify';
import youtubeRouter from './routes/youtube';
dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173,https://museai.local:5173,http://museai.local:5173';
const MEDIA_DIR = process.env.MEDIA_DIR || path.resolve(__dirname, '..', 'media');

const allowedOrigins = CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Spotify-Token'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200,
}));
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
app.use('/api/youtube', youtubeRouter);

;(async () => {
  await connectDB();
  const httpsMode = (process.env.HTTPS_MODE || '').toLowerCase(); // 'off' | 'manual' | 'auto'
  const httpsEnabled = (process.env.HTTPS_ENABLED || '').toLowerCase() === 'true';
  const shouldHttps = httpsMode === 'auto' || httpsMode === 'manual' || httpsEnabled;
  if (shouldHttps) {
    let creds = null as null | { key: Buffer; cert: Buffer };
    if (httpsMode === 'manual' || httpsEnabled) {
      const keyPath = process.env.HTTPS_KEY_PATH || '';
      const certPath = process.env.HTTPS_CERT_PATH || '';
      creds = getManualCert(keyPath, certPath);
    } else if (httpsMode === 'auto') {
      const host = process.env.HTTPS_HOSTNAME || 'museai.local';
      creds = await getAutoCert(host);
      if (!creds) {
        console.warn('[WARN] devcert failed; generating self-signed cert instead.');
        creds = getSelfSigned(host);
      }
    }
    if (creds) {
      const host = process.env.HTTPS_HOSTNAME || 'localhost';
      https.createServer({ key: creds.key, cert: creds.cert }, app).listen(PORT, () => {
        console.log(`Server listening on https://${host}:${PORT}`);
      });
      return;
    } else {
      console.warn('[WARN] HTTPS requested but no credentials available. Falling back to HTTP.');
    }
  }
  app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
})();
